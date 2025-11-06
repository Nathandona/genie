import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

interface CheckoutBody {
  priceId: string;
  successUrl?: string;
}

interface CancelParams {
  id: string;
}

const polarRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Get available products/pricing
  app.get(
    '/polar/products',
    {
      schema: {
        response: {
          200: z.object({
            products: z.array(z.any()),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const products = await app.polar.products.list({
          limit: 100,
        });
        return reply.send({ products: products.result?.items || [] });
      } catch (error) {
        app.log.error(error, 'Failed to fetch products');
        return reply.status(500).send({ error: 'Failed to fetch products' });
      }
    }
  );

  // Create checkout session
  app.post<{ Body: CheckoutBody }>(
    '/polar/checkout',
    {
      onRequest: [app.authenticate],
      schema: {
        body: z.object({
          priceId: z.string(),
          successUrl: z.string().url().optional(),
        }),
        response: {
          200: z.object({
            checkoutUrl: z.string(),
            checkoutId: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { priceId, successUrl } = request.body;
      const userId = request.user.sub;
      const userEmail = request.user.email;

      try {
        // Create checkout using Polar SDK
        const checkout = await app.polar.checkouts.create({
          product_price_id: priceId,
          customer_email: userEmail,
          customer_metadata: {
            userId,
          },
          success_url: successUrl || `${process.env.WEB_URL || 'http://localhost:3000'}/dashboard?checkout=success`,
        } as any);

        return reply.send({
          checkoutUrl: checkout.url || '',
          checkoutId: checkout.id,
        });
      } catch (error) {
        app.log.error(error, 'Failed to create checkout');
        return reply.status(500).send({ error: 'Failed to create checkout session' });
      }
    }
  );

  // Get user's subscriptions
  app.get(
    '/polar/subscriptions',
    {
      onRequest: [app.authenticate],
      schema: {
        response: {
          200: z.object({
            subscriptions: z.array(z.any()),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.sub;

      try {
        // Get subscriptions for the current user
        const subscriptions = await app.polar.subscriptions.list({
          limit: 100,
        });

        // Filter by userId in metadata
        const userSubscriptions = subscriptions.result?.items?.filter(
          (sub: any) => sub.metadata?.userId === userId
        ) || [];

        return reply.send({ subscriptions: userSubscriptions });
      } catch (error) {
        app.log.error(error, 'Failed to fetch subscriptions');
        return reply.status(500).send({ error: 'Failed to fetch subscriptions' });
      }
    }
  );

  // Update subscription to cancel at period end
  app.post<{ Params: CancelParams }>(
    '/polar/subscriptions/:id/cancel',
    {
      onRequest: [app.authenticate],
      schema: {
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        await app.polar.subscriptions.update({
          id,
          subscriptionUpdate: {
            cancelAtPeriodEnd: true,
          },
        });

        return reply.send({ success: true });
      } catch (error) {
        app.log.error(error, 'Failed to cancel subscription');
        return reply.status(500).send({ error: 'Failed to cancel subscription' });
      }
    }
  );

  // Webhook endpoint for Polar events
  app.post(
    '/polar/webhook',
    async (request, reply) => {
      try {
        const event = request.body as any;

        app.log.info({ eventType: event?.type }, 'Received Polar webhook');

        // Handle different webhook events
        if (event && event.type && event.data) {
          switch (event.type) {
            case 'checkout.created':
              app.log.info({ checkoutId: event.data.id }, 'Checkout created');
              break;

            case 'checkout.updated':
              app.log.info({ checkoutId: event.data.id }, 'Checkout updated');
              break;

            case 'order.created':
              app.log.info({ orderId: event.data.id }, 'Order created');
              break;

            case 'subscription.created':
              app.log.info({ subscriptionId: event.data.id }, 'Subscription created');
              await handleSubscriptionCreated(app, event.data);
              break;

            case 'subscription.updated':
              app.log.info({ subscriptionId: event.data.id }, 'Subscription updated');
              await handleSubscriptionUpdated(app, event.data);
              break;

            case 'subscription.revoked':
              app.log.info({ subscriptionId: event.data.id }, 'Subscription revoked');
              await handleSubscriptionCanceled(app, event.data);
              break;

            default:
              app.log.warn({ eventType: event.type }, 'Unhandled webhook event');
          }
        }

        return reply.send({ received: true });
      } catch (error) {
        app.log.error(error, 'Webhook processing failed');
        return reply.status(400).send({ error: 'Webhook processing failed' });
      }
    }
  );

  // Get customer portal URL
  app.get(
    '/polar/portal',
    {
      onRequest: [app.authenticate],
      schema: {
        response: {
          200: z.object({
            url: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        // Direct users to Polar's dashboard
        const portalUrl = `https://polar.sh/dashboard`;

        return reply.send({ url: portalUrl });
      } catch (error) {
        app.log.error(error, 'Failed to get portal URL');
        return reply.status(500).send({ error: 'Failed to get portal URL' });
      }
    }
  );
};

// Helper functions to handle subscription events
async function handleSubscriptionCreated(app: any, subscription: any) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      app.log.warn('No userId in subscription metadata');
      return;
    }

    // Update user in database with subscription info
    await app.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionTier: subscription.product?.name || 'unknown',
      },
    });

    app.log.info({ userId, subscriptionId: subscription.id }, 'User subscription created');
  } catch (error) {
    app.log.error(error, 'Failed to handle subscription created');
  }
}

async function handleSubscriptionUpdated(app: any, subscription: any) {
  try {
    // Update subscription status in database
    await app.prisma.user.updateMany({
      where: { subscriptionId: subscription.id },
      data: {
        subscriptionStatus: subscription.status,
      },
    });

    app.log.info({ subscriptionId: subscription.id }, 'Subscription updated');
  } catch (error) {
    app.log.error(error, 'Failed to handle subscription updated');
  }
}

async function handleSubscriptionCanceled(app: any, subscription: any) {
  try {
    // Update subscription status in database
    await app.prisma.user.updateMany({
      where: { subscriptionId: subscription.id },
      data: {
        subscriptionStatus: 'canceled',
      },
    });

    app.log.info({ subscriptionId: subscription.id }, 'Subscription canceled');
  } catch (error) {
    app.log.error(error, 'Failed to handle subscription canceled');
  }
}

export default polarRoutes;

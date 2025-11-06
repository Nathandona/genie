import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Polar } from '@polar-sh/sdk';
import { env } from '../env.js';

declare module 'fastify' {
  interface FastifyInstance {
    polar: Polar;
  }
}

const polarPlugin: FastifyPluginAsync = async (fastify) => {
  const polar = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
  });

  fastify.decorate('polar', polar);

  fastify.log.info('Polar SDK initialized');
};

export default fp(polarPlugin, {
  name: 'polar',
});

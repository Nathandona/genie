import { load } from 'cheerio';
import type { PricingContent } from '@genie/ui-library';

export interface PricingPlanCandidate {
  name?: string;
  price?: string;
  period?: string;
  description?: string;
  features: string[];
  button?: { text: string; url?: string; highlighted?: boolean };
  popular?: boolean;
  confidence: number;
}

export interface PricingSectionCandidate {
  title?: string;
  subtitle?: string;
  plans: PricingPlanCandidate[];
  confidence: number;
}

/**
 * Parse HTML to find potential pricing sections
 */
export function findPricingSections(html: string): PricingSectionCandidate[] {
  const $ = load(html);
  const candidates: PricingSectionCandidate[] = [];

  // Look for common pricing section patterns
  const pricingSelectors = [
    'section.pricing',
    '.pricing-section',
    '[class*="pricing"]',
    '.plans',
    '.subscription',
    '.rates'
  ];

  pricingSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const candidate = analyzePricingElement($, element);
      if (candidate.confidence > 0.4 && candidate.plans.length > 0) {
        candidates.push(candidate);
      }
    });
  });

  // Look for tables that might be pricing tables
  $('table').each((_, element) => {
    const $el = $(element);
    const headers = $el.find('th, thead td');
    const rows = $el.find('tbody tr');

    // Check if it looks like a pricing table
    const headerText = headers.text().toLowerCase();
    if (headerText.includes('price') || headerText.includes('plan') || headerText.includes('$')) {
      const candidate = analyzePricingTable($, element);
      if (candidate.confidence > 0.3) {
        candidates.push(candidate);
      }
    }
  });

  // Look for repeated pricing-like patterns (cards with prices)
  const priceRegex = /\$[\d,]+(?:\.\d{2})?/g;
  const priceElements = $(`*:contains("$")`).filter((_, el) => priceRegex.test($(el).text()));

  if (priceElements.length >= 3) {
    // Group price elements by container
    const containers = new Map<string, cheerio.Cheerio[]>();

    priceElements.each((_, el) => {
      const $container = $(el).closest('.card, .plan, .pricing, [class*="col"], article');
      const key = $container.length ? generateSelector($container) : 'body';

      if (!containers.has(key)) {
        containers.set(key, []);
      }
      containers.get(key)!.push($(el));
    });

    // Analyze containers with multiple price elements
    containers.forEach((elements, key) => {
      if (elements.length >= 2) {
        const $container = key === 'body' ? $('body') : $(key);
        const candidate = analyzePricingElement($, $container[0]);
        if (candidate.confidence > 0.2) {
          candidates.push(candidate);
        }
      }
    });
  }

  // Sort by confidence and remove duplicates
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate, index, arr) =>
      index === arr.findIndex(c => JSON.stringify(c.plans) === JSON.stringify(candidate.plans))
    )
    .slice(0, 2); // Top 2 candidates
}

/**
 * Analyze a pricing element
 */
function analyzePricingElement($: cheerio.Root, element: cheerio.Element): PricingSectionCandidate {
  const $el = $(element);
  let confidence = 0;
  const candidate: PricingSectionCandidate = {
    plans: [],
    confidence: 0
  };

  // Check for pricing-like classes
  const classes = $el.attr('class') || '';
  if (classes.includes('pricing') || classes.includes('plans') || classes.includes('subscription')) {
    confidence += 0.3;
  }

  // Find section title
  const $title = $el.find('h2, h3, .title').first();
  if ($title.length) {
    candidate.title = $title.text().trim();
    confidence += 0.2;
  }

  // Find section subtitle
  const $subtitle = $el.find('p').first();
  if ($subtitle.length && $subtitle.text().trim().length > 10) {
    candidate.subtitle = $subtitle.text().trim();
    confidence += 0.1;
  }

  // Find pricing plans
  const planSelectors = [
    '.plan',
    '.pricing-plan',
    '.card',
    '[class*="plan"]',
    '[class*="tier"]',
    'article'
  ];

  planSelectors.forEach(selector => {
    $el.find(selector).each((_, planEl) => {
      const plan = analyzePricingPlan($, planEl);
      if (plan.confidence > 0.4) {
        candidate.plans.push(plan);
      }
    });
  });

  if (candidate.plans.length >= 2) {
    confidence += Math.min(candidate.plans.length * 0.2, 0.5);
  }

  candidate.confidence = Math.min(confidence, 1.0);
  return candidate;
}

/**
 * Analyze a pricing table
 */
function analyzePricingTable($: cheerio.Root, element: cheerio.Element): PricingSectionCandidate {
  const $table = $(element);
  const candidate: PricingSectionCandidate = {
    plans: [],
    confidence: 0.3
  };

  const $headers = $table.find('thead th, thead td');
  const $rows = $table.find('tbody tr');

  // Extract plan names from headers (skip first column which is usually features)
  const planNames: string[] = [];
  $headers.each((index, header) => {
    if (index > 0) { // Skip first column
      const name = $(header).text().trim();
      if (name) planNames.push(name);
    }
  });

  // Extract features and pricing from rows
  const features: string[] = [];
  const prices: string[] = [];

  $rows.each((_, row) => {
    const $cells = $(row).find('td, th');
    const featureName = $($cells[0]).text().trim();

    if (featureName) {
      features.push(featureName);

      // Extract prices from other columns
      $cells.each((index, cell) => {
        if (index > 0 && index <= planNames.length) {
          const cellText = $(cell).text().trim();
          const priceMatch = cellText.match(/\$[\d,]+(?:\.\d{2})?/);
          if (priceMatch) {
            if (!prices[index - 1]) prices[index - 1] = '';
            prices[index - 1] += cellText + ' ';
          }
        }
      });
    }
  });

  // Create plans from extracted data
  planNames.forEach((name, index) => {
    candidate.plans.push({
      name,
      price: prices[index]?.trim() || '$0',
      features: features.slice(0, 5), // Limit features
      button: { text: 'Choose Plan' },
      confidence: 0.6
    });
  });

  return candidate;
}

/**
 * Analyze a single pricing plan
 */
function analyzePricingPlan($: cheerio.Root, element: cheerio.Element): PricingPlanCandidate {
  const $el = $(element);
  let confidence = 0;
  const plan: PricingPlanCandidate = {
    features: [],
    confidence: 0
  };

  // Find plan name
  const $name = $el.find('h3, h4, .name, .title').first();
  if ($name.length) {
    plan.name = $name.text().trim();
    confidence += 0.3;
  }

  // Find price
  const priceRegex = /\$[\d,]+(?:\.\d{2})?(?:\s*\/\s*(month|year|day|week))?/gi;
  const text = $el.text();
  const priceMatch = text.match(priceRegex);

  if (priceMatch) {
    const priceText = priceMatch[0];
    const periodMatch = priceText.match(/\/\s*(month|year|day|week)/i);
    plan.price = priceText.replace(/\/\s*(month|year|day|week)/i, '').trim();
    if (periodMatch) {
      plan.period = periodMatch[1].toLowerCase();
    }
    confidence += 0.4;
  }

  // Find features
  const $features = $el.find('ul li, .feature, [class*="feature"]');
  $features.each((_, feature) => {
    const featureText = $(feature).text().trim();
    if (featureText && featureText.length > 3) {
      plan.features.push(featureText);
    }
  });

  // Also look for checkmark lists
  $el.find('li').each((_, li) => {
    const liText = $(li).text().trim();
    if (liText && liText.length > 3 && liText.length < 100) {
      // Check if it starts with a checkmark or bullet
      if (!plan.features.includes(liText)) {
        plan.features.push(liText);
      }
    }
  });

  // Limit features to avoid too many
  plan.features = plan.features.slice(0, 8);

  // Find button
  const $button = $el.find('a[href], button, .btn, [class*="button"]').first();
  if ($button.length) {
    const buttonText = $button.text().trim();
    const href = $button.attr('href');
    if (buttonText && buttonText !== plan.name) {
      plan.button = {
        text: buttonText,
        url: href && !href.startsWith('#') ? href : undefined
      };
      confidence += 0.2;
    }
  }

  // Check for popular badge
  const popularIndicators = ['popular', 'most', 'best', 'recommended'];
  const elementText = $el.text().toLowerCase();
  plan.popular = popularIndicators.some(indicator => elementText.includes(indicator));

  plan.confidence = Math.min(confidence, 1.0);
  return plan;
}

/**
 * Generate a CSS selector for the element
 */
function generateSelector($el: cheerio.Cheerio): string {
  const id = $el.attr('id');
  if (id) return `#${id}`;

  const classes = $el.attr('class')?.split(' ').filter(c => !c.startsWith(' ') && c.length > 0);
  if (classes && classes.length > 0) {
    return `.${classes[0]}`;
  }

  const tagName = $el.prop('tagName')?.toLowerCase();
  return tagName || 'div';
}

/**
 * Convert pricing candidate to PricingContent format
 */
export function pricingCandidateToContent(candidate: PricingSectionCandidate): PricingContent {
  return {
    title: candidate.title,
    subtitle: candidate.subtitle,
    plans: candidate.plans.map(plan => ({
      name: plan.name || 'Plan',
      price: plan.price || '$0',
      period: plan.period,
      description: plan.description,
      features: plan.features,
      button: plan.button || { text: 'Choose Plan' },
      popular: plan.popular
    }))
  };
}

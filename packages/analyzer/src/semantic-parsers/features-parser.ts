import { load } from 'cheerio';
import type { FeaturesContent } from '@genie/ui-library';

export interface FeatureCandidate {
  title?: string;
  description?: string;
  icon?: string;
  image?: string;
  confidence: number;
}

export interface FeaturesSectionCandidate {
  title?: string;
  subtitle?: string;
  features: FeatureCandidate[];
  confidence: number;
  layout: 'grid' | 'list' | 'cards';
}

/**
 * Parse HTML to find potential features sections
 */
export function findFeaturesSections(html: string): FeaturesSectionCandidate[] {
  const $ = load(html);
  const candidates: FeaturesSectionCandidate[] = [];

  // Look for common features section patterns
  const featuresSelectors = [
    'section.features',
    '.features-section',
    '[class*="features"]',
    '[class*="feature-list"]',
    '.benefits',
    '.services',
    '.capabilities'
  ];

  featuresSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const candidate = analyzeFeaturesElement($, element);
      if (candidate.confidence > 0.3 && candidate.features.length > 0) {
        candidates.push(candidate);
      }
    });
  });

  // Look for grids/lists of items that might be features
  $('.grid, .flex, .row').each((_, element) => {
    const $el = $(element);
    const children = $el.children();

    // Look for 3-6 similar items that might be features
    if (children.length >= 3 && children.length <= 8) {
      const candidate = analyzeFeaturesElement($, element);
      if (candidate.confidence > 0.2 && candidate.features.length >= 2) {
        candidates.push(candidate);
      }
    }
  });

  // Sort by confidence and remove duplicates
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate, index, arr) =>
      index === arr.findIndex(c => JSON.stringify(c.features) === JSON.stringify(candidate.features))
    )
    .slice(0, 3); // Top 3 candidates
}

/**
 * Analyze a specific element for features content
 */
function analyzeFeaturesElement($: cheerio.Root, element: cheerio.Element): FeaturesSectionCandidate {
  const $el = $(element);
  let confidence = 0;
  const candidate: FeaturesSectionCandidate = {
    features: [],
    confidence: 0,
    layout: 'grid'
  };

  // Check for features-like classes
  const classes = $el.attr('class') || '';
  if (classes.includes('features') || classes.includes('services') || classes.includes('benefits')) {
    confidence += 0.3;
  }

  // Determine layout
  if (classes.includes('list') || $el.find('ul, ol').length > 0) {
    candidate.layout = 'list';
  } else if (classes.includes('card') || $el.find('[class*="card"]').length > 0) {
    candidate.layout = 'cards';
  }

  // Find section title
  const $title = $el.find('h2, h3, .title, [class*="title"]').first();
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

  // Find individual features
  const featureSelectors = [
    '.feature',
    '.service',
    '.benefit',
    '.item',
    'article',
    '[class*="col"]',
    '[class*="item"]'
  ];

  let foundFeatures = false;
  featureSelectors.forEach(selector => {
    if (candidate.features.length === 0) { // Only try if we haven't found features yet
      $el.find(selector).each((_, featureEl) => {
        const feature = analyzeFeatureElement($, featureEl);
        if (feature.confidence > 0.3) {
          candidate.features.push(feature);
          foundFeatures = true;
        }
      });
    }
  });

  // If no structured features found, try to extract from general content
  if (!foundFeatures) {
    const $items = $el.find('div, li').slice(0, 6); // Limit to 6 potential features
    $items.each((_, itemEl) => {
      const feature = analyzeFeatureElement($, itemEl);
      if (feature.confidence > 0.2) {
        candidate.features.push(feature);
      }
    });
  }

  if (candidate.features.length >= 2) {
    confidence += Math.min(candidate.features.length * 0.1, 0.4);
  }

  candidate.confidence = Math.min(confidence, 1.0);
  return candidate;
}

/**
 * Analyze a single feature element
 */
function analyzeFeatureElement($: cheerio.Root, element: cheerio.Element): FeatureCandidate {
  const $el = $(element);
  let confidence = 0;
  const feature: FeatureCandidate = { confidence: 0 };

  // Find title
  const $title = $el.find('h3, h4, .title, strong, b').first();
  if ($title.length) {
    feature.title = $title.text().trim();
    confidence += 0.3;
  } else {
    // Look for first line of text
    const text = $el.text().trim();
    const firstLine = text.split('\n')[0].trim();
    if (firstLine.length > 5 && firstLine.length < 50) {
      feature.title = firstLine;
      confidence += 0.2;
    }
  }

  // Find description
  const $desc = $el.find('p').first();
  if ($desc.length) {
    feature.description = $desc.text().trim();
    confidence += 0.3;
  } else {
    // Look for remaining text after title
    const text = $el.text().trim();
    if (feature.title && text.length > feature.title.length + 10) {
      feature.description = text.replace(feature.title, '').trim();
      confidence += 0.2;
    }
  }

  // Find icon
  const $icon = $el.find('i, svg, img[alt*="icon"], [class*="icon"]').first();
  if ($icon.length) {
    const iconClass = $icon.attr('class');
    const src = $icon.attr('src') || $icon.attr('data-src');
    if (iconClass && iconClass.includes('fa-')) {
      feature.icon = iconClass.split(' ').find(c => c.startsWith('fa-'));
      confidence += 0.2;
    } else if (src) {
      feature.icon = src;
      confidence += 0.2;
    }
  }

  // Find image
  const $image = $el.find('img:not([alt*="icon"])').first();
  if ($image.length) {
    feature.image = $image.attr('src') || $image.attr('data-src');
    confidence += 0.1;
  }

  feature.confidence = Math.min(confidence, 1.0);
  return feature;
}

/**
 * Convert features candidate to FeaturesContent format
 */
export function featuresCandidateToContent(candidate: FeaturesSectionCandidate): FeaturesContent {
  return {
    title: candidate.title,
    subtitle: candidate.subtitle,
    features: candidate.features.map(f => ({
      title: f.title || 'Feature',
      description: f.description || '',
      icon: f.icon,
      image: f.image
    }))
  };
}

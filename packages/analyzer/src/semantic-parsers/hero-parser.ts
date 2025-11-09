import { load } from 'cheerio';
import type { HeroContent } from '@genie/ui-library';

export interface HeroCandidate {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryButton?: { text: string; url?: string };
  secondaryButton?: { text: string; url?: string };
  confidence: number;
  element?: string; // HTML element selector
}

/**
 * Parse HTML to find potential hero sections
 */
export function findHeroSections(html: string): HeroCandidate[] {
  const $ = load(html);
  const candidates: HeroCandidate[] = [];

  // Look for common hero section patterns
  const heroSelectors = [
    'header.hero',
    'section.hero',
    '.hero-section',
    '[class*="hero"]',
    'header:first-child',
    'section:first-child',
    '.banner',
    '.jumbotron',
    '.landing-hero'
  ];

  heroSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const candidate = analyzeHeroElement($, element);
      if (candidate.confidence > 0.3) { // Minimum confidence threshold
        candidates.push(candidate);
      }
    });
  });

  // Also look for large headings that might be hero titles
  $('h1').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();

    if (text.length > 5 && text.length < 100) {
      // Look for surrounding content that might be a hero section
      const $container = $el.closest('section, header, div');
      if ($container.length && !$container.hasClass('footer') && !$container.hasClass('nav')) {
        const candidate = analyzeHeroElement($, $container[0]);
        if (candidate.confidence > 0.2) {
          candidates.push(candidate);
        }
      }
    }
  });

  // Sort by confidence and remove duplicates
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate, index, arr) =>
      index === arr.findIndex(c => c.title === candidate.title && c.description === candidate.description)
    )
    .slice(0, 3); // Top 3 candidates
}

/**
 * Analyze a specific element for hero content
 */
function analyzeHeroElement($: cheerio.Root, element: cheerio.Element): HeroCandidate {
  const $el = $(element);
  let confidence = 0;
  const candidate: HeroCandidate = { confidence: 0 };

  // Check for hero-like classes
  const classes = $el.attr('class') || '';
  if (classes.includes('hero') || classes.includes('banner') || classes.includes('jumbotron')) {
    confidence += 0.3;
  }

  // Check for large background images/videos
  const style = $el.attr('style') || '';
  const hasBackgroundImage = style.includes('background-image') || $el.find('[style*="background-image"]').length > 0;
  if (hasBackgroundImage) confidence += 0.2;

  // Find the main heading (usually h1)
  const $heading = $el.find('h1').first();
  if ($heading.length) {
    candidate.title = $heading.text().trim();
    confidence += 0.4;
  } else {
    // Look for large text that might be a title
    const $largeText = $el.find('[style*="font-size"], .large, .xl, .2xl, .3xl').first();
    if ($largeText.length && $largeText.text().trim().length > 10) {
      candidate.title = $largeText.text().trim();
      confidence += 0.2;
    }
  }

  // Find subtitle (h2, or text after title)
  const $subtitle = $el.find('h2').first();
  if ($subtitle.length && $subtitle.text().trim() !== candidate.title) {
    candidate.subtitle = $subtitle.text().trim();
    confidence += 0.2;
  }

  // Find description (paragraphs, or text blocks)
  const $paragraphs = $el.find('p');
  $paragraphs.each((_, p) => {
    const text = $(p).text().trim();
    if (text.length > 20 && text.length < 300) {
      if (!candidate.description || text.length > candidate.description.length) {
        candidate.description = text;
        confidence += 0.2;
      }
    }
  });

  // Find buttons
  const $buttons = $el.find('a[href], button, [role="button"], .btn, [class*="button"]');
  const buttonTexts: Array<{text: string, url?: string}> = [];

  $buttons.each((_, btn) => {
    const $btn = $(btn);
    const text = $btn.text().trim();
    const href = $btn.attr('href');

    if (text.length > 0 && text.length < 50) {
      buttonTexts.push({
        text,
        url: href && !href.startsWith('#') ? href : undefined
      });
    }
  });

  // Assign primary and secondary buttons
  if (buttonTexts.length >= 1) {
    candidate.primaryButton = buttonTexts[0];
    confidence += 0.3;
  }
  if (buttonTexts.length >= 2) {
    candidate.secondaryButton = buttonTexts[1];
    confidence += 0.1;
  }

  candidate.confidence = Math.min(confidence, 1.0);
  candidate.element = generateSelector($el);

  return candidate;
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
 * Convert hero candidate to HeroContent format
 */
export function heroCandidateToContent(candidate: HeroCandidate): HeroContent {
  return {
    title: candidate.title || 'Welcome',
    subtitle: candidate.subtitle,
    description: candidate.description,
    primaryButton: candidate.primaryButton,
    secondaryButton: candidate.secondaryButton
  };
}

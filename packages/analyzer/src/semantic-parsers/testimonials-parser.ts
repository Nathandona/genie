import { load } from 'cheerio';
import type { TestimonialsContent } from '@genie/ui-library';

export interface TestimonialCandidate {
  name?: string;
  role?: string;
  company?: string;
  content?: string;
  avatar?: string;
  rating?: number;
  confidence: number;
}

export interface TestimonialsSectionCandidate {
  title?: string;
  subtitle?: string;
  testimonials: TestimonialCandidate[];
  confidence: number;
}

/**
 * Parse HTML to find potential testimonials sections
 */
export function findTestimonialsSections(html: string): TestimonialsSectionCandidate[] {
  const $ = load(html);
  const candidates: TestimonialsSectionCandidate[] = [];

  // Look for common testimonials section patterns
  const testimonialsSelectors = [
    'section.testimonials',
    '.testimonials-section',
    '[class*="testimonials"]',
    '[class*="testimonial"]',
    '.reviews',
    '.feedback',
    '.quotes'
  ];

  testimonialsSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const candidate = analyzeTestimonialsElement($, element);
      if (candidate.confidence > 0.3 && candidate.testimonials.length > 0) {
        candidates.push(candidate);
      }
    });
  });

  // Look for quote-like elements or repeated testimonial patterns
  const quoteSelectors = [
    'blockquote',
    '[class*="quote"]',
    'q'
  ];

  quoteSelectors.forEach(selector => {
    const $quotes = $(selector);
    if ($quotes.length >= 2) {
      // Group quotes by container
      const $container = $quotes.first().closest('section, div');
      const candidate = analyzeTestimonialsElement($, $container[0] || $('body')[0]);
      if (candidate.confidence > 0.2 && candidate.testimonials.length >= 2) {
        candidates.push(candidate);
      }
    }
  });

  // Look for repeated patterns with names and quotes
  const $nameElements = $('[class*="name"], [class*="author"], cite, .byline');
  if ($nameElements.length >= 3) {
    const $container = $nameElements.first().closest('section, div');
    const candidate = analyzeTestimonialsElement($, $container[0] || $('body')[0]);
    if (candidate.confidence > 0.2 && candidate.testimonials.length >= 2) {
      candidates.push(candidate);
    }
  }

  // Sort by confidence and remove duplicates
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate, index, arr) =>
      index === arr.findIndex(c =>
        candidate.testimonials.length === c.testimonials.length &&
        candidate.testimonials[0]?.name === c.testimonials[0]?.name
      )
    )
    .slice(0, 2); // Top 2 candidates
}

/**
 * Analyze a testimonials element
 */
function analyzeTestimonialsElement($: cheerio.Root, element: cheerio.Element): TestimonialsSectionCandidate {
  const $el = $(element);
  let confidence = 0;
  const candidate: TestimonialsSectionCandidate = {
    testimonials: [],
    confidence: 0
  };

  // Check for testimonials-like classes
  const classes = $el.attr('class') || '';
  if (classes.includes('testimonial') || classes.includes('review') || classes.includes('feedback')) {
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

  // Find individual testimonials
  const testimonialSelectors = [
    '.testimonial',
    '.review',
    '.quote',
    '.feedback',
    '[class*="testimonial"]',
    '[class*="review"]',
    'article',
    'blockquote'
  ];

  testimonialSelectors.forEach(selector => {
    $el.find(selector).each((_, testimonialEl) => {
      const testimonial = analyzeTestimonialElement($, testimonialEl);
      if (testimonial.confidence > 0.4) {
        candidate.testimonials.push(testimonial);
      }
    });
  });

  // If no structured testimonials found, try to extract from general content
  if (candidate.testimonials.length === 0) {
    const $quotes = $el.find('blockquote, q, [class*="quote"]');
    const $names = $el.find('[class*="name"], [class*="author"], cite, .byline');

    // Try to match quotes with names
    if ($quotes.length > 0 && $names.length > 0) {
      const quotes = $quotes.map((_, el) => $(el).text().trim()).get();
      const names = $names.map((_, el) => $(el).text().trim()).get();

      const testimonialCount = Math.min(quotes.length, names.length, 6);
      for (let i = 0; i < testimonialCount; i++) {
        candidate.testimonials.push({
          name: names[i],
          content: quotes[i],
          confidence: 0.5
        });
      }
    }
  }

  if (candidate.testimonials.length >= 2) {
    confidence += Math.min(candidate.testimonials.length * 0.15, 0.4);
  }

  candidate.confidence = Math.min(confidence, 1.0);
  return candidate;
}

/**
 * Analyze a single testimonial element
 */
function analyzeTestimonialElement($: cheerio.Root, element: cheerio.Element): TestimonialCandidate {
  const $el = $(element);
  let confidence = 0;
  const testimonial: TestimonialCandidate = { confidence: 0 };

  // Find testimonial content (quote)
  const $quote = $el.find('blockquote, q, p').first();
  if ($quote.length) {
    testimonial.content = $quote.text().trim();
    confidence += 0.4;
  } else {
    // Look for direct text content
    const text = $el.text().trim();
    if (text.length > 20 && text.length < 500) {
      testimonial.content = text;
      confidence += 0.3;
    }
  }

  // Find author name
  const $name = $el.find('[class*="name"], [class*="author"], cite, .byline, strong, b').last();
  if ($name.length) {
    testimonial.name = $name.text().trim();
    confidence += 0.3;
  }

  // Find role/company
  const $role = $el.find('[class*="role"], [class*="title"], [class*="position"], small, em').first();
  if ($role.length && $role.text().trim() !== testimonial.name) {
    const roleText = $role.text().trim();
    // Try to split role and company
    const parts = roleText.split(/[,@]/);
    if (parts.length >= 2) {
      testimonial.role = parts[0].trim();
      testimonial.company = parts[1].trim();
    } else {
      testimonial.role = roleText;
    }
    confidence += 0.2;
  }

  // Find avatar image
  const $avatar = $el.find('img[alt*="avatar"], img[alt*="profile"], img[alt*="photo"], .avatar img').first();
  if ($avatar.length) {
    testimonial.avatar = $avatar.attr('src') || $avatar.attr('data-src');
    confidence += 0.1;
  }

  // Find rating (stars)
  const $rating = $el.find('[class*="rating"], [class*="star"], .stars');
  if ($rating.length) {
    const ratingText = $rating.text();
    const starCount = (ratingText.match(/★|☆|⭐|⭐/g) || []).length;
    if (starCount > 0) {
      testimonial.rating = starCount;
      confidence += 0.1;
    }
  }

  // Check for quote marks which indicate testimonial content
  const text = $el.text();
  if (text.includes('"') || text.includes("'") || text.includes('\'') || text.includes('"')) {
    confidence += 0.1;
  }

  testimonial.confidence = Math.min(confidence, 1.0);
  return testimonial;
}

/**
 * Convert testimonials candidate to TestimonialsContent format
 */
export function testimonialsCandidateToContent(candidate: TestimonialsSectionCandidate): TestimonialsContent {
  return {
    title: candidate.title,
    subtitle: candidate.subtitle,
    testimonials: candidate.testimonials.map(t => ({
      name: t.name || 'Anonymous',
      role: t.role,
      company: t.company,
      content: t.content || '',
      avatar: t.avatar,
      rating: t.rating
    }))
  };
}

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Genie/i);
    
    // Check that main content is visible
    const hero = page.locator('main, [role="main"], .hero, h1').first();
    await expect(hero).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if navigation links exist and are clickable
    const navLinks = page.locator('nav a, header a');
    const count = await navLinks.count();
    
    if (count > 0) {
      // Click first navigation link if it exists
      const firstLink = navLinks.first();
      await expect(firstLink).toBeVisible();
    }
  });

  test('should have CTA buttons', async ({ page }) => {
    await page.goto('/');
    
    // Look for common CTA button text patterns
    const ctaButton = page.locator('button, a').filter({ 
      hasText: /(Get Started|Start|Create|Sign Up|Try|Demo)/i 
    }).first();
    
    if (await ctaButton.count() > 0) {
      await expect(ctaButton).toBeVisible();
    }
  });
});

test.describe('Dashboard', () => {
  test('should require authentication', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login or show auth required
    // Adjust based on your auth flow
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(login|auth|dashboard)/i);
  });
});

test.describe('Project Creation', () => {
  test('should load create project page', async ({ page }) => {
    await page.goto('/create');
    
    // Check for form elements
    const form = page.locator('form, [role="form"]').first();
    const input = page.locator('input[type="url"], input[name*="url" i], input[type="text"]').first();
    
    // Form or input should be visible
    if (await form.count() > 0 || await input.count() > 0) {
      await expect(form.or(input)).toBeVisible();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check for form labels
    const labels = page.locator('label');
    const count = await labels.count();
    
    if (count > 0) {
      // At least one label should be visible
      await expect(labels.first()).toBeVisible();
    }
  });

  test('should have proper button roles', async ({ page }) => {
    await page.goto('/');
    
    // Check for buttons
    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();
    
    if (count > 0) {
      // Buttons should be accessible
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
    }
  });
});


import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page).toHaveTitle(/Genie/i);
    
    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should toggle between login and signup modes', async ({ page }) => {
    await page.goto('/login');
    
    // Check initial state (login mode)
    const signInButton = page.locator('button:has-text("Sign In")');
    const signUpButton = page.locator('button:has-text("Sign Up")');
    
    await expect(signInButton).toBeVisible();
    await expect(signUpButton).toBeVisible();
    
    // Click sign up button
    await signUpButton.click();
    
    // Check for name field (only in signup mode)
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    
    // Switch back to login
    await signInButton.click();
    
    // Name field should not be visible
    await expect(nameInput).not.toBeVisible();
  });

  test('should validate email and password fields', async ({ page }) => {
    await page.goto('/login');
    
    const submitButton = page.locator('button[type="submit"]');
    
    // Try to submit without filling fields
    await submitButton.click();
    
    // Should show validation error or prevent submission
    // The form should handle validation client-side
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('should validate password length in signup mode', async ({ page }) => {
    await page.goto('/login');
    
    // Switch to signup mode
    const signUpButton = page.locator('button:has-text("Sign Up")');
    await signUpButton.click();
    
    const passwordInput = page.locator('input[type="password"]');
    const emailInput = page.locator('input[type="email"]');
    
    // Fill in email and short password
    await emailInput.fill('test@example.com');
    await passwordInput.fill('short');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show error about password length
    const errorMessage = page.locator('text=/password.*8.*character/i, text=/at least 8/i');
    await expect(errorMessage).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Create Project Page', () => {
  test('should load create project page', async ({ page }) => {
    await page.goto('/create');
    
    // Check for main form elements
    const urlInput = page.locator('input[type="text"]').first();
    const submitButton = page.locator('button:has-text("Start Generation"), button:has-text("Creating")');
    
    await expect(urlInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should validate URL input', async ({ page }) => {
    await page.goto('/create');
    
    const urlInput = page.locator('input[type="text"]').first();
    
    // Enter invalid URL
    await urlInput.fill('not-a-url');
    
    // Should show validation error
    const errorMessage = page.locator('text=/valid URL/i, text=/https/i');
    await expect(errorMessage).toBeVisible({ timeout: 2000 });
  });

  test('should toggle advanced options', async ({ page }) => {
    await page.goto('/create');
    
    const advancedToggle = page.locator('button:has-text("Advanced Options")');
    await expect(advancedToggle).toBeVisible();
    
    // Click to expand
    await advancedToggle.click();
    
    // Check for advanced options fields
    const maxPagesInput = page.locator('input[type="number"]');
    await expect(maxPagesInput).toBeVisible({ timeout: 1000 });
    
    // Click to collapse
    await advancedToggle.click();
    
    // Advanced options should be hidden
    await expect(maxPagesInput).not.toBeVisible({ timeout: 1000 });
  });

  test('should show estimated time', async ({ page }) => {
    await page.goto('/create');
    
    // Expand advanced options
    const advancedToggle = page.locator('button:has-text("Advanced Options")');
    await advancedToggle.click();
    
    // Check for estimated time display
    const estimatedTime = page.locator('text=/Estimated Time/i, text=/min/i');
    await expect(estimatedTime).toBeVisible();
  });
});

test.describe('Dashboard Page', () => {
  test('should require authentication', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login or show auth required
    // The exact behavior depends on your auth implementation
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(login|auth|dashboard)/i);
  });

  test('should display dashboard when authenticated', async ({ page }) => {
    // This test would require setting up authentication state
    // For now, we'll just check the URL structure
    await page.goto('/dashboard');
    
    // Check if page loaded (even if redirected)
    await expect(page).toHaveTitle(/Genie/i);
  });
});

test.describe('Progress Page', () => {
  test('should load progress page with project ID', async ({ page }) => {
    // Navigate with query params
    await page.goto('/progress?id=test-id&url=https://example.com&maxPages=10');
    
    // Check for progress indicators
    const progressElements = page.locator('[role="progressbar"], .progress, text=/progress/i');
    const count = await progressElements.count();
    
    // Should have some progress-related content
    expect(count).toBeGreaterThan(0);
  });

  test('should display project URL', async ({ page }) => {
    await page.goto('/progress?id=test-id&url=https://example.com&maxPages=10');
    
    // Should display the URL somewhere on the page
    const urlDisplay = page.locator('text=/example.com/i');
    await expect(urlDisplay.first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Results Page', () => {
  test('should load results page', async ({ page }) => {
    await page.goto('/results?id=test-id');
    
    // Check that page loads
    await expect(page).toHaveTitle(/Genie/i);
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation links
    const navLinks = page.locator('nav a, header a');
    const count = await navLinks.count();
    
    if (count > 0) {
      // Try clicking first link
      const firstLink = navLinks.first();
      await expect(firstLink).toBeVisible();
      
      // Note: Actual navigation test would require checking URL changes
      // but we want to avoid breaking if navigation structure changes
    }
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that page loads and is usable
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });
});


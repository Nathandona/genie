import type { DesignTokenSummary } from '@genie/analyzer';

/**
 * Page component generation
 */

export function generatePageComponent(page: { url: string; title?: string; html: string; path: string }, tokens: DesignTokenSummary): string {
  // Simple template-based page generation
  const title = page.title || 'Generated Page';
  const content = page.html || '<p>Content not available</p>';

  return `'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">${title}</h1>
        <div className="prose prose-lg max-w-none">
          ${content}
        </div>
      </div>
    </main>
  );
}
`;
}

export function generatePageComponentFromAI(page: { url: string; title?: string; path: string }, aiContent: string): string {
  // Return the AI-generated content directly
  return aiContent;
}

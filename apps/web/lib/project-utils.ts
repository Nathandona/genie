import { type Project as ApiProject } from "@/lib/api-client"

export interface Project {
  id: string
  name: string
  url: string
  status: "completed" | "processing" | "failed"
  createdAt: Date
  pagesCount: number
  thumbnail: string
}

// Helper to extract domain name for display
export function getDomainName(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0] || domain
  } catch {
    return url
  }
}

// Helper to get emoji based on URL
export function getUrlEmoji(url: string): string {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('shop') || urlLower.includes('store') || urlLower.includes('commerce')) return '🛍️'
  if (urlLower.includes('blog')) return '📝'
  if (urlLower.includes('portfolio')) return '🎨'
  if (urlLower.includes('corporate') || urlLower.includes('company')) return '🏢'
  if (urlLower.includes('food') || urlLower.includes('restaurant')) return '🍽️'
  if (urlLower.includes('tech')) return '💻'
  return '🌐'
}

// Convert API project to UI project
export function convertProject(apiProject: ApiProject): Project {
  const status = apiProject.status === 'completed' ? 'completed' :
    apiProject.status === 'failed' ? 'failed' : 'processing'

  return {
    id: apiProject.id,
    name: getDomainName(apiProject.sourceUrl).charAt(0).toUpperCase() +
      getDomainName(apiProject.sourceUrl).slice(1).replace(/[-_]/g, ' '),
    url: apiProject.sourceUrl,
    status,
    createdAt: new Date(apiProject.createdAt),
    pagesCount: apiProject.pageCount,
    thumbnail: getUrlEmoji(apiProject.sourceUrl),
  }
}

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { type Project, convertProject } from "@/lib/project-utils"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { FiltersBar } from "@/components/dashboard/filters-bar"
import { ProjectCard } from "@/components/dashboard/project-card"
import { ProjectListItem } from "@/components/dashboard/project-list-item"
import { LoadingState } from "@/components/dashboard/loading-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Notification } from "@/components/dashboard/notification"
import { DeleteConfirmationDialog } from "@/components/dashboard/delete-confirmation-dialog"

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "completed" | "processing">("all")
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Use ref to track if we're currently fetching to prevent multiple simultaneous calls
  const isFetchingRef = useRef(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      const apiProjects = await apiClient.getProjects()
      setProjects(apiProjects.map(convertProject))
      setError(null)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      isFetchingRef.current = false
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Set up smart polling - only poll when there are processing projects
  useEffect(() => {
    const hasProcessing = projects.some(p => p.status === 'processing')

    if (hasProcessing && !pollIntervalRef.current) {
      // Start polling if we have processing projects and not already polling
      pollIntervalRef.current = setInterval(() => {
        fetchProjects()
      }, 5000)
    } else if (!hasProcessing && pollIntervalRef.current) {
      // Stop polling if no processing projects
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [projects, fetchProjects])

  const handleDelete = async (projectId: string) => {
    try {
      setDeletingId(projectId)
      await apiClient.deleteProject(projectId)
      setProjects(projects.filter(p => p.id !== projectId))
      setProjectToDelete(null)
      setNotification({ type: 'success', message: 'Project deleted successfully' })
      setTimeout(() => setNotification(null), 5000)
    } catch (err) {
      console.error('Failed to delete project:', err)
      setNotification({ type: 'error', message: 'Failed to delete project. Please try again.' })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (projectId: string, projectName: string) => {
    try {
      setDownloadingId(projectId)
      
      // Try to get download info first (optional, for showing file count/size)
      let info: { fileCount: number; totalSize: number } | null = null
      try {
        info = await apiClient.getDownloadInfo(projectId)
      } catch (err) {
        // If download info is not available, still try to download
        console.warn("Download info not available, attempting download anyway:", err)
      }

      // Download the actual ZIP file
      const blob = await apiClient.downloadProject(projectId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Show success notification
      if (info) {
      setNotification({ 
        type: 'success', 
        message: `Download started! ${info.fileCount} files (${(info.totalSize / 1024 / 1024).toFixed(2)} MB)` 
      })
      } else {
        setNotification({ 
          type: 'success', 
          message: 'Download started!' 
        })
      }
      setTimeout(() => setNotification(null), 5000)
    } catch (err) {
      console.error('Failed to download project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to download project'
      let userMessage = errorMessage
      
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        userMessage = "Download is not ready yet. Please wait for the project generation to complete."
      } else if (errorMessage.includes("ZIP file not found")) {
        userMessage = "The project file has been cleaned up. Please regenerate the project."
      }
      
      setNotification({ 
        type: 'error', 
        message: userMessage
      })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setDownloadingId(null)
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setNotification({ type: 'success', message: 'URL copied to clipboard' })
    setTimeout(() => setNotification(null), 3000)
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || project.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          project={projectToDelete}
          isDeleting={!!deletingId}
          onConfirm={handleDelete}
          onCancel={() => setProjectToDelete(null)}
        />

        {/* Header */}
        <DashboardHeader />

        {/* Stats Overview */}
        <StatsOverview projects={projects} />

        {/* Filters & Search */}
        <FiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filter={filter}
          onFilterChange={setFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Projects Grid/List */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                downloadingId={downloadingId}
                onDownload={handleDownload}
                onDelete={setProjectToDelete}
                onCopyUrl={copyUrl}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                downloadingId={downloadingId}
                onDownload={handleDownload}
                onDelete={setProjectToDelete}
                onCopyUrl={copyUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

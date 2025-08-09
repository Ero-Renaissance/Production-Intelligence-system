import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { AxiosError } from 'axios'
import { App } from './App'
import './index.css'

// Initialize Mock Service Worker for development
async function enableMocking() {
  const useMsw = import.meta.env.VITE_USE_MSW === 'true'
  if (!useMsw || process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('🔧 Setting up MSW...')
  const { setupMocks } = await import('./api/mocks')
  await setupMocks()
  console.log('✅ MSW setup complete')
}

// Create React Query client with optimized configuration for production monitoring
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // TRS Section 7: Poll every 60s for all GET calls
      refetchInterval: 60000,
      // Keep data fresh for production monitoring
      staleTime: 30000,
      // Cache data longer for performance
      gcTime: 10 * 60 * 1000, // 10 minutes
      // Retry for reliability in production environment
      retry: (failureCount, error: unknown) => {
        const status = (error as AxiosError | undefined)?.response?.status ?? 0
        if (status >= 400 && status < 500) return false
        return failureCount < 3
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
})

// Start the app with optional MSW
enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        {/* React Query DevTools for development */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>,
  )
})

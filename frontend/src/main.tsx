import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ToastProvider } from './context/toast'
import { ThemeProvider } from './context/theme'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-800 p-8 max-w-lg w-full">
            <h1 className="text-lg font-bold text-red-600 mb-2">Something went wrong</h1>
            <pre className="text-xs text-gray-600 dark:text-slate-400 whitespace-pre-wrap bg-gray-50 dark:bg-slate-900 rounded-lg p-4 overflow-auto">
              {(this.state.error as Error).message}
            </pre>
            <button onClick={() => window.location.href = '/'}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              Reload app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
)

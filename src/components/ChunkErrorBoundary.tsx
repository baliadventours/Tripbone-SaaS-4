import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  error?: Error;
}

function checkIsChunkError(error?: Error): boolean {
  if (!error) return false;
  const errorMsg = (error.message || error.toString() || '').toLowerCase();
  return (
    errorMsg.includes('failed to fetch dynamically imported module') ||
    errorMsg.includes('loading chunk') ||
    errorMsg.includes('error loading dynamically imported module') ||
    errorMsg.includes('importing a module script failed') ||
    errorMsg.includes('is not a valid javascript mime type') ||
    errorMsg.includes('unable to preload css')
  );
}

export class ChunkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isChunkError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      isChunkError: checkIsChunkError(error),
      error 
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Captured route error in ChunkErrorBoundary:', error, errorInfo);

    const isChunk = checkIsChunkError(error);

    if (isChunk) {
      const lastReload = sessionStorage.getItem('chunk_error_last_reload');
      const now = Date.now();
      // If we haven't auto-reloaded in the last 15 seconds, reload automatically with cache-buster
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('chunk_error_last_reload', now.toString());
        this.performHardReload();
      }
    }
  }

  private performHardReload = () => {
    sessionStorage.removeItem('chunk_error_last_reload');
    sessionStorage.removeItem('lazy_retry_timestamp');
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString());
    window.location.replace(url.toString());
  };

  public render() {
    if (this.state.hasError) {
      // 1. Genuine build / chunk hash mismatch after a new version was deployed
      if (this.state.isChunkError) {
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white rounded-2xl mx-auto my-12 max-w-lg shadow-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Platform Update Detected</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              A new version of Tripbone was deployed while you were browsing. Click below to load the updated application.
            </p>
            <button
              onClick={this.performHardReload}
              className="px-6 py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg cursor-pointer"
            >
              Refresh Platform
            </button>
          </div>
        );
      }

      // 2. Standard recoverable error fallback
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white text-gray-900 rounded-3xl mx-auto my-12 max-w-md shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center mb-4 text-xl font-black">
            !
          </div>
          <h2 className="text-xl font-black mb-2 text-gray-900 tracking-tight">Something went wrong</h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            We encountered an unexpected issue displaying this page. Please try refreshing or return to the main dashboard.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.performHardReload}
              className="px-5 py-2.5 bg-primary text-white font-black text-xs rounded-xl shadow-md hover:bg-orange-600 transition-all cursor-pointer"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition-all"
            >
              Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;


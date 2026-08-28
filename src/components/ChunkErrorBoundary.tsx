import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Captured dynamic import / chunk error:', error, errorInfo);

    const errorMsg = error?.message || error?.toString() || '';
    const isChunkError = 
      error?.name === 'TypeError' ||
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Loading chunk') ||
      errorMsg.includes('Importing a module script failed');

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('chunk_error_last_reload');
      const now = Date.now();
      // If we haven't auto-reloaded in the last 15 seconds, reload automatically
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('chunk_error_last_reload', now.toString());
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
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
            onClick={() => {
              sessionStorage.removeItem('chunk_error_last_reload');
              window.location.reload();
            }}
            className="px-6 py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg cursor-pointer"
          >
            Refresh Platform
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;

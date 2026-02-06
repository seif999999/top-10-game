import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import LoadingPage from '../components/LoadingPage';
import ErrorPage from '../components/ErrorPage';
import { logger } from '../../backend/utils/logger';

// ============================================================================
// Types
// ============================================================================

export type ErrorType = 'network' | '401' | '403' | '404' | '5xx' | 'unknown';

export interface GlobalUIState {
  /** Whether the global loading overlay is visible */
  isLoading: boolean;
  /** Optional loading message (defaults to "Loading… Please wait.") */
  loadingMessage?: string;
  /** Whether the global error page is visible */
  isError: boolean;
  /** The type/category of the error */
  errorType: ErrorType;
  /** Callback to retry the failed action */
  onRetry?: () => void;
}

export interface GlobalUIActions {
  /** Show the global loading overlay */
  showLoading: (message?: string) => void;
  /** Hide the global loading overlay */
  hideLoading: () => void;
  /** Show the global error page */
  showError: (type: ErrorType, onRetry?: () => void) => void;
  /** Hide the global error page */
  hideError: () => void;
  /**
   * Run an async action with automatic loading/error handling.
   * Shows loading, runs the action, hides loading on success or shows error on failure.
   */
  withLoading: <T>(action: () => Promise<T>, options?: { message?: string; errorType?: ErrorType }) => Promise<T | undefined>;
}

type GlobalUIContextType = GlobalUIState & GlobalUIActions;

// ============================================================================
// Context
// ============================================================================

const GlobalUIContext = createContext<GlobalUIContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export const GlobalUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);
  const [isError, setIsError] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>('unknown');
  const [onRetry, setOnRetry] = useState<(() => void) | undefined>(undefined);

  const showLoading = useCallback((message?: string) => {
    setLoadingMessage(message);
    setIsError(false);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  }, []);

  const showError = useCallback((type: ErrorType, retry?: () => void) => {
    setIsLoading(false);
    setLoadingMessage(undefined);
    setErrorType(type);
    // Wrap in a thunk so useState doesn't call the function
    setOnRetry(() => retry);
    setIsError(true);
  }, []);

  const hideError = useCallback(() => {
    setIsError(false);
    setErrorType('unknown');
    setOnRetry(undefined);
  }, []);

  const withLoading = useCallback(async <T,>(
    action: () => Promise<T>,
    options?: { message?: string; errorType?: ErrorType }
  ): Promise<T | undefined> => {
    showLoading(options?.message);
    try {
      const result = await action();
      hideLoading();
      return result;
    } catch (error) {
      hideLoading();
      const type = options?.errorType ?? inferErrorType(error);
      showError(type, () => withLoading(action, options));
      return undefined;
    }
  }, [showLoading, hideLoading, showError]);

  const value = useMemo<GlobalUIContextType>(() => ({
    isLoading,
    loadingMessage,
    isError,
    errorType,
    onRetry,
    showLoading,
    hideLoading,
    showError,
    hideError,
    withLoading,
  }), [isLoading, loadingMessage, isError, errorType, onRetry, showLoading, hideLoading, showError, hideError, withLoading]);

  return (
    <GlobalUIContext.Provider value={value}>
      {children}

      {/* Global overlays — rendered on top of everything */}
      {isLoading && <LoadingPage message={loadingMessage} />}
      {isError && !isLoading && (
        <ErrorPage
          errorType={errorType}
          onRetry={onRetry}
          onGoHome={hideError}
        />
      )}
    </GlobalUIContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useGlobalUI = (): GlobalUIContextType => {
  const ctx = useContext(GlobalUIContext);
  if (!ctx) {
    throw new Error('useGlobalUI must be used within a GlobalUIProvider');
  }
  return ctx;
};

// ============================================================================
// Helpers
// ============================================================================

/** Infer the error type from an unknown error */
function inferErrorType(error: unknown): ErrorType {
  if (!error) return 'unknown';

  // Check for network / offline errors
  if (error instanceof TypeError && error.message?.toLowerCase().includes('network')) {
    return 'network';
  }

  // Check for objects with status or code
  const err = error as Record<string, unknown>;

  const status = err?.status ?? err?.statusCode ?? err?.code;
  if (typeof status === 'number') {
    if (status === 401) return '401';
    if (status === 403) return '403';
    if (status === 404) return '404';
    if (status >= 500 && status < 600) return '5xx';
  }

  if (typeof status === 'string') {
    if (status.includes('401') || status.includes('unauthorized') || status.includes('unauthenticated')) return '401';
    if (status.includes('403') || status.includes('forbidden') || status.includes('permission')) return '403';
    if (status.includes('404') || status.includes('not-found')) return '404';
    if (status.includes('unavailable') || status.includes('internal')) return '5xx';
  }

  const message = typeof err?.message === 'string' ? err.message.toLowerCase() : '';
  if (message.includes('network') || message.includes('offline') || message.includes('internet')) return 'network';
  if (message.includes('unauthorized') || message.includes('unauthenticated')) return '401';
  if (message.includes('forbidden') || message.includes('permission')) return '403';
  if (message.includes('not found')) return '404';

  return 'unknown';
}

import { lazy } from 'react';

const DEFAULT_RELOAD_FLAG = '__lazy_retry_reload__';

const isChunkLoadError = (error) => {
  if (!error) return false;
  const message = error.message || '';
  const name = error.name || '';
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /ChunkLoadError/i.test(name) ||
    /Loading chunk [\w-]+ failed/i.test(message)
  );
};

// Clear reload guard when the helper initializes after a hard refresh.
if (typeof window !== 'undefined' && window.sessionStorage?.getItem(DEFAULT_RELOAD_FLAG)) {
  window.sessionStorage.removeItem(DEFAULT_RELOAD_FLAG);
}

const lazyWithRetry = (importer, options = {}) => {
  const {
    retries = 2,
    retryDelay = 1000,
    shouldReload = true,
    reloadFlag = DEFAULT_RELOAD_FLAG,
    shouldRetry = isChunkLoadError,
  } = options;

  return lazy(() => {
    const attemptImport = (attempt = 0) =>
      importer().catch((error) => {
        if (!shouldRetry(error)) {
          throw error;
        }

        if (attempt < retries) {
          const delay = retryDelay * (attempt + 1);
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(attemptImport(attempt + 1));
            }, delay);
          });
        }

        if (shouldReload && typeof window !== 'undefined' && window.sessionStorage) {
          if (!window.sessionStorage.getItem(reloadFlag)) {
            window.sessionStorage.setItem(reloadFlag, '1');
            window.location.reload();
          }
        }

        throw error;
      });

    return attemptImport();
  });
};

export default lazyWithRetry;

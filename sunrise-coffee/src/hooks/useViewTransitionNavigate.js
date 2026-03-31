import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';

/**
 * Wraps React Router's navigate() with the View Transitions API.
 * Falls back to a plain navigate() on unsupported browsers (e.g. Firefox).
 * Uses flushSync so React flushes the DOM synchronously inside the
 * view-transition callback — required for the API to capture the new state.
 */
export function useViewTransitionNavigate() {
  const navigate = useNavigate();

  return (to, options) => {
    if (!document.startViewTransition) {
      navigate(to, options);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => navigate(to, options));
    });
  };
}

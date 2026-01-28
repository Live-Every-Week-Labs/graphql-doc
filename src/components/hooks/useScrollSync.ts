import { useEffect } from 'react';

interface ScrollSyncOptions {
  rootMargin?: string;
}

export function useScrollSync(
  onVisibleChange: (operationName: string) => void,
  options?: ScrollSyncOptions
) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-operation]')).filter(
      (el) => el.dataset.operation
    );

    if (!elements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const topEntry = visibleEntries[0];
        if (topEntry) {
          const operationName = (topEntry.target as HTMLElement).dataset.operation;
          if (operationName) {
            onVisibleChange(operationName);
          }
        }
      },
      {
        rootMargin: options?.rootMargin ?? '-20% 0px -60% 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [onVisibleChange, options?.rootMargin]);
}

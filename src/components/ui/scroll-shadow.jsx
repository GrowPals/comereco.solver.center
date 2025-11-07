import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * ScrollShadow Component
 *
 * Provides visual indicators (shadows) when content can be scrolled horizontally.
 * Automatically detects scroll position and shows/hides shadows accordingly.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to wrap with scroll shadows
 * @param {string} props.className - Additional classes for the wrapper
 * @param {string} props.shadowClassName - Additional classes for shadows
 * @param {number} props.shadowSize - Size of the shadow gradient (default: 40px)
 * @param {string} props.orientation - 'horizontal' or 'vertical' (default: 'horizontal')
 */
const ScrollShadow = ({
  children,
  className,
  shadowClassName,
  shadowSize = 40,
  orientation = 'horizontal'
}) => {
  const scrollRef = useRef(null);
  const [showStartShadow, setShowStartShadow] = useState(false);
  const [showEndShadow, setShowEndShadow] = useState(false);

  const checkScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    if (orientation === 'horizontal') {
      const { scrollLeft, scrollWidth, clientWidth } = element;
      const isAtStart = scrollLeft <= 1;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1;

      setShowStartShadow(!isAtStart && scrollWidth > clientWidth);
      setShowEndShadow(!isAtEnd && scrollWidth > clientWidth);
    } else {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isAtStart = scrollTop <= 1;
      const isAtEnd = scrollTop + clientHeight >= scrollHeight - 1;

      setShowStartShadow(!isAtStart && scrollHeight > clientHeight);
      setShowEndShadow(!isAtEnd && scrollHeight > clientHeight);
    }
  }, [orientation]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Check initially
    checkScroll();

    // Check on scroll
    element.addEventListener('scroll', checkScroll);

    // Check on resize
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={cn('relative', className)}>
      {/* Start Shadow (Left or Top) */}
      {showStartShadow && (
        <div
          className={cn(
            'pointer-events-none absolute z-10 transition-opacity duration-300',
            isHorizontal
              ? 'left-0 top-0 bottom-0'
              : 'left-0 right-0 top-0',
            shadowClassName
          )}
          style={{
            [isHorizontal ? 'width' : 'height']: `${shadowSize}px`,
            background: isHorizontal
              ? 'linear-gradient(to right, hsl(var(--background)), transparent)'
              : 'linear-gradient(to bottom, hsl(var(--background)), transparent)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className={cn(
          isHorizontal ? 'overflow-x-auto' : 'overflow-y-auto',
          'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent'
        )}
      >
        {children}
      </div>

      {/* End Shadow (Right or Bottom) */}
      {showEndShadow && (
        <div
          className={cn(
            'pointer-events-none absolute z-10 transition-opacity duration-300',
            isHorizontal
              ? 'right-0 top-0 bottom-0'
              : 'left-0 right-0 bottom-0',
            shadowClassName
          )}
          style={{
            [isHorizontal ? 'width' : 'height']: `${shadowSize}px`,
            background: isHorizontal
              ? 'linear-gradient(to left, hsl(var(--background)), transparent)'
              : 'linear-gradient(to top, hsl(var(--background)), transparent)',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

ScrollShadow.displayName = 'ScrollShadow';

export { ScrollShadow };

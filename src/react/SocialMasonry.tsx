/**
 * Social Masonry - React Component
 * Masonry layout for X (Twitter) and Instagram embeds using official widgets
 * Uses stable column pinning and GPU-accelerated CSS transforms to prevent loading layout jank
 */

import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import type {
  SocialMasonryProps,
  SocialPost,
  SocialPlatform,
  ItemPosition,
} from '../types';
import {
  defaultColumnConfig,
  extractTweetId,
  generatePostId,
  getColumnCount,
  DEFAULT_TWITTER_HEIGHT,
  DEFAULT_INSTAGRAM_HEIGHT,
} from '../utils';
import { calculateMasonryLayout } from '../layout-engine';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// ============================================
// Runtime Styles (Shimmer Animation)
// ============================================

const SHIMMER_STYLE_ID = 'sm-runtime-styles';

const ensureRuntimeStyles = (): void => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SHIMMER_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = SHIMMER_STYLE_ID;
  style.textContent = `
    @keyframes sm-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .sm-skeleton-bar {
      background-size: 200% 100%;
      animation: sm-shimmer 1.5s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .sm-skeleton-bar {
        animation: none;
      }
    }
  `;
  document.head.appendChild(style);
};

// ============================================
// Reduced Motion Hook
// ============================================

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return undefined;
  }, []);

  return reduced;
};

// ============================================
// Deduplicated Script Loading
// ============================================

interface TwttrGlobal {
  widgets?: {
    createTweet: (
      id: string,
      el: HTMLElement,
      options: Record<string, unknown>
    ) => Promise<HTMLElement | undefined>;
  };
  ready?: (cb: (twttr: TwttrGlobal) => void) => void;
}

interface InstgrmGlobal {
  Embeds?: {
    process: () => void;
  };
}

type EmbedWindow = Window & {
  twttr?: TwttrGlobal;
  instgrm?: InstgrmGlobal;
};

let twitterScriptPromise: Promise<TwttrGlobal> | null = null;
let instagramScriptPromise: Promise<InstgrmGlobal> | null = null;
let instagramProcessTimer: ReturnType<typeof setTimeout> | null = null;

const loadTwitterScript = (): Promise<TwttrGlobal> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Twitter embeds require a browser environment'));
  }

  const win = window as EmbedWindow;
  if (win.twttr?.widgets) {
    return Promise.resolve(win.twttr);
  }

  if (twitterScriptPromise) {
    return twitterScriptPromise;
  }

  twitterScriptPromise = new Promise<TwttrGlobal>((resolve, reject) => {
    const resolveWhenReady = () => {
      const twttr = (window as EmbedWindow).twttr;
      if (twttr?.widgets) {
        resolve(twttr);
      } else if (twttr?.ready) {
        twttr.ready((readyTwttr) => resolve(readyTwttr));
      } else {
        twitterScriptPromise = null;
        reject(new Error('Twitter widgets failed to initialize'));
      }
    };

    if (win.twttr?.ready) {
      win.twttr.ready((readyTwttr) => resolve(readyTwttr));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://platform.twitter.com/widgets.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', resolveWhenReady, { once: true });
      existingScript.addEventListener(
        'error',
        () => {
          twitterScriptPromise = null;
          reject(new Error('Failed to load Twitter widgets script'));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = resolveWhenReady;
    script.onerror = () => {
      twitterScriptPromise = null;
      reject(new Error('Failed to load Twitter widgets script'));
    };
    document.head.appendChild(script);
  });

  return twitterScriptPromise;
};

const loadInstagramScript = (): Promise<InstgrmGlobal> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Instagram embeds require a browser environment'));
  }

  const win = window as EmbedWindow;
  if (win.instgrm?.Embeds) {
    return Promise.resolve(win.instgrm);
  }

  if (instagramScriptPromise) {
    return instagramScriptPromise;
  }

  instagramScriptPromise = new Promise<InstgrmGlobal>((resolve, reject) => {
    const resolveWhenReady = () => {
      const instgrm = (window as EmbedWindow).instgrm;
      if (instgrm?.Embeds) {
        resolve(instgrm);
      } else {
        instagramScriptPromise = null;
        reject(new Error('Instagram embed script failed to initialize'));
      }
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', resolveWhenReady, { once: true });
      existingScript.addEventListener(
        'error',
        () => {
          instagramScriptPromise = null;
          reject(new Error('Failed to load Instagram embed script'));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = resolveWhenReady;
    script.onerror = () => {
      instagramScriptPromise = null;
      reject(new Error('Failed to load Instagram embed script'));
    };
    document.head.appendChild(script);
  });

  return instagramScriptPromise;
};

/**
 * Batch multiple Instagram embed process calls into a single pass
 */
const scheduleInstagramProcess = (): void => {
  if (instagramProcessTimer) {
    clearTimeout(instagramProcessTimer);
  }
  instagramProcessTimer = setTimeout(() => {
    instagramProcessTimer = null;
    const instgrm = (window as EmbedWindow).instgrm;
    instgrm?.Embeds?.process();
  }, 30);
};

// ============================================
// Skeleton & Fallback Components
// ============================================

interface EmbedSkeletonProps {
  height: number;
  theme: 'light' | 'dark';
  platform: SocialPlatform;
}

const EmbedSkeleton: React.FC<EmbedSkeletonProps> = ({ height, theme, platform }) => {
  useEffect(() => {
    ensureRuntimeStyles();
  }, []);

  const isDark = theme === 'dark' && platform === 'twitter';
  const surfaceBg = isDark ? '#16181c' : '#ffffff';
  const borderColor = isDark ? '#2f3336' : '#e5e7eb';
  const shimmerGradient = isDark
    ? 'linear-gradient(90deg, #22252a 25%, #2f333a 50%, #22252a 75%)'
    : 'linear-gradient(90deg, #f1f3f5 25%, #e5e7eb 50%, #f1f3f5 75%)';

  const mediaHeight = Math.max(120, height - 170);

  return (
    <div
      className="sm-skeleton"
      aria-busy="true"
      aria-label={`Loading ${platform} embed`}
      style={{
        height,
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: surfaceBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          className="sm-skeleton-bar"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            flexShrink: 0,
            backgroundImage: shimmerGradient,
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            className="sm-skeleton-bar"
            style={{
              width: '45%',
              height: 12,
              borderRadius: 6,
              backgroundImage: shimmerGradient,
            }}
          />
          <div
            className="sm-skeleton-bar"
            style={{
              width: '30%',
              height: 10,
              borderRadius: 5,
              backgroundImage: shimmerGradient,
            }}
          />
        </div>
      </div>

      {/* Text lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          className="sm-skeleton-bar"
          style={{
            width: '92%',
            height: 12,
            borderRadius: 6,
            backgroundImage: shimmerGradient,
          }}
        />
        <div
          className="sm-skeleton-bar"
          style={{
            width: '74%',
            height: 12,
            borderRadius: 6,
            backgroundImage: shimmerGradient,
          }}
        />
      </div>

      {/* Media block */}
      <div
        className="sm-skeleton-bar"
        style={{
          flex: 1,
          minHeight: Math.min(mediaHeight, 260),
          borderRadius: 10,
          backgroundImage: shimmerGradient,
        }}
      />
    </div>
  );
};

interface EmbedErrorFallbackProps {
  url: string;
  platform: SocialPlatform;
  theme: 'light' | 'dark';
}

const EmbedErrorFallback: React.FC<EmbedErrorFallbackProps> = ({
  url,
  platform,
  theme,
}) => {
  const isDark = theme === 'dark' && platform === 'twitter';
  const label = platform === 'twitter' ? 'View on X' : 'View on Instagram';

  return (
    <div
      className="sm-embed-fallback"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 140,
        padding: 20,
        boxSizing: 'border-box',
        backgroundColor: isDark ? '#16181c' : '#fafafa',
        border: `1px solid ${isDark ? '#2f3336' : '#e5e7eb'}`,
        borderRadius: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: isDark ? '#8b98a5' : '#6b7280',
        }}
      >
        Embed unavailable
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: platform === 'instagram' ? '#e1306c' : '#1d9bf0',
          textDecoration: 'none',
        }}
      >
        {label} ↗
      </a>
    </div>
  );
};

// ============================================
// Twitter Embed Component
// ============================================

interface TwitterEmbedProps {
  url: string;
  theme?: 'light' | 'dark';
  defaultHeight: number;
  hideCard?: boolean;
  hideThread?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onHeightChange?: (height: number) => void;
}

const TwitterEmbed: React.FC<TwitterEmbedProps> = ({
  url,
  theme = 'light',
  defaultHeight,
  hideCard = false,
  hideThread = true,
  onLoad,
  onError,
  onHeightChange,
}) => {
  const embedRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Store callbacks in refs to avoid re-running effects
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onHeightChangeRef = useRef(onHeightChange);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onHeightChangeRef.current = onHeightChange;
  });

  // Watch rendered content height only after loading completes
  useEffect(() => {
    if (status === 'loading') return;

    const target = status === 'loaded' ? embedRef.current : fallbackRef.current;
    if (!target) return;

    const measure = () => {
      const rectHeight = target.getBoundingClientRect().height;
      if (rectHeight > 0) {
        onHeightChangeRef.current?.(rectHeight);
      }
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          onHeightChangeRef.current?.(height);
        }
      }
    });

    resizeObserver.observe(target);
    return () => resizeObserver.disconnect();
  }, [status]);

  useEffect(() => {
    const embedContainer = embedRef.current;
    if (!embedContainer) return;

    let cancelled = false;
    const widgetContainer = document.createElement('div');
    embedContainer.appendChild(widgetContainer);
    setStatus('loading');

    const tweetId = extractTweetId(url);
    if (!tweetId) {
      setStatus('error');
      onErrorRef.current?.(new Error('Invalid Twitter URL'));
      return () => {
        cancelled = true;
        if (widgetContainer.parentNode === embedContainer) {
          embedContainer.removeChild(widgetContainer);
        }
      };
    }

    loadTwitterScript()
      .then((twttr) => {
        if (cancelled) return;
        if (!twttr.widgets) {
          setStatus('error');
          onErrorRef.current?.(new Error('Twitter widgets not loaded'));
          return;
        }

        const widgetOptions: Record<string, unknown> = {
          theme,
          conversation: hideThread ? 'none' : 'all',
          dnt: true,
        };
        if (hideCard) {
          widgetOptions.cards = 'hidden';
        }

        return twttr.widgets.createTweet(tweetId, widgetContainer, widgetOptions).then((el) => {
          if (cancelled) return;
          if (el) {
            setStatus('loaded');
            onLoadRef.current?.();
          } else {
            setStatus('error');
            onErrorRef.current?.(new Error('Tweet not found or unavailable'));
          }
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
      if (widgetContainer.parentNode === embedContainer) {
        embedContainer.removeChild(widgetContainer);
      }
    };
  }, [url, theme, hideCard, hideThread]);

  const isLoading = status === 'loading';

  return (
    <div
      className="sm-twitter-embed"
      style={{
        position: 'relative',
        height: isLoading ? defaultHeight : undefined,
        overflow: isLoading ? 'hidden' : undefined,
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
          }}
        >
          <EmbedSkeleton height={defaultHeight} theme={theme} platform="twitter" />
        </div>
      )}
      {status === 'error' ? (
        <div ref={fallbackRef}>
          <EmbedErrorFallback url={url} platform="twitter" theme={theme} />
        </div>
      ) : null}
      <div
        ref={embedRef}
        style={{
          opacity: status === 'loaded' ? 1 : 0,
          transition: 'opacity 250ms ease',
          display: status === 'error' ? 'none' : undefined,
        }}
      />
    </div>
  );
};

// ============================================
// Instagram Embed Component
// ============================================

const INSTAGRAM_MIN_RENDERED_HEIGHT = 150;
const INSTAGRAM_SETTLE_DELAY_MS = 120;
const INSTAGRAM_TIMEOUT_MS = 8000;

interface InstagramEmbedProps {
  url: string;
  theme?: 'light' | 'dark';
  defaultHeight: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onHeightChange?: (height: number) => void;
}

const InstagramEmbed: React.FC<InstagramEmbedProps> = ({
  url,
  theme = 'light',
  defaultHeight,
  onLoad,
  onError,
  onHeightChange,
}) => {
  const embedRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Store callbacks in refs to avoid re-running effects
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onHeightChangeRef = useRef(onHeightChange);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onHeightChangeRef.current = onHeightChange;
  });

  // Watch rendered content height only after loading completes
  useEffect(() => {
    if (status === 'loading') return;

    const target = status === 'loaded' ? embedRef.current : fallbackRef.current;
    if (!target) return;

    const measure = () => {
      const rectHeight = target.getBoundingClientRect().height;
      if (rectHeight > 0) {
        onHeightChangeRef.current?.(rectHeight);
      }
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          onHeightChangeRef.current?.(height);
        }
      }
    });

    resizeObserver.observe(target);
    return () => resizeObserver.disconnect();
  }, [status]);

  useEffect(() => {
    const embedContainer = embedRef.current;
    if (!embedContainer) return;

    let cancelled = false;
    let settled = false;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let mutationObserver: MutationObserver | null = null;
    let probeResizeObserver: ResizeObserver | null = null;

    setStatus('loading');

    const match = url.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
    if (!match) {
      setStatus('error');
      onErrorRef.current?.(new Error('Invalid Instagram URL'));
      return;
    }

    const [, postType, postId] = match;

    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = `
      <blockquote
        class="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink="https://www.instagram.com/${postType}/${postId}/"
        data-instgrm-version="14"
        style="
          background:#FFF;
          border:0;
          border-radius:12px;
          box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);
          margin: 0;
          max-width:100%;
          min-width:100%;
          padding:0;
          width:100%;
        "
      >
      </blockquote>
    `;
    embedContainer.appendChild(widgetContainer);

    const cleanupObservers = () => {
      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      mutationObserver?.disconnect();
      mutationObserver = null;
      probeResizeObserver?.disconnect();
      probeResizeObserver = null;
    };

    const markLoaded = () => {
      if (cancelled || settled) return;
      settled = true;
      cleanupObservers();
      setStatus('loaded');
      onLoadRef.current?.();
    };

    const checkIframeReady = () => {
      if (cancelled || settled) return;
      const iframe = widgetContainer.querySelector('iframe');
      if (!iframe) return;

      const iframeHeight = iframe.getBoundingClientRect().height;
      if (iframeHeight >= INSTAGRAM_MIN_RENDERED_HEIGHT) {
        // Wait briefly for Instagram's postMessage height adjustment to settle
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(markLoaded, INSTAGRAM_SETTLE_DELAY_MS);
      }
    };

    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(checkIframeReady);
      mutationObserver.observe(widgetContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'height', 'class'],
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      probeResizeObserver = new ResizeObserver(checkIframeReady);
      probeResizeObserver.observe(widgetContainer);
    }

    loadInstagramScript()
      .then(() => {
        if (cancelled) return;
        scheduleInstagramProcess();

        timeoutTimer = setTimeout(() => {
          if (cancelled || settled) return;
          const iframe = widgetContainer.querySelector('iframe');
          if (iframe && iframe.getBoundingClientRect().height > 0) {
            markLoaded();
          } else {
            settled = true;
            cleanupObservers();
            setStatus('error');
            onErrorRef.current?.(new Error('Instagram embed timed out'));
          }
        }, INSTAGRAM_TIMEOUT_MS);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        settled = true;
        cleanupObservers();
        setStatus('error');
        onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
      cleanupObservers();
      if (widgetContainer.parentNode === embedContainer) {
        embedContainer.removeChild(widgetContainer);
      }
    };
  }, [url]);

  const isLoading = status === 'loading';

  return (
    <div
      className="sm-instagram-embed"
      style={{
        position: 'relative',
        height: isLoading ? defaultHeight : undefined,
        overflow: isLoading ? 'hidden' : undefined,
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
          }}
        >
          <EmbedSkeleton height={defaultHeight} theme={theme} platform="instagram" />
        </div>
      )}
      {status === 'error' ? (
        <div ref={fallbackRef}>
          <EmbedErrorFallback url={url} platform="instagram" theme={theme} />
        </div>
      ) : null}
      <div
        ref={embedRef}
        style={{
          opacity: status === 'loaded' ? 1 : 0,
          transition: 'opacity 250ms ease',
          display: status === 'error' ? 'none' : undefined,
        }}
      />
    </div>
  );
};

// ============================================
// Lazy Embed Component
// ============================================

interface LazyEmbedProps {
  children: React.ReactNode;
  rootMargin: string;
  placeholder: React.ReactNode;
}

const LazyEmbed: React.FC<LazyEmbedProps> = ({ children, rootMargin, placeholder }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return <div ref={ref}>{visible ? children : placeholder}</div>;
};

// ============================================
// Main Component
// ============================================

const HEIGHT_CHANGE_THRESHOLD = 2;

export interface SocialMasonryRef {
  addPosts: (posts: SocialPost[]) => void;
  setPosts: (posts: SocialPost[]) => void;
  removePost: (id: string) => void;
  refresh: () => void;
}

export const SocialMasonry = forwardRef<SocialMasonryRef, SocialMasonryProps>(
  (props, ref) => {
    const {
      posts: initialPosts = [],
      gap = 16,
      padding = 0,
      columns = defaultColumnConfig,
      theme = 'light',
      twitterHeight = DEFAULT_TWITTER_HEIGHT,
      instagramHeight = DEFAULT_INSTAGRAM_HEIGHT,
      twitterHideCard = false,
      twitterHideThread = true,
      animate = true,
      animationDuration = 300,
      animationEasing = 'ease-out',
      staggerDelay = 0,
      lazyLoad = false,
      lazyLoadRootMargin = '200px 0px',
      onLayoutComplete,
      onEmbedLoad,
      onEmbedError,
      className,
      style,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
    const [containerWidth, setContainerWidth] = useState(0);
    const [columnCount, setColumnCount] = useState(3);
    const [itemHeights, setItemHeights] = useState<Map<string, number>>(new Map());
    const [transitionsEnabled, setTransitionsEnabled] = useState(false);

    const reducedMotion = usePrefersReducedMotion();

    // Pin column assignments per columnCount so embeds never jump horizontally while loading
    const pinnedColumnsRef = useRef<Map<string, number>>(new Map());
    const lastColumnCountRef = useRef<number>(columnCount);
    const lastContainerWidthRef = useRef<number>(containerWidth);
    const knownPostIdsRef = useRef<Set<string>>(new Set());

    // rAF batching for ResizeObserver height updates
    const pendingHeightsRef = useRef<Map<string, number>>(new Map());
    const rafIdRef = useRef<number | null>(null);

    const onLayoutCompleteRef = useRef(onLayoutComplete);
    useEffect(() => {
      onLayoutCompleteRef.current = onLayoutComplete;
    });

    // Update posts when initialPosts prop changes
    useEffect(() => {
      setPosts(initialPosts);
    }, [initialPosts]);

    // Track container width and responsive column count
    useEffect(() => {
      const updateSize = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
        const count = getColumnCount(columns, width);
        setColumnCount(count);
      };

      updateSize();

      if (typeof ResizeObserver === 'undefined') return;

      const resizeObserver = new ResizeObserver(updateSize);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [columns]);

    // Detect if this render is a structural relayout (columnCount or width change)
    const isColumnCountChanged =
      lastColumnCountRef.current !== columnCount && pinnedColumnsRef.current.size > 0;
    const isRelayout =
      isColumnCountChanged ||
      (lastContainerWidthRef.current !== 0 &&
        lastContainerWidthRef.current !== containerWidth);

    // Calculate layout with column pinning (cleared automatically when columnCount changes)
    const layout = useMemo(() => {
      if (containerWidth === 0) {
        return {
          positions: new Map<string, ItemPosition>(),
          columnHeights: [] as number[],
          containerHeight: 0,
          columnWidth: 0,
          columnAssignments: new Map<string, number>(),
        };
      }

      const activePinnedColumns =
        lastColumnCountRef.current === columnCount
          ? pinnedColumnsRef.current
          : undefined;

      return calculateMasonryLayout({
        posts,
        containerWidth,
        columnCount,
        gap,
        padding,
        itemHeights,
        twitterHeight,
        instagramHeight,
        pinnedColumns: activePinnedColumns,
        constrainEmbedWidth: true,
      });
    }, [
      posts,
      containerWidth,
      columnCount,
      gap,
      padding,
      itemHeights,
      twitterHeight,
      instagramHeight,
    ]);

    // Commit column assignments and container metrics synchronously after layout
    useIsomorphicLayoutEffect(() => {
      if (containerWidth === 0) return;
      pinnedColumnsRef.current = layout.columnAssignments;
      lastColumnCountRef.current = columnCount;
      lastContainerWidthRef.current = containerWidth;
    }, [layout, columnCount, containerWidth]);

    // Enable CSS transitions only after initial layout has painted (prevents fly-in from 0,0)
    useEffect(() => {
      if (transitionsEnabled || layout.positions.size === 0) return;
      const id = requestAnimationFrame(() => {
        setTransitionsEnabled(true);
      });
      return () => cancelAnimationFrame(id);
    }, [transitionsEnabled, layout.positions.size]);

    // Track known post IDs and fire onLayoutComplete callback
    useEffect(() => {
      if (layout.positions.size === 0) return;

      knownPostIdsRef.current = new Set(layout.positions.keys());
      onLayoutCompleteRef.current?.(Array.from(layout.positions.values()));
    }, [layout]);

    // Cancel any queued height rAF on unmount
    useEffect(() => {
      return () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      };
    }, []);

    // Batched height change handler (coalesces multiple ResizeObserver ticks per frame)
    const handleHeightChange = useCallback((postId: string, rawHeight: number) => {
      const height = Math.round(rawHeight);
      if (height <= 0) return;

      pendingHeightsRef.current.set(postId, height);

      if (rafIdRef.current !== null) return;

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const updates = pendingHeightsRef.current;
        if (updates.size === 0) return;

        setItemHeights((prev) => {
          let changed = false;
          const next = new Map(prev);

          updates.forEach((nextHeight, id) => {
            const currentHeight = prev.get(id);
            if (
              currentHeight === undefined ||
              Math.abs(currentHeight - nextHeight) >= HEIGHT_CHANGE_THRESHOLD
            ) {
              next.set(id, nextHeight);
              changed = true;
            }
          });

          return changed ? next : prev;
        });

        updates.clear();
      });
    }, []);

    // Expose imperative methods via ref
    useImperativeHandle(
      ref,
      () => ({
        addPosts: (newPosts: SocialPost[]) => {
          setPosts((prev) => [...prev, ...newPosts]);
        },
        setPosts: (newPosts: SocialPost[]) => {
          pinnedColumnsRef.current = new Map();
          setPosts(newPosts);
        },
        removePost: (id: string) => {
          setPosts((prev) => prev.filter((p) => generatePostId(p) !== id));
          setItemHeights((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        },
        refresh: () => {
          const instgrm = (window as EmbedWindow).instgrm;
          instgrm?.Embeds?.process();
        },
      }),
      []
    );

    const shouldAnimate = animate && !reducedMotion && transitionsEnabled;

    return (
      <div
        ref={containerRef}
        className={`sm-container ${className || ''}`}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: posts.length > 0 ? 200 : undefined,
          height: layout.containerHeight || undefined,
          transition: shouldAnimate
            ? `height ${animationDuration}ms ${animationEasing}`
            : undefined,
          ...style,
        }}
      >
        {posts.map((post, index) => {
          const postId = generatePostId(post);
          const position = layout.positions.get(postId);
          const isNewPost =
            transitionsEnabled && !knownPostIdsRef.current.has(postId);

          // Apply stagger delay only on structural relayouts (column/width changes),
          // not on individual embed height settling
          const delay = isRelayout ? index * staggerDelay : 0;

          const itemStyle: React.CSSProperties = position
            ? {
                position: 'absolute',
                top: 0,
                left: 0,
                width: position.width,
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                transition:
                  shouldAnimate && !isNewPost
                    ? `transform ${animationDuration}ms ${animationEasing} ${delay}ms`
                    : 'none',
                willChange: animate && !reducedMotion ? 'transform' : undefined,
              }
            : {
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0,
                pointerEvents: 'none',
              };

          let embedContent: React.ReactNode = null;
          let embedClassName = '';
          let defaultHeight = 0;

          if (post.platform === 'twitter') {
            embedClassName = 'sm-embed sm-embed--twitter';
            defaultHeight = itemHeights.get(postId) ?? twitterHeight;
            embedContent = (
              <TwitterEmbed
                url={post.url}
                theme={theme}
                defaultHeight={defaultHeight}
                hideCard={twitterHideCard}
                hideThread={twitterHideThread}
                onLoad={() => onEmbedLoad?.(post)}
                onError={(error) => onEmbedError?.(post, error)}
                onHeightChange={(h) => handleHeightChange(postId, h)}
              />
            );
          } else if (post.platform === 'instagram') {
            embedClassName = 'sm-embed sm-embed--instagram';
            defaultHeight = itemHeights.get(postId) ?? instagramHeight;
            embedContent = (
              <InstagramEmbed
                url={post.url}
                theme={theme}
                defaultHeight={defaultHeight}
                onLoad={() => onEmbedLoad?.(post)}
                onError={(error) => onEmbedError?.(post, error)}
                onHeightChange={(h) => handleHeightChange(postId, h)}
              />
            );
          } else {
            return null;
          }

          const wrappedContent = lazyLoad ? (
            <LazyEmbed
              rootMargin={lazyLoadRootMargin}
              placeholder={
                <EmbedSkeleton
                  height={defaultHeight}
                  theme={theme}
                  platform={post.platform}
                />
              }
            >
              {embedContent}
            </LazyEmbed>
          ) : (
            embedContent
          );

          return (
            <div key={postId} className={embedClassName} style={itemStyle}>
              {wrappedContent}
            </div>
          );
        })}

        {posts.length === 0 && (
          <div
            className="sm-empty"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              color: '#666',
              fontSize: 14,
              width: '100%',
            }}
          >
            No posts to display
          </div>
        )}
      </div>
    );
  }
);

SocialMasonry.displayName = 'SocialMasonry';

export default SocialMasonry;

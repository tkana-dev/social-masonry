/**
 * Social Masonry - Type Definitions
 * Beautiful masonry layout for social media embeds
 */

// ============================================
// Post Types
// ============================================

export type SocialPlatform = 'twitter' | 'instagram';

export interface TwitterPost {
  platform: 'twitter';
  id: string;
  url: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  content: {
    text: string;
    html?: string;
  };
  media?: {
    type: 'image' | 'video' | 'gif';
    url: string;
    thumbnailUrl?: string;
    aspectRatio?: number;
    width?: number;
    height?: number;
  }[];
  metrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    views?: number;
  };
  createdAt: string | Date;
  quotedPost?: Omit<TwitterPost, 'quotedPost'>;
}

export interface InstagramPost {
  platform: 'instagram';
  id: string;
  url: string;
  author: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  content: {
    caption?: string;
  };
  media: {
    type: 'image' | 'video' | 'carousel';
    url: string;
    thumbnailUrl?: string;
    aspectRatio?: number;
    width?: number;
    height?: number;
    carouselItems?: {
      type: 'image' | 'video';
      url: string;
      thumbnailUrl?: string;
    }[];
  };
  metrics?: {
    likes?: number;
    comments?: number;
  };
  createdAt: string | Date;
}

export type SocialPost = TwitterPost | InstagramPost;

// ============================================
// Layout Configuration
// ============================================

export interface ColumnConfig {
  /** Number of columns at this breakpoint */
  columns: number;
  /** Minimum viewport width for this config (px) */
  minWidth: number;
}

export interface MasonryConfig {
  /** Gap between items (px or CSS value) */
  gap?: number | string;
  /** Responsive column configuration */
  columns?: number | ColumnConfig[];
  /** Default number of columns */
  defaultColumns?: number;
  /** Padding around the container */
  padding?: number | string;
  /** Animation duration for layout changes (ms) */
  animationDuration?: number;
  /** Enable/disable animations */
  animate?: boolean;
  /** Transition easing function */
  easing?: string;
}

// ============================================
// Virtualization Options
// ============================================

export interface VirtualizationConfig {
  /** Enable virtualization */
  enabled?: boolean;
  /** Number of items to render outside viewport */
  overscan?: number;
  /** Estimated item height for initial render */
  estimatedItemHeight?: number;
  /** Scroll container element (default: window) */
  scrollContainer?: HTMLElement | Window | null;
}

// ============================================
// Card Styling
// ============================================

export type CardVariant = 'default' | 'minimal' | 'elevated' | 'bordered' | 'glass';
export type CardTheme = 'light' | 'dark' | 'auto';

export interface CardConfig {
  /** Card visual variant */
  variant?: CardVariant;
  /** Color theme */
  theme?: CardTheme;
  /** Border radius (px or CSS value) */
  borderRadius?: number | string;
  /** Show platform icon */
  showPlatformIcon?: boolean;
  /** Show author info */
  showAuthor?: boolean;
  /** Show metrics (likes, comments, etc.) */
  showMetrics?: boolean;
  /** Show timestamp */
  showTimestamp?: boolean;
  /** Date format function */
  formatDate?: (date: Date) => string;
  /** Number format function */
  formatNumber?: (num: number) => string;
  /** Custom CSS class */
  className?: string;
  /** Enable hover effects */
  hoverEffect?: boolean;
  /** Image loading strategy */
  imageLoading?: 'lazy' | 'eager';
  /** Fallback image URL */
  fallbackImage?: string;
}

// ============================================
// Event Handlers
// ============================================

export interface MasonryEvents {
  /** Called when a post card is clicked */
  onPostClick?: (post: SocialPost, event: MouseEvent) => void;
  /** Called when author is clicked */
  onAuthorClick?: (post: SocialPost, event: MouseEvent) => void;
  /** Called when media is clicked */
  onMediaClick?: (post: SocialPost, mediaIndex: number, event: MouseEvent) => void;
  /** Called when layout is recalculated */
  onLayoutComplete?: (positions: ItemPosition[]) => void;
  /** Called when scrolling reaches near the end */
  onLoadMore?: () => void | Promise<void>;
  /** Called when an image fails to load */
  onImageError?: (post: SocialPost, error: Error) => void;
}

// ============================================
// Internal Types
// ============================================

export interface ItemPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  column: number;
}

export interface LayoutState {
  positions: Map<string, ItemPosition>;
  columnHeights: number[];
  containerHeight: number;
  columnWidth: number;
}

export interface VirtualItem {
  index: number;
  post: SocialPost;
  position: ItemPosition;
  isVisible: boolean;
}

// ============================================
// Main Options Interface
// ============================================

export interface SocialMasonryOptions extends MasonryConfig, CardConfig, MasonryEvents {
  /** Posts to display */
  posts: SocialPost[];
  /** Container element or selector */
  container: HTMLElement | string;
  /** Virtualization settings */
  virtualization?: VirtualizationConfig;
  /** Load more threshold (px from bottom) */
  loadMoreThreshold?: number;
  /** Show loading indicator */
  showLoading?: boolean;
  /** Custom loading element */
  loadingElement?: HTMLElement | string;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom empty state element */
  emptyElement?: HTMLElement | string;
  /** Enable debug mode */
  debug?: boolean;
}

// ============================================
// React Component Props
// ============================================

export interface SocialMasonryProps extends Omit<SocialMasonryOptions, 'container'> {
  /** Additional CSS class for container */
  className?: string;
  /** Inline styles for container */
  style?: React.CSSProperties;
  /** Ref to container element */
  containerRef?: React.RefObject<HTMLDivElement>;
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

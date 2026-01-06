/**
 * Social Masonry - Virtualization Engine
 * Handles virtual scrolling for large lists
 */

import type {
  ItemPosition,
  SocialPost,
  VirtualItem,
  VirtualizationConfig,
} from './types';
import {
  getScrollPosition,
  isInViewport,
  throttle,
  raf,
  cancelRaf,
} from './utils';

export interface VirtualizationEngineOptions extends VirtualizationConfig {
  posts: SocialPost[];
  positions: Map<string, ItemPosition>;
  onVisibleItemsChange?: (items: VirtualItem[]) => void;
}

export class VirtualizationEngine {
  private options: Required<VirtualizationConfig>;
  private posts: SocialPost[];
  private positions: Map<string, ItemPosition>;
  private visibleItems: VirtualItem[] = [];
  private scrollHandler: () => void;
  private rafId: number | null = null;
  private lastScrollTop = 0;
  private isScrolling = false;
  private scrollEndTimeout: ReturnType<typeof setTimeout> | null = null;
  private onVisibleItemsChange?: (items: VirtualItem[]) => void;

  constructor(options: VirtualizationEngineOptions) {
    this.options = {
      enabled: true,
      overscan: 3,
      estimatedItemHeight: 400,
      scrollContainer: null,
      ...options,
    };
    
    this.posts = options.posts;
    this.positions = options.positions;
    this.onVisibleItemsChange = options.onVisibleItemsChange;

    this.scrollHandler = throttle(this.handleScroll.bind(this), 16);
  }

  /**
   * Initialize scroll listener
   */
  init(): void {
    if (!this.options.enabled) return;

    const container = this.options.scrollContainer ?? window;
    container.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    // Initial calculation
    this.calculateVisibleItems();
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    const container = this.options.scrollContainer ?? window;
    container.removeEventListener('scroll', this.scrollHandler);
    
    if (this.rafId !== null) {
      cancelRaf(this.rafId);
    }
    
    if (this.scrollEndTimeout) {
      clearTimeout(this.scrollEndTimeout);
    }
  }

  /**
   * Handle scroll event
   */
  private handleScroll(): void {
    if (this.rafId !== null) return;

    this.isScrolling = true;
    
    // Clear existing scroll end timeout
    if (this.scrollEndTimeout) {
      clearTimeout(this.scrollEndTimeout);
    }
    
    // Set scroll end detection
    this.scrollEndTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 150);

    this.rafId = raf(() => {
      this.rafId = null;
      this.calculateVisibleItems();
    });
  }

  /**
   * Calculate which items are visible
   */
  calculateVisibleItems(): VirtualItem[] {
    const { scrollTop, viewportHeight } = getScrollPosition(this.options.scrollContainer);
    const overscanPx = this.options.overscan * this.options.estimatedItemHeight;
    
    this.lastScrollTop = scrollTop;
    
    const newVisibleItems: VirtualItem[] = [];

    for (let i = 0; i < this.posts.length; i++) {
      const post = this.posts[i];
      const position = this.positions.get(post.id);
      
      if (!position) continue;

      const isVisible = isInViewport(
        {
          top: position.y,
          bottom: position.y + position.height,
        },
        scrollTop,
        viewportHeight,
        overscanPx
      );

      if (isVisible) {
        newVisibleItems.push({
          index: i,
          post,
          position,
          isVisible: true,
        });
      }
    }

    // Check if visible items changed
    const hasChanged = this.hasVisibleItemsChanged(newVisibleItems);
    
    if (hasChanged) {
      this.visibleItems = newVisibleItems;
      this.onVisibleItemsChange?.(newVisibleItems);
    }

    return this.visibleItems;
  }

  /**
   * Check if visible items have changed
   */
  private hasVisibleItemsChanged(newItems: VirtualItem[]): boolean {
    if (newItems.length !== this.visibleItems.length) {
      return true;
    }

    for (let i = 0; i < newItems.length; i++) {
      if (newItems[i].post.id !== this.visibleItems[i].post.id) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update posts and positions
   */
  update(posts: SocialPost[], positions: Map<string, ItemPosition>): void {
    this.posts = posts;
    this.positions = positions;
    this.calculateVisibleItems();
  }

  /**
   * Get visible items
   */
  getVisibleItems(): VirtualItem[] {
    return this.visibleItems;
  }

  /**
   * Get all items (for non-virtualized mode)
   */
  getAllItems(): VirtualItem[] {
    return this.posts.map((post, index) => ({
      index,
      post,
      position: this.positions.get(post.id)!,
      isVisible: true,
    }));
  }

  /**
   * Check if scrolling
   */
  getIsScrolling(): boolean {
    return this.isScrolling;
  }

  /**
   * Get scroll direction
   */
  getScrollDirection(): 'up' | 'down' | 'none' {
    const { scrollTop } = getScrollPosition(this.options.scrollContainer);
    
    if (scrollTop > this.lastScrollTop) {
      return 'down';
    } else if (scrollTop < this.lastScrollTop) {
      return 'up';
    }
    
    return 'none';
  }

  /**
   * Check if near bottom (for infinite scroll)
   */
  isNearBottom(threshold: number = 500): boolean {
    const { scrollTop, viewportHeight } = getScrollPosition(this.options.scrollContainer);
    
    // Get container height from positions
    let maxBottom = 0;
    for (const position of this.positions.values()) {
      maxBottom = Math.max(maxBottom, position.y + position.height);
    }
    
    return scrollTop + viewportHeight >= maxBottom - threshold;
  }

  /**
   * Scroll to item
   */
  scrollToItem(id: string, behavior: ScrollBehavior = 'smooth'): void {
    const position = this.positions.get(id);
    if (!position) return;

    const container = this.options.scrollContainer ?? window;
    
    if (container === window) {
      window.scrollTo({
        top: position.y,
        behavior,
      });
    } else {
      (container as HTMLElement).scrollTo({
        top: position.y,
        behavior,
      });
    }
  }

  /**
   * Get render range for optimization
   */
  getRenderRange(): { start: number; end: number } {
    if (this.visibleItems.length === 0) {
      return { start: 0, end: 0 };
    }

    const indices = this.visibleItems.map(item => item.index);
    return {
      start: Math.min(...indices),
      end: Math.max(...indices) + 1,
    };
  }
}

/**
 * Create a new virtualization engine instance
 */
export function createVirtualizationEngine(
  options: VirtualizationEngineOptions
): VirtualizationEngine {
  return new VirtualizationEngine(options);
}

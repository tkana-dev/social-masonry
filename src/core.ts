/**
 * Social Masonry - Main Class
 * Beautiful masonry layout for X (Twitter) and Instagram embeds
 */

import type {
  SocialMasonryOptions,
  SocialPost,
  ItemPosition,
  VirtualItem,
} from './types';
import { LayoutEngine } from './layout-engine';
import { VirtualizationEngine } from './virtualization-engine';
import { CardRenderer } from './card-renderer';
import {
  debounce,
  defaultColumnConfig,
  supportsResizeObserver,
  isBrowser,
  generateId,
} from './utils';

const DEFAULT_OPTIONS: Partial<SocialMasonryOptions> = {
  // Layout
  gap: 16,
  columns: defaultColumnConfig,
  defaultColumns: 3,
  padding: 0,
  animationDuration: 300,
  animate: true,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Card
  variant: 'default',
  theme: 'auto',
  borderRadius: 12,
  showPlatformIcon: true,
  showAuthor: true,
  showMetrics: true,
  showTimestamp: true,
  hoverEffect: true,
  imageLoading: 'lazy',
  
  // Virtualization
  virtualization: {
    enabled: false,
    overscan: 3,
    estimatedItemHeight: 400,
    scrollContainer: null,
  },
  
  // Infinite scroll
  loadMoreThreshold: 500,
  showLoading: true,
  
  // Debug
  debug: false,
};

export class SocialMasonry {
  private options: SocialMasonryOptions;
  private container: HTMLElement;
  private posts: SocialPost[] = [];
  private layoutEngine: LayoutEngine;
  private virtualizationEngine: VirtualizationEngine | null = null;
  private cardRenderer: CardRenderer;
  private cards: Map<string, HTMLElement> = new Map();
  private itemHeights: Map<string, number> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private isLoading = false;
  private instanceId: string;

  constructor(options: SocialMasonryOptions) {
    if (!isBrowser) {
      throw new Error('SocialMasonry requires a browser environment');
    }

    this.instanceId = generateId();
    this.options = { ...DEFAULT_OPTIONS, ...options } as SocialMasonryOptions;
    
    // Get container element
    const container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;
    
    if (!container) {
      throw new Error('Container element not found');
    }
    
    this.container = container as HTMLElement;
    this.posts = options.posts || [];

    // Initialize layout engine
    this.layoutEngine = new LayoutEngine({
      ...this.options,
      containerWidth: this.container.clientWidth,
      itemHeights: this.itemHeights,
    });

    // Initialize card renderer
    this.cardRenderer = new CardRenderer({
      ...this.options,
    });

    // Initialize virtualization if enabled
    if (this.options.virtualization?.enabled) {
      this.initVirtualization();
    }

    // Setup
    this.setupContainer();
    this.setupResizeObserver();
    this.render();
    
    if (this.options.debug) {
      console.log('[SocialMasonry] Initialized', {
        instanceId: this.instanceId,
        posts: this.posts.length,
        containerWidth: this.container.clientWidth,
      });
    }
  }

  /**
   * Setup container styles
   */
  private setupContainer(): void {
    this.container.classList.add('sm-container');
    this.container.setAttribute('data-sm-instance', this.instanceId);
    
    Object.assign(this.container.style, {
      position: 'relative',
      width: '100%',
    });
  }

  /**
   * Setup resize observer
   */
  private setupResizeObserver(): void {
    if (!supportsResizeObserver) {
      // Fallback to window resize
      window.addEventListener('resize', debounce(() => this.handleResize(), 150));
      return;
    }

    this.resizeObserver = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target === this.container) {
            this.handleResize();
          }
        }
      }, 150)
    );

    this.resizeObserver.observe(this.container);
  }

  /**
   * Handle container resize
   */
  private handleResize(): void {
    const newWidth = this.container.clientWidth;
    this.layoutEngine.setContainerWidth(newWidth);
    this.recalculateLayout();
    
    if (this.options.debug) {
      console.log('[SocialMasonry] Resize', { width: newWidth });
    }
  }

  /**
   * Initialize virtualization
   */
  private initVirtualization(): void {
    const state = this.layoutEngine.getState();
    
    this.virtualizationEngine = new VirtualizationEngine({
      ...this.options.virtualization,
      posts: this.posts,
      positions: state.positions,
      onVisibleItemsChange: (items) => this.handleVisibleItemsChange(items),
    });

    this.virtualizationEngine.init();

    // Setup infinite scroll
    if (this.options.onLoadMore) {
      this.setupInfiniteScroll();
    }
  }

  /**
   * Handle visible items change (for virtualization)
   */
  private handleVisibleItemsChange(items: VirtualItem[]): void {
    const visibleIds = new Set(items.map(item => item.post.id));
    
    // Remove cards that are no longer visible
    for (const [id, card] of this.cards) {
      if (!visibleIds.has(id)) {
        card.remove();
        this.cards.delete(id);
      }
    }

    // Add new visible cards
    for (const item of items) {
      if (!this.cards.has(item.post.id)) {
        this.renderCard(item.post, item.position);
      }
    }
  }

  /**
   * Setup infinite scroll
   */
  private setupInfiniteScroll(): void {
    const checkLoadMore = () => {
      if (
        !this.isLoading &&
        this.virtualizationEngine?.isNearBottom(this.options.loadMoreThreshold || 500)
      ) {
        this.loadMore();
      }
    };

    const scrollContainer = this.options.virtualization?.scrollContainer ?? window;
    scrollContainer.addEventListener('scroll', checkLoadMore, { passive: true });
  }

  /**
   * Load more posts
   */
  private async loadMore(): Promise<void> {
    if (this.isLoading || !this.options.onLoadMore) return;

    this.isLoading = true;
    this.showLoadingIndicator();

    try {
      await this.options.onLoadMore();
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  /**
   * Show loading indicator
   */
  private showLoadingIndicator(): void {
    if (!this.options.showLoading) return;

    let loader = this.container.querySelector('.sm-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'sm-loader';
      
      if (this.options.loadingElement) {
        if (typeof this.options.loadingElement === 'string') {
          loader.innerHTML = this.options.loadingElement;
        } else {
          loader.appendChild(this.options.loadingElement.cloneNode(true));
        }
      } else {
        loader.innerHTML = `
          <div class="sm-loader__spinner">
            <div></div><div></div><div></div>
          </div>
        `;
      }
      
      this.container.appendChild(loader);
    }

    (loader as HTMLElement).style.display = 'flex';
  }

  /**
   * Hide loading indicator
   */
  private hideLoadingIndicator(): void {
    const loader = this.container.querySelector('.sm-loader');
    if (loader) {
      (loader as HTMLElement).style.display = 'none';
    }
  }

  /**
   * Render all posts
   */
  private render(): void {
    // Calculate layout
    const state = this.layoutEngine.calculate(this.posts);
    
    // Update container height
    this.container.style.height = `${state.containerHeight}px`;

    // Apply CSS variables
    const cssVars = this.layoutEngine.getCSSVariables();
    for (const [key, value] of Object.entries(cssVars)) {
      this.container.style.setProperty(key, value);
    }

    // Render cards
    if (this.virtualizationEngine) {
      // Virtualized rendering
      this.virtualizationEngine.update(this.posts, state.positions);
      const visibleItems = this.virtualizationEngine.calculateVisibleItems();
      this.handleVisibleItemsChange(visibleItems);
    } else {
      // Full rendering
      for (const post of this.posts) {
        const position = state.positions.get(post.id);
        if (position) {
          this.renderCard(post, position);
        }
      }
    }

    // Show empty state if no posts
    if (this.posts.length === 0) {
      this.showEmptyState();
    } else {
      this.hideEmptyState();
    }

    // Callback
    this.options.onLayoutComplete?.(Array.from(state.positions.values()));
  }

  /**
   * Render a single card
   */
  private renderCard(post: SocialPost, position: ItemPosition): void {
    let card = this.cards.get(post.id);

    if (card) {
      // Update existing card position
      this.cardRenderer.updatePosition(card, position);
    } else {
      // Create new card
      card = this.cardRenderer.render(post, position);
      this.container.appendChild(card);
      this.cards.set(post.id, card);

      // Measure actual height after render
      requestAnimationFrame(() => {
        if (card) {
          const actualHeight = card.offsetHeight;
          if (actualHeight !== position.height) {
            this.itemHeights.set(post.id, actualHeight);
            this.recalculateLayout();
          }
        }
      });
    }
  }

  /**
   * Recalculate layout
   */
  private recalculateLayout(): void {
    const state = this.layoutEngine.calculate(this.posts);
    this.container.style.height = `${state.containerHeight}px`;

    // Update virtualization
    if (this.virtualizationEngine) {
      this.virtualizationEngine.update(this.posts, state.positions);
    }

    // Update card positions with animation
    for (const [id, card] of this.cards) {
      const position = state.positions.get(id);
      if (position) {
        if (this.options.animate) {
          card.style.transition = `left ${this.options.animationDuration}ms ${this.options.easing}, top ${this.options.animationDuration}ms ${this.options.easing}, width ${this.options.animationDuration}ms ${this.options.easing}`;
        }
        this.cardRenderer.updatePosition(card, position);
      }
    }

    this.options.onLayoutComplete?.(Array.from(state.positions.values()));
  }

  /**
   * Show empty state
   */
  private showEmptyState(): void {
    let empty = this.container.querySelector('.sm-empty');
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'sm-empty';
      
      if (this.options.emptyElement) {
        if (typeof this.options.emptyElement === 'string') {
          empty.innerHTML = this.options.emptyElement;
        } else {
          empty.appendChild(this.options.emptyElement.cloneNode(true));
        }
      } else {
        empty.textContent = this.options.emptyMessage || 'No posts to display';
      }
      
      this.container.appendChild(empty);
    }

    (empty as HTMLElement).style.display = 'flex';
  }

  /**
   * Hide empty state
   */
  private hideEmptyState(): void {
    const empty = this.container.querySelector('.sm-empty');
    if (empty) {
      (empty as HTMLElement).style.display = 'none';
    }
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Add posts
   */
  addPosts(posts: SocialPost[]): void {
    this.posts = [...this.posts, ...posts];
    this.render();
    
    if (this.options.debug) {
      console.log('[SocialMasonry] Added posts', { count: posts.length, total: this.posts.length });
    }
  }

  /**
   * Set posts (replace all)
   */
  setPosts(posts: SocialPost[]): void {
    // Clear existing cards
    for (const card of this.cards.values()) {
      card.remove();
    }
    this.cards.clear();
    this.itemHeights.clear();

    this.posts = posts;
    this.render();
    
    if (this.options.debug) {
      console.log('[SocialMasonry] Set posts', { count: posts.length });
    }
  }

  /**
   * Remove post
   */
  removePost(id: string): void {
    const card = this.cards.get(id);
    if (card) {
      card.remove();
      this.cards.delete(id);
    }
    
    this.itemHeights.delete(id);
    this.posts = this.posts.filter(p => p.id !== id);
    this.recalculateLayout();
    
    if (this.options.debug) {
      console.log('[SocialMasonry] Removed post', { id });
    }
  }

  /**
   * Update options
   */
  setOptions(options: Partial<SocialMasonryOptions>): void {
    this.options = { ...this.options, ...options };
    this.cardRenderer.setOptions(options);
    this.recalculateLayout();
  }

  /**
   * Get layout state
   */
  getLayoutState() {
    return this.layoutEngine.getState();
  }

  /**
   * Get posts
   */
  getPosts(): SocialPost[] {
    return [...this.posts];
  }

  /**
   * Scroll to post
   */
  scrollToPost(id: string, behavior: ScrollBehavior = 'smooth'): void {
    if (this.virtualizationEngine) {
      this.virtualizationEngine.scrollToItem(id, behavior);
    } else {
      const position = this.layoutEngine.getPosition(id);
      if (position) {
        window.scrollTo({
          top: position.y,
          behavior,
        });
      }
    }
  }

  /**
   * Refresh layout
   */
  refresh(): void {
    this.itemHeights.clear();
    this.recalculateLayout();
  }

  /**
   * Destroy instance
   */
  destroy(): void {
    // Remove cards
    for (const card of this.cards.values()) {
      card.remove();
    }
    this.cards.clear();

    // Remove observers
    this.resizeObserver?.disconnect();

    // Destroy virtualization
    this.virtualizationEngine?.destroy();

    // Clean up container
    this.container.classList.remove('sm-container');
    this.container.removeAttribute('data-sm-instance');
    this.container.style.cssText = '';

    // Remove internal elements
    const loader = this.container.querySelector('.sm-loader');
    const empty = this.container.querySelector('.sm-empty');
    loader?.remove();
    empty?.remove();
    
    if (this.options.debug) {
      console.log('[SocialMasonry] Destroyed', { instanceId: this.instanceId });
    }
  }
}

/**
 * Create a new SocialMasonry instance
 */
export function createSocialMasonry(options: SocialMasonryOptions): SocialMasonry {
  return new SocialMasonry(options);
}

export default SocialMasonry;

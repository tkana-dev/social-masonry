/**
 * Social Masonry - Layout Engine
 * Calculates positions for masonry grid items
 */

import type {
  ItemPosition,
  LayoutState,
  MasonryConfig,
  SocialPostInput,
} from './types';
import {
  defaultColumnConfig,
  getColumnCount,
  generatePostId,
  normalizePosts,
  DEFAULT_TWITTER_HEIGHT,
  DEFAULT_INSTAGRAM_HEIGHT,
} from './utils';

export const MAX_TWITTER_WIDTH = 550;
export const MAX_INSTAGRAM_WIDTH = 540;
export const MAX_EMBED_WIDTH = 550;

/**
 * Minimum height (px) considered a genuinely rendered embed.
 * Prevents unrendered off-screen iframes (~0-2px) from collapsing card slots
 * and causing subsequent cards to overlap.
 */
export const MIN_VALID_EMBED_HEIGHT = 50;

/**
 * Merge a batch of measured item heights into the existing height map.
 * Ignores sub-threshold jitter and implausibly small heights from unrendered iframes.
 * Returns the original `prev` reference when no meaningful change occurred.
 */
export function mergeItemHeights(
  prev: Map<string, number>,
  updates: ReadonlyMap<string, number>,
  threshold = 2,
  minHeight = MIN_VALID_EMBED_HEIGHT
): Map<string, number> {
  if (updates.size === 0) return prev;

  let changed = false;
  let next: Map<string, number> | null = null;

  updates.forEach((rawHeight, id) => {
    const nextHeight = Math.round(rawHeight);
    if (nextHeight < minHeight) return;

    const currentHeight = prev.get(id);
    if (
      currentHeight === undefined ||
      Math.abs(currentHeight - nextHeight) >= threshold
    ) {
      if (!next) {
        next = new Map(prev);
      }
      next.set(id, nextHeight);
      changed = true;
    }
  });

  return changed && next ? next : prev;
}

export interface CalculateLayoutOptions {
  posts: SocialPostInput[];
  containerWidth: number;
  columnCount: number;
  gap?: number;
  padding?: number;
  itemHeights: Map<string, number>;
  twitterHeight?: number;
  instagramHeight?: number;
  /**
   * Previously assigned column indices keyed by post ID.
   * When provided, existing posts stay in their assigned column (as long as it is
   * still within `0..columnCount - 1`) instead of jumping horizontally when heights change.
   */
  pinnedColumns?: Map<string, number>;
  /**
   * Cap column width to platform max embed widths and center the grid (default: true).
   */
  constrainEmbedWidth?: boolean;
}

export interface CalculateLayoutResult extends LayoutState {
  columnAssignments: Map<string, number>;
}

/**
 * Calculate masonry layout positions with optional column pinning.
 * Pinning prevents cards from jumping sideways across columns while embeds load.
 */
export function calculateMasonryLayout(
  options: CalculateLayoutOptions
): CalculateLayoutResult {
  const {
    posts,
    containerWidth,
    columnCount,
    gap = 16,
    padding = 0,
    itemHeights,
    twitterHeight = DEFAULT_TWITTER_HEIGHT,
    instagramHeight = DEFAULT_INSTAGRAM_HEIGHT,
    pinnedColumns,
    constrainEmbedWidth = true,
  } = options;

  const normalizedPosts = normalizePosts(posts);
  const safeColumnCount = Math.max(1, columnCount);
  const availableWidth = Math.max(0, containerWidth - padding * 2);
  const totalGapWidth = gap * (safeColumnCount - 1);
  const rawColumnWidth = Math.max(0, (availableWidth - totalGapWidth) / safeColumnCount);
  const columnWidth = constrainEmbedWidth
    ? Math.min(rawColumnWidth, MAX_EMBED_WIDTH)
    : rawColumnWidth;

  const totalGridWidth = columnWidth * safeColumnCount + totalGapWidth;
  const offsetX = padding + Math.max(0, (availableWidth - totalGridWidth) / 2);

  const columnHeights = new Array<number>(safeColumnCount).fill(0);
  const positions = new Map<string, ItemPosition>();
  const columnAssignments = new Map<string, number>();

  for (const post of normalizedPosts) {
    const postId = generatePostId(post);
    const defaultHeight =
      post.estimatedHeight ??
      (post.platform === 'instagram' ? instagramHeight : twitterHeight);
    const itemHeight = itemHeights.get(postId) ?? defaultHeight;

    // Keep existing column assignment if valid for current columnCount;
    // otherwise place in the currently shortest column.
    const pinnedColumn = pinnedColumns?.get(postId);
    const targetColumn =
      pinnedColumn !== undefined && pinnedColumn >= 0 && pinnedColumn < safeColumnCount
        ? pinnedColumn
        : columnHeights.indexOf(Math.min(...columnHeights));

    columnAssignments.set(postId, targetColumn);

    const x = offsetX + targetColumn * (columnWidth + gap);
    const y = columnHeights[targetColumn];

    const itemWidth = constrainEmbedWidth
      ? Math.min(
          columnWidth,
          post.platform === 'instagram' ? MAX_INSTAGRAM_WIDTH : MAX_TWITTER_WIDTH
        )
      : columnWidth;

    positions.set(postId, {
      id: postId,
      x,
      y,
      width: itemWidth,
      height: itemHeight,
      column: targetColumn,
    });

    columnHeights[targetColumn] = y + itemHeight + gap;
  }

  const containerHeight = Math.max(
    ...columnHeights.map((h) => Math.max(0, h - gap)),
    0
  );

  return {
    positions,
    columnHeights,
    containerHeight,
    columnWidth,
    columnAssignments,
  };
}

export interface LayoutEngineOptions extends MasonryConfig {
  containerWidth: number;
  itemHeights: Map<string, number>;
  twitterHeight?: number;
  instagramHeight?: number;
}

export class LayoutEngine {
  private options: Required<LayoutEngineOptions>;
  private state: LayoutState;
  private pinnedColumns: Map<string, number>;
  private lastColumnCount: number;

  constructor(options: LayoutEngineOptions) {
    this.options = {
      gap: 16,
      columns: defaultColumnConfig,
      padding: 0,
      animate: true,
      animationDuration: 300,
      animationEasing: 'ease-out',
      staggerDelay: 0,
      lazyLoad: false,
      lazyLoadRootMargin: '200px 0px',
      twitterHeight: DEFAULT_TWITTER_HEIGHT,
      instagramHeight: DEFAULT_INSTAGRAM_HEIGHT,
      ...options,
    };

    this.state = {
      positions: new Map(),
      columnHeights: [],
      containerHeight: 0,
      columnWidth: 0,
    };
    this.pinnedColumns = new Map();
    this.lastColumnCount = 0;
  }

  /**
   * Calculate layout for all posts
   */
  calculate(posts: SocialPostInput[]): LayoutState {
    const columnCount = getColumnCount(this.options.columns, this.options.containerWidth);

    if (columnCount !== this.lastColumnCount) {
      this.pinnedColumns.clear();
      this.lastColumnCount = columnCount;
    }

    const result = calculateMasonryLayout({
      posts,
      containerWidth: this.options.containerWidth,
      columnCount,
      gap: this.options.gap,
      padding: this.options.padding,
      itemHeights: this.options.itemHeights,
      twitterHeight: this.options.twitterHeight,
      instagramHeight: this.options.instagramHeight,
      pinnedColumns: this.pinnedColumns,
      constrainEmbedWidth: false,
    });

    this.pinnedColumns = result.columnAssignments;
    this.state = {
      positions: result.positions,
      columnHeights: result.columnHeights,
      containerHeight: result.containerHeight,
      columnWidth: result.columnWidth,
    };

    return this.state;
  }

  /**
   * Clear pinned column assignments to force full rebalancing on next calculate()
   */
  clearPinnedColumns(): void {
    this.pinnedColumns.clear();
  }

  /**
   * Update single item height
   */
  updateItemHeight(id: string, height: number): void {
    this.options.itemHeights.set(id, height);
  }

  /**
   * Get current layout state
   */
  getState(): LayoutState {
    return this.state;
  }

  /**
   * Get position for specific item
   */
  getPosition(id: string): ItemPosition | undefined {
    return this.state.positions.get(id);
  }

  /**
   * Update container width
   */
  setContainerWidth(width: number): void {
    this.options.containerWidth = width;
  }

  /**
   * Get current column count
   */
  getColumnCount(): number {
    return getColumnCount(this.options.columns, this.options.containerWidth);
  }
}

/**
 * Create a new layout engine instance
 */
export function createLayoutEngine(options: LayoutEngineOptions): LayoutEngine {
  return new LayoutEngine(options);
}

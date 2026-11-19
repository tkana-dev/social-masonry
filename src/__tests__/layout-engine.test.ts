import { describe, it, expect } from 'vitest';
import {
  calculateMasonryLayout,
  createLayoutEngine,
  MAX_TWITTER_WIDTH,
  MAX_INSTAGRAM_WIDTH,
} from '../layout-engine';
import type { SocialPost } from '../types';

const makePosts = (count: number): SocialPost[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `post-${i}`,
    platform: i % 3 === 2 ? 'instagram' : 'twitter',
    url:
      i % 3 === 2
        ? `https://www.instagram.com/p/POST${i}/`
        : `https://x.com/user/status/${1000 + i}`,
  }));

describe('calculateMasonryLayout', () => {
  it('distributes posts across columns initially', () => {
    const posts = makePosts(6);
    const result = calculateMasonryLayout({
      posts,
      containerWidth: 932, // 3 * 300 + 2 * 16
      columnCount: 3,
      gap: 16,
      itemHeights: new Map(),
    });

    expect(result.positions.size).toBe(6);
    expect(result.positions.get('post-0')?.column).toBe(0);
    expect(result.positions.get('post-1')?.column).toBe(1);
    expect(result.positions.get('post-2')?.column).toBe(2);
    expect(result.columnWidth).toBe(300);
  });

  it('keeps pinned columns stable when embed heights change during loading', () => {
    const posts = makePosts(6);
    const initial = calculateMasonryLayout({
      posts,
      containerWidth: 932,
      columnCount: 3,
      gap: 16,
      itemHeights: new Map(),
    });

    // Simulate drastic height changes as embeds finish loading out of order
    const updatedHeights = new Map<string, number>([
      ['post-0', 900], // much taller
      ['post-1', 180], // much shorter
      ['post-2', 220], // much shorter
    ]);

    const afterLoad = calculateMasonryLayout({
      posts,
      containerWidth: 932,
      columnCount: 3,
      gap: 16,
      itemHeights: updatedHeights,
      pinnedColumns: initial.columnAssignments,
    });

    // Every post must stay in its originally pinned column (zero horizontal jumping)
    for (const post of posts) {
      const id = post.id!;
      expect(afterLoad.positions.get(id)?.column).toBe(initial.positions.get(id)?.column);
      expect(afterLoad.positions.get(id)?.x).toBe(initial.positions.get(id)?.x);
    }

    // Post in column 0 below post-0 should shift down to 900 + 16 = 916
    const col0Second = posts.find(
      (p) => p.id !== 'post-0' && initial.positions.get(p.id!)?.column === 0
    );
    expect(col0Second).toBeDefined();
    expect(afterLoad.positions.get(col0Second!.id!)?.y).toBe(916);
  });

  it('places newly appended posts into shortest columns without moving existing posts', () => {
    const initialPosts = makePosts(3);
    const heights = new Map<string, number>([
      ['post-0', 700],
      ['post-1', 200],
      ['post-2', 500],
    ]);

    const initial = calculateMasonryLayout({
      posts: initialPosts,
      containerWidth: 932,
      columnCount: 3,
      gap: 16,
      itemHeights: heights,
    });

    const expandedPosts: SocialPost[] = [
      ...initialPosts,
      { id: 'post-new', platform: 'twitter', url: 'https://x.com/user/status/9999' },
    ];

    const expanded = calculateMasonryLayout({
      posts: expandedPosts,
      containerWidth: 932,
      columnCount: 3,
      gap: 16,
      itemHeights: heights,
      pinnedColumns: initial.columnAssignments,
    });

    // Existing posts stay in place
    for (const post of initialPosts) {
      expect(expanded.positions.get(post.id!)?.column).toBe(
        initial.positions.get(post.id!)?.column
      );
    }
    // New post goes to column 1 (the shortest column at 200px)
    expect(expanded.positions.get('post-new')?.column).toBe(1);
    expect(expanded.positions.get('post-new')?.y).toBe(216);
  });

  it('clamps embed widths to platform maximums and centers the grid', () => {
    const posts: SocialPost[] = [
      { id: 'tw', platform: 'twitter', url: 'https://x.com/u/status/1' },
      { id: 'ig', platform: 'instagram', url: 'https://instagram.com/p/ABC' },
    ];

    const result = calculateMasonryLayout({
      posts,
      containerWidth: 2000,
      columnCount: 2,
      gap: 20,
      itemHeights: new Map(),
      constrainEmbedWidth: true,
    });

    expect(result.positions.get('tw')?.width).toBe(MAX_TWITTER_WIDTH);
    expect(result.positions.get('ig')?.width).toBe(MAX_INSTAGRAM_WIDTH);
    // Centered: totalGridWidth = 550 * 2 + 20 = 1120 -> offsetX = (2000 - 1120) / 2 = 440
    expect(result.positions.get('tw')?.x).toBe(440);
  });

  it('respects custom padding and default platform heights', () => {
    const posts: SocialPost[] = [
      { id: 'tw', platform: 'twitter', url: 'https://x.com/u/status/1' },
      { id: 'ig', platform: 'instagram', url: 'https://instagram.com/p/ABC' },
    ];

    const result = calculateMasonryLayout({
      posts,
      containerWidth: 640,
      columnCount: 2,
      gap: 20,
      padding: 10,
      itemHeights: new Map(),
      twitterHeight: 350,
      instagramHeight: 450,
    });

    // availableWidth = 640 - 20 = 620; columnWidth = (620 - 20) / 2 = 300
    expect(result.columnWidth).toBe(300);
    expect(result.positions.get('tw')?.x).toBe(10);
    expect(result.positions.get('tw')?.height).toBe(350);
    expect(result.positions.get('ig')?.height).toBe(450);
    expect(result.containerHeight).toBe(450);
  });
});

describe('LayoutEngine', () => {
  it('preserves column assignments on height updates and rebalances on columnCount change', () => {
    const posts = makePosts(6);
    const itemHeights = new Map<string, number>();

    const engine = createLayoutEngine({
      containerWidth: 1000,
      columns: [
        { columns: 3, minWidth: 900 },
        { columns: 2, minWidth: 600 },
        { columns: 1, minWidth: 0 },
      ],
      gap: 16,
      itemHeights,
    });

    const first = engine.calculate(posts);
    const initialCols = new Map(
      posts.map((p) => [p.id!, first.positions.get(p.id!)!.column])
    );

    // Height changes at same width/columnCount must not hop columns
    engine.updateItemHeight('post-0', 950);
    engine.updateItemHeight('post-1', 150);
    const second = engine.calculate(posts);
    for (const p of posts) {
      expect(second.positions.get(p.id!)?.column).toBe(initialCols.get(p.id!));
    }

    // Changing width to trigger columnCount change (3 -> 2) rebalances cleanly
    engine.setContainerWidth(700);
    const third = engine.calculate(posts);
    expect(engine.getColumnCount()).toBe(2);
    for (const p of posts) {
      const col = third.positions.get(p.id!)!.column;
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(2);
    }
  });
});

<div align="center">
  <h1>Social Masonry</h1>
  <p><strong>Zero-jank masonry wall for X (Twitter) &amp; Instagram embeds — React &amp; Next.js ready</strong></p>
  <p>Just pass URLs. No API keys, no horizontal layout jumping while embeds load.</p>

  [![npm version](https://img.shields.io/npm/v/social-masonry.svg)](https://www.npmjs.com/package/social-masonry)
  [![bundle size](https://img.shields.io/bundlephobia/minzip/social-masonry)](https://bundlephobia.com/package/social-masonry)
  [![license](https://img.shields.io/npm/l/social-masonry.svg)](https://github.com/tkana-dev/social-masonry/blob/main/LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

  <h3><a href="https://social-masonry.tkana.dev/">Try the Interactive Playground →</a></h3>

  <br />

  <a href="https://social-masonry.tkana.dev/">
    <img src="https://raw.githubusercontent.com/tkana-dev/social-masonry/main/assets/demo.gif" alt="Social Masonry live demo showing responsive column transitions and theme switching" width="100%" />
  </a>
</div>

---

## Why Social Masonry?

Building a **Wall of Love**, testimonial showcase, or UGC gallery with official X and Instagram embeds is surprisingly painful:

- Embed iframes load asynchronously at unpredictable heights, causing cards in standard masonry grids to **jump horizontally between columns**.
- Loading many widgets at once slows down the page and injects duplicate scripts.
- Deleted posts or ad-blockers leave awkward blank holes.

**Social Masonry solves all of this out of the box:**

- **Zero Horizontal Jumping** — Stable column pinning keeps cards in their assigned column while embeds load; only vertical offsets adjust smoothly.
- **Just Pass URLs** — Pass plain X and Instagram URL strings and platforms are auto-detected (or pass objects for custom IDs and `estimatedHeight` hints).
- **Shimmer Skeletons & Fade-in** — Height-matched shimmer placeholders stay visible until iframes are actually rendered, then crossfade cleanly.
- **Next.js App Router Ready** — Ships with built-in `'use client'` directive and SSR-safe hooks.
- **Graceful Error Fallbacks** — Unavailable or blocked embeds degrade into a clean clickable link card instead of an empty void.
- **Lazy Loading** — Optional Intersection Observer deferral for fast initial page loads.
- **Smooth GPU Transitions** — Interruptible `translate3d` animations on resize/column changes, respecting `prefers-reduced-motion`.
- **Zero API Keys** — Uses official `widgets.js` and `embed.js` scripts loaded once on-demand.

## Installation

```bash
npm install social-masonry
# or
pnpm add social-masonry
# or
yarn add social-masonry
```

## Quick Start

### React & Next.js (App Router)

Just pass an array of X (Twitter) and Instagram URLs:

```tsx
import { SocialMasonry } from 'social-masonry/react';

const posts = [
  'https://x.com/username/status/1234567890',
  'https://www.instagram.com/p/ABC123xyz/',
  'https://www.instagram.com/reel/XYZ789abc/',
];

export function SocialWall() {
  return (
    <SocialMasonry
      posts={posts}
      columns={[
        { columns: 4, minWidth: 1280 },
        { columns: 3, minWidth: 900 },
        { columns: 2, minWidth: 640 },
        { columns: 1, minWidth: 0 },
      ]}
      gap={16}
      theme="dark"
      lazyLoad
    />
  );
}
```

You can also pass objects when you want custom IDs, explicit platforms, or `estimatedHeight` hints:

```tsx
<SocialMasonry
  posts={[
    {
      id: 'hero-tweet',
      url: 'https://x.com/username/status/1234567890',
      estimatedHeight: 380,
    },
    {
      platform: 'instagram',
      url: 'https://www.instagram.com/p/ABC123xyz/',
    },
  ]}
/>
```

## API

### `SocialMasonry` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `posts` | `SocialPostInput[]` | `[]` | Array of post URLs (`string`) or `SocialPost` objects |
| `columns` | `number \| ColumnConfig[]` | Responsive (`4/3/2/1`) | Number of columns or responsive breakpoint config |
| `gap` | `number` | `16` | Gap between cards in pixels |
| `padding` | `number` | `0` | Horizontal container padding in pixels |
| `theme` | `'light' \| 'dark'` | `'light'` | Theme for X (Twitter) embeds and skeletons |
| `twitterHeight` | `number` | `500` | Initial/skeleton height for X embeds (px) |
| `instagramHeight` | `number` | `600` | Initial/skeleton height for Instagram embeds (px) |
| `twitterHideCard` | `boolean` | `false` | Hide link preview cards on X embeds |
| `twitterHideThread` | `boolean` | `true` | Hide parent conversation thread on X embeds |
| `animate` | `boolean` | `true` | Enable/disable layout transitions |
| `animationDuration` | `number` | `300` | Transition duration in milliseconds |
| `animationEasing` | `string` | `'ease-out'` | CSS easing function |
| `staggerDelay` | `number` | `0` | Delay between cards on column/width relayouts (ms) |
| `lazyLoad` | `boolean` | `false` | Defer embed creation until scrolled into view |
| `lazyLoadRootMargin` | `string` | `'200px 0px'` | Root margin for Intersection Observer |
| `className` | `string` | - | Custom class for container |
| `style` | `CSSProperties` | - | Custom inline styles for container |
| `onLayoutComplete` | `(positions: ItemPosition[]) => void` | - | Called after layout positions recalculate |
| `onEmbedLoad` | `(post: SocialPost) => void` | - | Called when an embed finishes rendering |
| `onEmbedError` | `(post: SocialPost, error: Error) => void` | - | Called when an embed fails or times out |

### Types

```typescript
export type SocialPlatform = 'twitter' | 'instagram';

export interface SocialPost {
  id?: string;              // Optional unique identifier (auto-generated from URL)
  platform?: SocialPlatform; // Auto-detected from URL when omitted
  url: string;              // Post URL
  estimatedHeight?: number; // Optional initial height hint in px
}

export type SocialPostInput = SocialPost | string;

export interface ColumnConfig {
  columns: number;   // Number of columns
  minWidth: number;  // Minimum container width in px
}
```

### Ref Methods

```tsx
import { useRef } from 'react';
import { SocialMasonry, type SocialMasonryRef } from 'social-masonry/react';

function App() {
  const masonryRef = useRef<SocialMasonryRef>(null);

  const handleLoadMore = () => {
    masonryRef.current?.addPosts([
      'https://x.com/username/status/9876543210',
    ]);
  };

  return <SocialMasonry ref={masonryRef} posts={posts} />;
}
```

| Method | Description |
|--------|-------------|
| `addPosts(posts)` | Append posts to the shortest columns without moving existing cards |
| `setPosts(posts)` | Replace all posts and rebalance columns |
| `removePost(id)` | Remove a post by ID |
| `refresh()` | Re-process Instagram embeds |

## Supported URL Formats

- **X (Twitter)**: `x.com/<user>/status/<id>`, `twitter.com/<user>/status/<id>`, `mobile.twitter.com/...`, `x.com/i/web/status/<id>`
- **Instagram**: `instagram.com/p/<id>/`, `instagram.com/reel/<id>/`, `instagram.com/reels/<id>/`, `instagram.com/tv/<id>/`, `instagr.am/p/<id>/`

## Utilities

```typescript
import {
  extractTweetId,
  extractInstagramId,
  detectPlatform,
  normalizePost,
  normalizePosts,
  calculateMasonryLayout,
} from 'social-masonry';

extractTweetId('https://x.com/user/status/123456'); // '123456'
extractInstagramId('https://instagram.com/reel/ABC123/'); // 'ABC123'
detectPlatform('https://x.com/user/status/123'); // 'twitter'
normalizePost('https://x.com/user/status/123'); // { platform: 'twitter', url: '...' }
```

## How It Works

1. **Deduplicated Script Loading**: Twitter's `widgets.js` and Instagram's `embed.js` are each loaded at most once on-demand via cached Promises, with batched `instgrm.Embeds.process()` calls.
2. **Height-Matched Shimmer Skeletons**: Each card locks to its initial/estimated height with a shimmer placeholder until the embed iframe finishes rendering, then crossfades in.
3. **Stable Column Pinning**: Posts are distributed to the shortest columns on initial layout or when column count changes, then pinned to their column so asynchronous height changes never cause cards to jump horizontally.
4. **rAF-Batched Height Tracking**: `ResizeObserver` updates are coalesced per animation frame (ignoring `< 2px` jitter) and animated via GPU-accelerated `translate3d` transitions.
5. **Accessibility**: Animations and shimmer effects automatically disable when `prefers-reduced-motion: reduce` is enabled.

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 14+ |
| Edge | 80+ |

## License

MIT

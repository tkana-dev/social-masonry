<div align="center">
  <h1>Social Masonry</h1>
  <p><strong>Masonry layout for X (Twitter) and Instagram embeds using official widgets</strong></p>

  [![npm version](https://img.shields.io/npm/v/social-masonry.svg)](https://www.npmjs.com/package/social-masonry)
  [![bundle size](https://img.shields.io/bundlephobia/minzip/social-masonry)](https://bundlephobia.com/package/social-masonry)
  [![license](https://img.shields.io/npm/l/social-masonry.svg)](https://github.com/tkana-dev/social-masonry/blob/main/LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
</div>

---

## Features

- **Official Widgets** - Uses Twitter's `widgets.js` and Instagram's `embed.js` for native embeds
- **Auto-sizing** - Embeds automatically adjust to their content height
- **Responsive** - Adaptive column layouts that look great on any screen size
- **Themeable** - Light and dark theme support for Twitter embeds
- **TypeScript** - Full type safety
- **React Ready** - First-class React component with ref support
- **Lightweight** - Minimal bundle size, widgets loaded on-demand

## Installation

```bash
npm install social-masonry
```

## Quick Start

### React

```tsx
import { SocialMasonry } from 'social-masonry/react';

function App() {
  const posts = [
    {
      id: '1',
      platform: 'twitter',
      url: 'https://twitter.com/username/status/1234567890',
    },
    {
      id: '2',
      platform: 'instagram',
      url: 'https://www.instagram.com/p/ABC123xyz/',
    },
  ];

  return (
    <SocialMasonry
      posts={posts}
      columns={[
        { columns: 4, minWidth: 1536 },
        { columns: 3, minWidth: 1024 },
        { columns: 2, minWidth: 640 },
        { columns: 1, minWidth: 0 },
      ]}
      gap={16}
      theme="light"
    />
  );
}
```

## API

### SocialMasonry Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `posts` | `SocialPost[]` | `[]` | Array of posts to display |
| `columns` | `number \| ColumnConfig[]` | `3` | Number of columns or responsive config |
| `gap` | `number` | `16` | Gap between items in pixels |
| `theme` | `'light' \| 'dark'` | `'light'` | Theme for Twitter embeds |
| `className` | `string` | - | Custom class for container |
| `style` | `CSSProperties` | - | Custom styles for container |
| `onEmbedLoad` | `(post: SocialPost) => void` | - | Called when an embed loads |
| `onEmbedError` | `(post: SocialPost, error: Error) => void` | - | Called on embed error |

### SocialPost Type

```typescript
interface SocialPost {
  id?: string;                         // Optional unique identifier
  platform: 'twitter' | 'instagram';   // Social platform
  url: string;                         // Post URL
}
```

### ColumnConfig Type

```typescript
interface ColumnConfig {
  columns: number;   // Number of columns
  minWidth: number;  // Minimum container width for this config
}
```

### Ref Methods

```tsx
import { useRef } from 'react';
import { SocialMasonry, SocialMasonryRef } from 'social-masonry/react';

function App() {
  const masonryRef = useRef<SocialMasonryRef>(null);

  const handleAddPost = () => {
    masonryRef.current?.addPosts([newPost]);
  };

  return (
    <SocialMasonry
      ref={masonryRef}
      posts={posts}
    />
  );
}
```

Available ref methods:

| Method | Description |
|--------|-------------|
| `addPosts(posts)` | Add posts to the end |
| `setPosts(posts)` | Replace all posts |
| `removePost(id)` | Remove a post by ID |
| `refresh()` | Re-process embeds |

## Supported URL Formats

### Twitter/X

- `https://twitter.com/username/status/1234567890`
- `https://x.com/username/status/1234567890`

### Instagram

- `https://www.instagram.com/p/ABC123xyz/`
- `https://www.instagram.com/reel/ABC123xyz/`

## Utilities

The library exports utility functions for URL parsing:

```typescript
import {
  extractTweetId,
  extractInstagramId,
  detectPlatform,
} from 'social-masonry';

// Extract tweet ID from URL
extractTweetId('https://x.com/user/status/123456'); // '123456'

// Extract Instagram post ID
extractInstagramId('https://instagram.com/p/ABC123'); // 'ABC123'

// Detect platform from URL
detectPlatform('https://x.com/user/status/123'); // 'twitter'
detectPlatform('https://instagram.com/p/ABC'); // 'instagram'
```

## How It Works

1. **Script Loading**: Twitter's `widgets.js` and Instagram's `embed.js` are loaded on-demand when needed
2. **Widget Creation**: Official APIs (`twttr.widgets.createTweet` and `instgrm.Embeds.process`) create native embeds
3. **Masonry Layout**: Posts are distributed across columns using a simple round-robin algorithm
4. **Auto-sizing**: Each embed automatically sizes to its content - no fixed heights

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 14+ |
| Edge | 80+ |

## License

MIT

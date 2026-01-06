<div align="center">
  <img src="https://raw.githubusercontent.com/tkana731/social-masonry/main/assets/logo.svg" alt="Social Masonry" width="120" />
  <h1>Social Masonry</h1>
  <p><strong>Beautiful masonry layout for X (Twitter) and Instagram embeds</strong></p>
  
  [![npm version](https://img.shields.io/npm/v/social-masonry.svg)](https://www.npmjs.com/package/social-masonry)
  [![bundle size](https://img.shields.io/bundlephobia/minzip/social-masonry)](https://bundlephobia.com/package/social-masonry)
  [![license](https://img.shields.io/npm/l/social-masonry.svg)](https://github.com/tkana731/social-masonry/blob/main/LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
  
  <a href="https://social-masonry.dev">Demo</a> · <a href="#installation">Installation</a> · <a href="#usage">Usage</a> · <a href="#api">API</a>
</div>

---

<p align="center">
  <img src="https://raw.githubusercontent.com/tkana731/social-masonry/main/assets/demo.gif" alt="Demo" width="100%" />
</p>

## ✨ Features

- 🎨 **Beautiful Cards** - Native-looking X and Instagram post cards with 5 design variants
- ⚡ **High Performance** - Virtual scrolling for smooth rendering of thousands of posts
- 📱 **Responsive** - Adaptive column layouts that look great on any screen size
- 🎭 **Themeable** - Light, dark, and auto themes with full customization
- 🔄 **Infinite Scroll** - Built-in load more functionality
- 🎯 **TypeScript** - Full type safety and excellent DX
- ⚛️ **React Ready** - First-class React component with hooks
- 🪶 **Lightweight** - ~8KB gzipped with zero dependencies

## 📦 Installation

```bash
# npm
npm install social-masonry

# yarn
yarn add social-masonry

# pnpm
pnpm add social-masonry
```

## 🚀 Quick Start

### Vanilla JavaScript

```javascript
import { createSocialMasonry } from 'social-masonry';
import 'social-masonry/styles';

const masonry = createSocialMasonry({
  container: '#posts',
  posts: [
    {
      platform: 'twitter',
      id: '1',
      url: 'https://twitter.com/user/status/123',
      author: {
        username: 'johndoe',
        displayName: 'John Doe',
        avatarUrl: 'https://...',
        verified: true,
      },
      content: {
        text: 'Hello, world! 🌍',
      },
      metrics: {
        likes: 1234,
        retweets: 567,
        replies: 89,
      },
      createdAt: '2024-01-15T10:30:00Z',
    },
    // ... more posts
  ],
});

// Add more posts
masonry.addPosts(newPosts);

// Clean up
masonry.destroy();
```

### React

```tsx
import { SocialMasonry } from 'social-masonry/react';
import 'social-masonry/styles';

function App() {
  const posts = usePosts();
  
  return (
    <SocialMasonry
      posts={posts}
      columns={[
        { columns: 4, minWidth: 1200 },
        { columns: 3, minWidth: 900 },
        { columns: 2, minWidth: 600 },
        { columns: 1, minWidth: 0 },
      ]}
      gap={16}
      variant="elevated"
      theme="auto"
      onPostClick={(post) => window.open(post.url)}
    />
  );
}
```

## 📖 Usage

### Post Types

#### Twitter/X Post

```typescript
const twitterPost: TwitterPost = {
  platform: 'twitter',
  id: 'unique-id',
  url: 'https://twitter.com/user/status/123',
  author: {
    username: 'johndoe',
    displayName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
    verified: true,
  },
  content: {
    text: 'This is my tweet! #awesome',
    html: 'This is my tweet! <a href="#">#awesome</a>', // Optional: pre-rendered HTML
  },
  media: [
    {
      type: 'image',
      url: 'https://example.com/image.jpg',
      aspectRatio: 16 / 9,
    },
  ],
  metrics: {
    likes: 1234,
    retweets: 567,
    replies: 89,
    views: 50000,
  },
  quotedPost: { /* nested TwitterPost */ }, // Optional
  createdAt: '2024-01-15T10:30:00Z',
};
```

#### Instagram Post

```typescript
const instagramPost: InstagramPost = {
  platform: 'instagram',
  id: 'unique-id',
  url: 'https://instagram.com/p/ABC123',
  author: {
    username: 'janedoe',
    displayName: 'Jane Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
    verified: false,
  },
  content: {
    caption: 'Beautiful sunset 🌅 #photography',
  },
  media: {
    type: 'image', // 'image' | 'video' | 'carousel'
    url: 'https://example.com/image.jpg',
    aspectRatio: 1, // Square
    carouselItems: [ /* for carousel type */ ],
  },
  metrics: {
    likes: 5678,
    comments: 123,
  },
  createdAt: '2024-01-15T10:30:00Z',
};
```

### Configuration Options

```typescript
const masonry = createSocialMasonry({
  // Required
  container: '#posts', // Element or selector
  posts: [], // Array of SocialPost
  
  // Layout
  gap: 16, // Gap between cards (px)
  columns: [ // Responsive breakpoints
    { columns: 4, minWidth: 1200 },
    { columns: 3, minWidth: 900 },
    { columns: 2, minWidth: 600 },
    { columns: 1, minWidth: 0 },
  ],
  padding: 0, // Container padding
  
  // Animation
  animate: true,
  animationDuration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Card Styling
  variant: 'default', // 'default' | 'minimal' | 'elevated' | 'bordered' | 'glass'
  theme: 'auto', // 'light' | 'dark' | 'auto'
  borderRadius: 12,
  hoverEffect: true,
  
  // Content
  showPlatformIcon: true,
  showAuthor: true,
  showMetrics: true,
  showTimestamp: true,
  
  // Custom Formatters
  formatDate: (date) => formatRelativeTime(date),
  formatNumber: (num) => formatNumber(num),
  
  // Image Loading
  imageLoading: 'lazy', // 'lazy' | 'eager'
  fallbackImage: 'https://...', // Fallback for broken images
  
  // Virtualization (for large lists)
  virtualization: {
    enabled: false,
    overscan: 3,
    estimatedItemHeight: 400,
    scrollContainer: null, // Default: window
  },
  
  // Infinite Scroll
  loadMoreThreshold: 500,
  showLoading: true,
  loadingElement: '<div>Loading...</div>',
  emptyMessage: 'No posts to display',
  
  // Events
  onPostClick: (post, event) => {},
  onAuthorClick: (post, event) => {},
  onMediaClick: (post, mediaIndex, event) => {},
  onLayoutComplete: (positions) => {},
  onLoadMore: async () => {},
  onImageError: (post, error) => {},
});
```

### Card Variants

| Variant | Description |
|---------|-------------|
| `default` | Clean card with subtle border and shadow |
| `minimal` | No background, perfect for embedding |
| `elevated` | Floating card with prominent shadow |
| `bordered` | Strong border, no shadow |
| `glass` | Glassmorphism effect with blur |

### API Methods

```typescript
// Add posts to the end
masonry.addPosts(newPosts);

// Replace all posts
masonry.setPosts(posts);

// Remove a post
masonry.removePost(postId);

// Update options
masonry.setOptions({ theme: 'dark' });

// Get current state
const state = masonry.getLayoutState();
const posts = masonry.getPosts();

// Scroll to a post
masonry.scrollToPost(postId, 'smooth');

// Recalculate layout
masonry.refresh();

// Clean up
masonry.destroy();
```

### React Hooks

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
      // ...
    />
  );
}
```

## 🎨 Customization

### CSS Variables

Override the default theme using CSS variables:

```css
:root {
  /* Colors */
  --sm-bg: #ffffff;
  --sm-bg-hover: #f7f9fa;
  --sm-text: #0f1419;
  --sm-text-secondary: #536471;
  --sm-text-muted: #8b98a5;
  --sm-border: #eff3f4;
  --sm-link: #1d9bf0;
  
  /* Brand Colors */
  --sm-twitter-primary: #1d9bf0;
  --sm-instagram-primary: #e1306c;
  
  /* Shadows */
  --sm-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --sm-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --sm-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  
  /* Transitions */
  --sm-transition-fast: 150ms ease;
  --sm-transition-base: 200ms ease;
}
```

### Custom Classes

Add custom classes to cards:

```typescript
createSocialMasonry({
  className: 'my-custom-card',
  // ...
});
```

## 📊 Performance

Social Masonry is optimized for performance:

- **Virtual Scrolling**: Only renders visible cards, enabling smooth scrolling with 10,000+ posts
- **Efficient Layout**: Uses a columnar algorithm with O(n) complexity
- **Smart Updates**: Batched DOM updates and position caching
- **Lazy Loading**: Images load only when cards enter the viewport

Enable virtualization for large datasets:

```typescript
createSocialMasonry({
  virtualization: {
    enabled: true,
    overscan: 3, // Extra items to render above/below viewport
    estimatedItemHeight: 400,
  },
  // ...
});
```

## 🌐 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 14+ |
| Edge | 80+ |

## 📄 License

MIT © [tkana_dev](https://github.com/tkana731)

---

<div align="center">
  <p>If you find this project useful, please consider giving it a ⭐️</p>
  <a href="https://github.com/tkana731/social-masonry">GitHub</a> · <a href="https://www.npmjs.com/package/social-masonry">npm</a> · <a href="https://social-masonry.dev">Demo</a>
</div>

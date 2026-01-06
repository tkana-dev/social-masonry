/**
 * Social Masonry
 * Beautiful masonry layout for X (Twitter) and Instagram embeds
 * 
 * @packageDocumentation
 */

// Core
export { SocialMasonry, createSocialMasonry, default } from './core';

// Engines
export { LayoutEngine, createLayoutEngine } from './layout-engine';
export { VirtualizationEngine, createVirtualizationEngine } from './virtualization-engine';
export { CardRenderer, createCardRenderer } from './card-renderer';

// Types
export type {
  // Posts
  SocialPost,
  TwitterPost,
  InstagramPost,
  SocialPlatform,
  // Config
  SocialMasonryOptions,
  MasonryConfig,
  VirtualizationConfig,
  CardConfig,
  CardVariant,
  CardTheme,
  ColumnConfig,
  // Events
  MasonryEvents,
  // Internal
  ItemPosition,
  LayoutState,
  VirtualItem,
  // React
  SocialMasonryProps,
} from './types';

// Utilities
export {
  formatNumber,
  formatRelativeTime,
  isTwitterPost,
  isInstagramPost,
  defaultColumnConfig,
} from './utils';

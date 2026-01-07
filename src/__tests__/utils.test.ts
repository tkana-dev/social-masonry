import { describe, it, expect } from 'vitest';
import { isTwitterPost, isInstagramPost, formatNumber, getColumnCount } from '../utils';
import type { TwitterPost, InstagramPost, ColumnConfig } from '../types';

describe('isTwitterPost', () => {
  it('should return true for Twitter posts', () => {
    const post: TwitterPost = {
      id: '1',
      platform: 'twitter',
      url: 'https://twitter.com/test/status/1',
      author: { username: 'test', displayName: 'Test' },
      content: { text: 'Hello' },
      createdAt: new Date().toISOString(),
    };
    expect(isTwitterPost(post)).toBe(true);
  });

  it('should return false for Instagram posts', () => {
    const post: InstagramPost = {
      id: '1',
      platform: 'instagram',
      url: 'https://instagram.com/p/test1',
      author: { username: 'test' },
      content: {},
      media: { type: 'image', url: 'https://example.com/image.jpg' },
      createdAt: new Date().toISOString(),
    };
    expect(isTwitterPost(post)).toBe(false);
  });
});

describe('isInstagramPost', () => {
  it('should return true for Instagram posts', () => {
    const post: InstagramPost = {
      id: '1',
      platform: 'instagram',
      url: 'https://instagram.com/p/test1',
      author: { username: 'test' },
      content: {},
      media: { type: 'image', url: 'https://example.com/image.jpg' },
      createdAt: new Date().toISOString(),
    };
    expect(isInstagramPost(post)).toBe(true);
  });

  it('should return false for Twitter posts', () => {
    const post: TwitterPost = {
      id: '1',
      platform: 'twitter',
      url: 'https://twitter.com/test/status/1',
      author: { username: 'test', displayName: 'Test' },
      content: { text: 'Hello' },
      createdAt: new Date().toISOString(),
    };
    expect(isInstagramPost(post)).toBe(false);
  });
});

describe('formatNumber', () => {
  it('should format numbers less than 1000 as-is', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(500)).toBe('500');
  });

  it('should format thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(10000)).toBe('10K');
    expect(formatNumber(999999)).toBe('1000K');
  });

  it('should format millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1M');
    expect(formatNumber(1500000)).toBe('1.5M');
    expect(formatNumber(10000000)).toBe('10M');
  });
});

describe('getColumnCount', () => {
  const config: ColumnConfig[] = [
    { minWidth: 0, columns: 1 },
    { minWidth: 640, columns: 2 },
    { minWidth: 1024, columns: 3 },
  ];

  it('should return correct column count for width', () => {
    expect(getColumnCount(config, 320)).toBe(1);
    expect(getColumnCount(config, 640)).toBe(2);
    expect(getColumnCount(config, 800)).toBe(2);
    expect(getColumnCount(config, 1024)).toBe(3);
    expect(getColumnCount(config, 1920)).toBe(3);
  });

  it('should return number directly if columns is a number', () => {
    expect(getColumnCount(4, 320)).toBe(4);
    expect(getColumnCount(2, 1920)).toBe(2);
  });
});

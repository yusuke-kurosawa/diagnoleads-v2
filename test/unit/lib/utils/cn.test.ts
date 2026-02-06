/**
 * cn utility function tests
 */

import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils/cn';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active');
    expect(cn('base', false && 'active')).toBe('base');
  });

  it('should deduplicate tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('should handle arrays', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
  });

  it('should handle objects', () => {
    expect(cn({ 'bg-red-500': true, 'text-white': true })).toBe('bg-red-500 text-white');
    expect(cn({ 'bg-red-500': false, 'text-white': true })).toBe('text-white');
  });

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'active')).toBe('base active');
  });

  it('should handle empty strings', () => {
    expect(cn('', 'active')).toBe('active');
  });

  it('should handle no arguments', () => {
    expect(cn()).toBe('');
  });

  it('should merge conflicting tailwind classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('m-2', 'm-auto')).toBe('m-auto');
  });

  it('should preserve non-conflicting classes', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('should handle complex conditionals', () => {
    const isActive = true;
    const isDisabled = false;
    
    expect(cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled',
      { 'hover:bg-blue-500': isActive }
    )).toBe('base active hover:bg-blue-500');
  });

  it('should handle nested arrays', () => {
    expect(cn(['a', ['b', 'c']])).toBe('a b c');
  });

  it('should handle responsive classes', () => {
    expect(cn('text-sm', 'md:text-base', 'lg:text-lg')).toBe('text-sm md:text-base lg:text-lg');
  });

  it('should handle state variants', () => {
    expect(cn('hover:bg-blue-500', 'focus:bg-blue-600', 'active:bg-blue-700'))
      .toBe('hover:bg-blue-500 focus:bg-blue-600 active:bg-blue-700');
  });
});

'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  className?: string;
  locale?: string;
}

/**
 * Animated counter component with smooth counting animation
 * Uses requestAnimationFrame for smooth 60fps animation
 */
export function AnimatedCounter({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className,
  locale = 'en-US',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;

    // Easing function for smooth animation
    const easeOutQuart = (t: number): number => {
      return 1 - Math.pow(1 - t, 4);
    };

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
        startTimeRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = displayValue.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
}

/**
 * Animated percentage counter
 */
export function AnimatedPercentage({
  value,
  duration = 1500,
  decimals = 1,
  className,
}: AnimatedPercentageProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      decimals={decimals}
      suffix="%"
      className={className}
    />
  );
}

interface AnimatedScoreProps {
  value: number;
  maxValue?: number;
  duration?: number;
  className?: string;
}

/**
 * Animated score counter with max value display
 */
export function AnimatedScore({
  value,
  maxValue = 100,
  duration = 1500,
  className,
}: AnimatedScoreProps) {
  return (
    <span className={cn('inline-flex items-baseline gap-0.5', className)}>
      <AnimatedCounter value={value} duration={duration} decimals={0} />
      <span className="text-lg font-normal text-gray-500 dark:text-gray-400">/{maxValue}</span>
    </span>
  );
}

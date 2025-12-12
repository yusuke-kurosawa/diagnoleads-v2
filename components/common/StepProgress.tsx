'use client';

import { RiCheckLine } from '@remixicon/react';
import React from 'react';

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepProgress({ steps, currentStep, className = '' }: StepProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* ステップ */}
              <div className="flex flex-col items-center relative">
                {/* ステップ番号/チェック */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300 ease-out
                    ${isCompleted ? 'bg-brand-500 text-white scale-100' : ''}
                    ${isCurrent ? 'bg-brand-500 text-white ring-4 ring-brand-100 dark:ring-brand-500/20 scale-110' : ''}
                    ${isUpcoming ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? (
                    <RiCheckLine className="w-5 h-5 animate-[scaleIn_0.2s_ease-out]" />
                  ) : (
                    step.id
                  )}
                </div>

                {/* ステップタイトル */}
                <div className="mt-3 text-center">
                  <p
                    className={`text-sm font-medium transition-colors
                      ${isCompleted || isCurrent ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}
                    `}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[120px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* コネクターライン */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 mt-[-24px]">
                  <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-brand-500 rounded-full transition-all duration-500 ease-out
                        ${isCompleted ? 'w-full' : 'w-0'}
                      `}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  variant = 'default',
  animated = true,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantClasses = {
    default: 'bg-brand-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full transition-all duration-500 ease-out
            ${animated ? 'animate-[progressPulse_2s_ease-in-out_infinite]' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  label?: string;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  variant = 'default',
  showValue = true,
  label,
  className = '',
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: '#14b8a6',
    success: '#12b76a',
    warning: '#f79009',
    error: '#f04438',
  };

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* 背景の円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-700"
        />
        {/* プログレスの円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      {label && <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">{label}</span>}
    </div>
  );
}

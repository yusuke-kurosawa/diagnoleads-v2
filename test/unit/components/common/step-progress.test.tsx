/**
 * StepProgress, ProgressBar, CircularProgress Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepProgress, ProgressBar, CircularProgress } from '@/components/common/StepProgress';

describe('StepProgress', () => {
  const steps = [
    { id: 1, title: 'Step 1', description: 'First step' },
    { id: 2, title: 'Step 2', description: 'Second step' },
    { id: 3, title: 'Step 3', description: 'Third step' },
  ];

  it('should render all steps', () => {
    render(<StepProgress steps={steps} currentStep={1} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('should render step descriptions', () => {
    render(<StepProgress steps={steps} currentStep={1} />);
    expect(screen.getByText('First step')).toBeInTheDocument();
    expect(screen.getByText('Second step')).toBeInTheDocument();
  });

  it('should show current step highlighted', () => {
    render(<StepProgress steps={steps} currentStep={2} />);
    // Current step should have ring
    expect(document.querySelector('.ring-4')).toBeInTheDocument();
  });

  it('should show completed step with checkmark', () => {
    render(<StepProgress steps={steps} currentStep={2} />);
    // Completed step (step 1) should have check icon
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<StepProgress steps={steps} currentStep={1} className="custom-class" />);
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('should render progress bar', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render label', () => {
    render(<ProgressBar value={75} label="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should hide value when showValue is false', () => {
    render(<ProgressBar value={50} showValue={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('should calculate percentage correctly', () => {
    render(<ProgressBar value={25} max={100} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('should cap at 100%', () => {
    render(<ProgressBar value={150} max={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should not go below 0%', () => {
    render(<ProgressBar value={-10} max={100} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('ProgressBar sizes', () => {
  it('should render small size', () => {
    render(<ProgressBar value={50} size="sm" />);
    expect(document.querySelector('.h-1\\.5')).toBeInTheDocument();
  });

  it('should render medium size by default', () => {
    render(<ProgressBar value={50} />);
    expect(document.querySelector('.h-2\\.5')).toBeInTheDocument();
  });

  it('should render large size', () => {
    render(<ProgressBar value={50} size="lg" />);
    expect(document.querySelector('.h-4')).toBeInTheDocument();
  });
});

describe('ProgressBar variants', () => {
  it('should render default variant', () => {
    render(<ProgressBar value={50} variant="default" />);
    expect(document.querySelector('.bg-brand-500')).toBeInTheDocument();
  });

  it('should render success variant', () => {
    render(<ProgressBar value={50} variant="success" />);
    expect(document.querySelector('.bg-success-500')).toBeInTheDocument();
  });

  it('should render warning variant', () => {
    render(<ProgressBar value={50} variant="warning" />);
    expect(document.querySelector('.bg-warning-500')).toBeInTheDocument();
  });

  it('should render error variant', () => {
    render(<ProgressBar value={50} variant="error" />);
    expect(document.querySelector('.bg-error-500')).toBeInTheDocument();
  });
});

describe('ProgressBar animation', () => {
  it('should have animation by default', () => {
    render(<ProgressBar value={50} />);
    expect(document.querySelector('[class*="animate-"]')).toBeInTheDocument();
  });

  it('should disable animation when animated is false', () => {
    render(<ProgressBar value={50} animated={false} />);
    expect(document.querySelector('[class*="animate-[progressPulse"]')).not.toBeInTheDocument();
  });
});

describe('CircularProgress', () => {
  it('should render circular progress', () => {
    render(<CircularProgress value={50} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render SVG', () => {
    render(<CircularProgress value={50} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should render label', () => {
    render(<CircularProgress value={75} label="Progress" />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('should hide value when showValue is false', () => {
    render(<CircularProgress value={50} showValue={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('should calculate percentage correctly', () => {
    render(<CircularProgress value={75} max={100} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should cap at 100%', () => {
    render(<CircularProgress value={200} max={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});

describe('CircularProgress customization', () => {
  it('should support custom size', () => {
    render(<CircularProgress value={50} size={120} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
  });

  it('should apply custom className', () => {
    render(<CircularProgress value={50} className="custom-circular" />);
    expect(document.querySelector('.custom-circular')).toBeInTheDocument();
  });
});

describe('CircularProgress variants', () => {
  it('should render default variant', () => {
    render(<CircularProgress value={50} variant="default" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should render success variant', () => {
    render(<CircularProgress value={50} variant="success" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should render warning variant', () => {
    render(<CircularProgress value={50} variant="warning" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should render error variant', () => {
    render(<CircularProgress value={50} variant="error" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});

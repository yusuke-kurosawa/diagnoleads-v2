/**
 * Callout Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Callout } from '@/components/ui/callout';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

describe('Callout', () => {
  it('should render callout with title', () => {
    render(<Callout title="Important Notice" />);
    expect(screen.getByText('Important Notice')).toBeInTheDocument();
  });

  it('should render callout with children', () => {
    render(
      <Callout title="Notice">
        <p>This is the callout content</p>
      </Callout>
    );

    expect(screen.getByText('Notice')).toBeInTheDocument();
    expect(screen.getByText('This is the callout content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Callout title="Test" className="custom-callout" />);
    expect(document.querySelector('.custom-callout')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(<Callout title="Info" icon={Info} />);
    expect(screen.getByText('Info')).toBeInTheDocument();
    // Icon should be rendered
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should have rounded corners', () => {
    render(<Callout title="Test" />);
    expect(document.querySelector('.rounded-lg')).toBeInTheDocument();
  });

  it('should have border', () => {
    render(<Callout title="Test" />);
    expect(document.querySelector('.border')).toBeInTheDocument();
  });

  it('should have padding', () => {
    render(<Callout title="Test" />);
    expect(document.querySelector('.p-4')).toBeInTheDocument();
  });
});

describe('Callout colors', () => {
  it('should apply blue color by default', () => {
    render(<Callout title="Blue Callout" />);
    expect(document.querySelector('.bg-blue-50')).toBeInTheDocument();
    expect(document.querySelector('.border-blue-200')).toBeInTheDocument();
  });

  it('should apply yellow color', () => {
    render(<Callout title="Warning" color="yellow" />);
    expect(document.querySelector('.bg-yellow-50')).toBeInTheDocument();
    expect(document.querySelector('.border-yellow-200')).toBeInTheDocument();
  });

  it('should apply red color', () => {
    render(<Callout title="Error" color="red" />);
    expect(document.querySelector('.bg-red-50')).toBeInTheDocument();
    expect(document.querySelector('.border-red-200')).toBeInTheDocument();
  });

  it('should apply green color', () => {
    render(<Callout title="Success" color="green" />);
    expect(document.querySelector('.bg-green-50')).toBeInTheDocument();
    expect(document.querySelector('.border-green-200')).toBeInTheDocument();
  });
});

describe('Callout with icons', () => {
  it('should render with AlertCircle icon', () => {
    render(<Callout title="Alert" icon={AlertCircle} color="red" />);
    expect(screen.getByText('Alert')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should render with CheckCircle icon', () => {
    render(<Callout title="Success" icon={CheckCircle} color="green" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should render with Info icon', () => {
    render(<Callout title="Information" icon={Info} color="blue" />);
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should render with AlertTriangle icon', () => {
    render(<Callout title="Warning" icon={AlertTriangle} color="yellow" />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply icon color classes', () => {
    render(<Callout title="Info" icon={Info} color="blue" />);
    const icon = document.querySelector('svg');
    expect(icon?.parentElement).toHaveClass('flex-shrink-0');
  });
});

describe('Callout composition', () => {
  it('should render info callout', () => {
    render(
      <Callout title="Did you know?" icon={Info} color="blue">
        This is an informational message with helpful details.
      </Callout>
    );

    expect(screen.getByText('Did you know?')).toBeInTheDocument();
    expect(screen.getByText('This is an informational message with helpful details.')).toBeInTheDocument();
  });

  it('should render warning callout', () => {
    render(
      <Callout title="Warning" icon={AlertTriangle} color="yellow">
        Please be careful with this action.
      </Callout>
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Please be careful with this action.')).toBeInTheDocument();
  });

  it('should render error callout', () => {
    render(
      <Callout title="Error" icon={AlertCircle} color="red">
        Something went wrong. Please try again.
      </Callout>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('should render success callout', () => {
    render(
      <Callout title="Success" icon={CheckCircle} color="green">
        Operation completed successfully.
      </Callout>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully.')).toBeInTheDocument();
  });
});

describe('Callout title styling', () => {
  it('should have semibold title', () => {
    render(<Callout title="Bold Title" />);
    const title = screen.getByText('Bold Title');
    expect(title).toHaveClass('font-semibold');
  });

  it('should apply title color based on callout color', () => {
    render(<Callout title="Blue Title" color="blue" />);
    const title = screen.getByText('Blue Title');
    expect(title.className).toContain('text-blue-800');
  });
});

describe('Callout content styling', () => {
  it('should have text-sm for content wrapper', () => {
    render(
      <Callout title="Title">
        Content text
      </Callout>
    );

    // Content wrapper div has text-sm and mt-1 classes
    const contentWrapper = document.querySelector('.text-sm.mt-1');
    expect(contentWrapper).toBeInTheDocument();
  });

  it('should have margin-top for content wrapper', () => {
    render(
      <Callout title="Title">
        Content
      </Callout>
    );

    const contentWrapper = document.querySelector('.mt-1');
    expect(contentWrapper).toBeInTheDocument();
  });
});

describe('Callout without optional props', () => {
  it('should render without icon', () => {
    render(<Callout title="No Icon" />);
    expect(screen.getByText('No Icon')).toBeInTheDocument();
    expect(document.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should render without children', () => {
    render(<Callout title="Title Only" />);
    expect(screen.getByText('Title Only')).toBeInTheDocument();
  });
});

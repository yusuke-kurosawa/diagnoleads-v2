/**
 * Metric, Title, Text, Divider Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Metric, Title, Text, Divider } from '@/components/ui/metric';

describe('Metric', () => {
  it('should render metric value', () => {
    render(<Metric>$12,345</Metric>);
    expect(screen.getByText('$12,345')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Metric className="custom-metric">100</Metric>);
    expect(screen.getByText('100')).toHaveClass('custom-metric');
  });

  it('should have large text size', () => {
    render(<Metric>500</Metric>);
    expect(screen.getByText('500')).toHaveClass('text-3xl');
  });

  it('should have bold font weight', () => {
    render(<Metric>1000</Metric>);
    expect(screen.getByText('1000')).toHaveClass('font-bold');
  });

  it('should render as paragraph element', () => {
    render(<Metric>Value</Metric>);
    const metric = screen.getByText('Value');
    expect(metric.tagName).toBe('P');
  });

  it('should support dark mode styles', () => {
    render(<Metric>Dark</Metric>);
    expect(screen.getByText('Dark').className).toContain('dark:');
  });

  it('should pass additional props', () => {
    render(<Metric data-testid="metric-test">Props</Metric>);
    expect(screen.getByTestId('metric-test')).toBeInTheDocument();
  });
});

describe('Title', () => {
  it('should render title text', () => {
    render(<Title>Dashboard Overview</Title>);
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Title className="custom-title">Custom Title</Title>);
    expect(screen.getByText('Custom Title')).toHaveClass('custom-title');
  });

  it('should have appropriate text size', () => {
    render(<Title>Title Text</Title>);
    expect(screen.getByText('Title Text')).toHaveClass('text-lg');
  });

  it('should have semibold font weight', () => {
    render(<Title>Bold Title</Title>);
    expect(screen.getByText('Bold Title')).toHaveClass('font-semibold');
  });

  it('should render as h3 element', () => {
    render(<Title>Heading</Title>);
    const title = screen.getByText('Heading');
    expect(title.tagName).toBe('H3');
  });

  it('should support dark mode styles', () => {
    render(<Title>Dark Title</Title>);
    expect(screen.getByText('Dark Title').className).toContain('dark:');
  });

  it('should pass additional props', () => {
    render(<Title data-testid="title-test">Test</Title>);
    expect(screen.getByTestId('title-test')).toBeInTheDocument();
  });
});

describe('Text', () => {
  it('should render text content', () => {
    render(<Text>Description text here</Text>);
    expect(screen.getByText('Description text here')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Text className="custom-text">Custom</Text>);
    expect(screen.getByText('Custom')).toHaveClass('custom-text');
  });

  it('should have small text size', () => {
    render(<Text>Small text</Text>);
    expect(screen.getByText('Small text')).toHaveClass('text-sm');
  });

  it('should have muted color', () => {
    render(<Text>Muted text</Text>);
    expect(screen.getByText('Muted text')).toHaveClass('text-gray-600');
  });

  it('should render as paragraph element', () => {
    render(<Text>Paragraph</Text>);
    const text = screen.getByText('Paragraph');
    expect(text.tagName).toBe('P');
  });

  it('should support dark mode styles', () => {
    render(<Text>Dark text</Text>);
    expect(screen.getByText('Dark text').className).toContain('dark:');
  });

  it('should pass additional props', () => {
    render(<Text data-testid="text-test">Test</Text>);
    expect(screen.getByTestId('text-test')).toBeInTheDocument();
  });
});

describe('Divider', () => {
  it('should render divider', () => {
    render(<Divider />);
    expect(document.querySelector('hr')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Divider className="custom-divider" />);
    expect(document.querySelector('.custom-divider')).toBeInTheDocument();
  });

  it('should have margin', () => {
    render(<Divider />);
    expect(document.querySelector('hr')).toHaveClass('my-4');
  });

  it('should have border color', () => {
    render(<Divider />);
    expect(document.querySelector('hr')).toHaveClass('border-gray-200');
  });

  it('should support dark mode styles', () => {
    render(<Divider />);
    expect(document.querySelector('hr')?.className).toContain('dark:');
  });
});

describe('Component composition', () => {
  it('should render metric card pattern', () => {
    render(
      <div>
        <Title>Total Revenue</Title>
        <Metric>$45,231.89</Metric>
        <Text>+20.1% from last month</Text>
      </div>
    );

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$45,231.89')).toBeInTheDocument();
    expect(screen.getByText('+20.1% from last month')).toBeInTheDocument();
  });

  it('should render with divider', () => {
    render(
      <div>
        <Title>Section 1</Title>
        <Text>Content 1</Text>
        <Divider />
        <Title>Section 2</Title>
        <Text>Content 2</Text>
      </div>
    );

    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
    expect(document.querySelector('hr')).toBeInTheDocument();
  });
});

/**
 * Card Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText('Content')).toHaveClass('custom-class');
  });

  it('should have base styles', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('shadow-sm');
  });

  describe('decoration', () => {
    it('should render with top decoration', () => {
      render(<Card decoration="top">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('border-t-4');
    });

    it('should render with left decoration', () => {
      render(<Card decoration="left">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('border-l-4');
    });

    it('should apply blue decoration color by default', () => {
      render(<Card decoration="top">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('border-t-blue-500');
    });

    it('should apply custom decoration color', () => {
      render(
        <Card decoration="top" decorationColor="emerald">
          Content
        </Card>
      );
      expect(screen.getByText('Content')).toHaveClass('border-t-emerald-500');
    });

    it('should support violet decoration', () => {
      render(
        <Card decoration="top" decorationColor="violet">
          Content
        </Card>
      );
      expect(screen.getByText('Content')).toHaveClass('border-t-violet-500');
    });

    it('should support amber decoration', () => {
      render(
        <Card decoration="top" decorationColor="amber">
          Content
        </Card>
      );
      expect(screen.getByText('Content')).toHaveClass('border-t-amber-500');
    });

    it('should support red decoration', () => {
      render(
        <Card decoration="top" decorationColor="red">
          Content
        </Card>
      );
      expect(screen.getByText('Content')).toHaveClass('border-t-red-500');
    });
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('should render children', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should have padding', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toHaveClass('p-6');
  });

  it('should apply custom className', () => {
    render(<CardHeader className="custom-header">Header</CardHeader>);
    expect(screen.getByText('Header')).toHaveClass('custom-header');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<CardHeader ref={ref}>Header</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardTitle', () => {
  it('should render children', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('should have title styles', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-semibold');
  });

  it('should apply custom className', () => {
    render(<CardTitle className="custom-title">Title</CardTitle>);
    expect(screen.getByText('Title')).toHaveClass('custom-title');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<CardTitle ref={ref}>Title</CardTitle>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardDescription', () => {
  it('should render children', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('should have description styles', () => {
    render(<CardDescription>Description</CardDescription>);
    const desc = screen.getByText('Description');
    expect(desc).toHaveClass('text-sm');
    expect(desc).toHaveClass('text-gray-500');
  });

  it('should apply custom className', () => {
    render(<CardDescription className="custom-desc">Desc</CardDescription>);
    expect(screen.getByText('Desc')).toHaveClass('custom-desc');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<CardDescription ref={ref}>Desc</CardDescription>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardContent', () => {
  it('should render children', () => {
    render(<CardContent>Main content</CardContent>);
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('should have content padding', () => {
    render(<CardContent>Content</CardContent>);
    const content = screen.getByText('Content');
    expect(content).toHaveClass('p-6');
    expect(content).toHaveClass('pt-0');
  });

  it('should apply custom className', () => {
    render(<CardContent className="custom-content">Content</CardContent>);
    expect(screen.getByText('Content')).toHaveClass('custom-content');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<CardContent ref={ref}>Content</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardFooter', () => {
  it('should render children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('should have footer styles', () => {
    render(<CardFooter>Footer</CardFooter>);
    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(footer).toHaveClass('p-6');
  });

  it('should apply custom className', () => {
    render(<CardFooter className="custom-footer">Footer</CardFooter>);
    expect(screen.getByText('Footer')).toHaveClass('custom-footer');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<CardFooter ref={ref}>Footer</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Card composition', () => {
  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>Main content here</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description text')).toBeInTheDocument();
    expect(screen.getByText('Main content here')).toBeInTheDocument();
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });

  it('should render card with decoration and content', () => {
    render(
      <Card decoration="top" decorationColor="emerald">
        <CardHeader>
          <CardTitle>Success Card</CardTitle>
        </CardHeader>
        <CardContent>Operation completed</CardContent>
      </Card>
    );

    expect(screen.getByText('Success Card')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });
});

describe('displayName', () => {
  it('should have correct displayName for Card', () => {
    expect(Card.displayName).toBe('Card');
  });

  it('should have correct displayName for CardHeader', () => {
    expect(CardHeader.displayName).toBe('CardHeader');
  });

  it('should have correct displayName for CardTitle', () => {
    expect(CardTitle.displayName).toBe('CardTitle');
  });

  it('should have correct displayName for CardDescription', () => {
    expect(CardDescription.displayName).toBe('CardDescription');
  });

  it('should have correct displayName for CardContent', () => {
    expect(CardContent.displayName).toBe('CardContent');
  });

  it('should have correct displayName for CardFooter', () => {
    expect(CardFooter.displayName).toBe('CardFooter');
  });
});

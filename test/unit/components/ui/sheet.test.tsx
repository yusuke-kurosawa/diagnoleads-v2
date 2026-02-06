/**
 * Sheet Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';

describe('Sheet', () => {
  it('should render trigger', () => {
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
      </Sheet>
    );
    expect(screen.getByText('Open Sheet')).toBeInTheDocument();
  });

  it('should open on trigger click', () => {
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>Sheet Content</SheetContent>
      </Sheet>
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should render when defaultOpen', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Sheet Title</SheetTitle>
        </SheetContent>
      </Sheet>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('SheetContent', () => {
  it('should render content', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>Content here</SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent className="custom-sheet">Content</SheetContent>
      </Sheet>
    );
    expect(document.querySelector('.custom-sheet')).toBeInTheDocument();
  });

  it('should have close button', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>Content</SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});

describe('SheetContent sides', () => {
  it('should render on right side by default', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>Right side</SheetContent>
      </Sheet>
    );
    expect(document.querySelector('.right-0')).toBeInTheDocument();
  });

  it('should render on left side', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent side="left">Left side</SheetContent>
      </Sheet>
    );
    expect(document.querySelector('.left-0')).toBeInTheDocument();
  });

  it('should render on top', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent side="top">Top side</SheetContent>
      </Sheet>
    );
    expect(document.querySelector('.top-0')).toBeInTheDocument();
  });

  it('should render on bottom', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent side="bottom">Bottom side</SheetContent>
      </Sheet>
    );
    expect(document.querySelector('.bottom-0')).toBeInTheDocument();
  });
});

describe('SheetHeader', () => {
  it('should render header', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetHeader>Header Content</SheetHeader>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should have flex layout', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetHeader>Header</SheetHeader>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Header')).toHaveClass('flex');
  });

  it('should apply custom className', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetHeader className="custom-header">Header</SheetHeader>
        </SheetContent>
      </Sheet>
    );
    expect(document.querySelector('.custom-header')).toBeInTheDocument();
  });
});

describe('SheetFooter', () => {
  it('should render footer', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetFooter>Footer Content</SheetFooter>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('should have flex layout', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetFooter>Footer</SheetFooter>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Footer')).toHaveClass('flex');
  });
});

describe('SheetTitle', () => {
  it('should render title', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>My Sheet Title</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('My Sheet Title')).toBeInTheDocument();
  });

  it('should have title styles', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Title')).toHaveClass('text-lg');
    expect(screen.getByText('Title')).toHaveClass('font-semibold');
  });
});

describe('SheetDescription', () => {
  it('should render description', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetDescription>Description text here</SheetDescription>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Description text here')).toBeInTheDocument();
  });

  it('should have description styles', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Description')).toHaveClass('text-sm');
  });
});

describe('SheetClose', () => {
  it('should render close button', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetClose>Close Sheet</SheetClose>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Close Sheet')).toBeInTheDocument();
  });
});

describe('Sheet composition', () => {
  it('should render complete sheet structure', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here.
            </SheetDescription>
          </SheetHeader>
          <div>Form content</div>
          <SheetFooter>
            <SheetClose>Cancel</SheetClose>
            <button>Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByText('Make changes to your profile here.')).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});

describe('Sheet accessibility', () => {
  it('should have dialog role', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>Content</SheetContent>
      </Sheet>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should have accessible close button', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>Content</SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});

describe('Sheet displayName', () => {
  it('should have correct displayName', () => {
    expect(SheetHeader.displayName).toBe('SheetHeader');
    expect(SheetFooter.displayName).toBe('SheetFooter');
  });
});

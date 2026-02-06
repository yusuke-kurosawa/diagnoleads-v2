/**
 * Popover Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from '@/components/ui/popover';

describe('Popover', () => {
  it('should render trigger', () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
      </Popover>
    );
    expect(screen.getByText('Open Popover')).toBeInTheDocument();
  });

  it('should open on trigger click', () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Popover Content')).toBeInTheDocument();
  });

  it('should render when defaultOpen', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('PopoverTrigger', () => {
  it('should render trigger element', () => {
    render(
      <Popover>
        <PopoverTrigger>Click me</PopoverTrigger>
      </Popover>
    );
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should render as button by default', () => {
    render(
      <Popover>
        <PopoverTrigger>Button Trigger</PopoverTrigger>
      </Popover>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should support asChild', () => {
    render(
      <Popover>
        <PopoverTrigger asChild>
          <span>Custom Trigger</span>
        </PopoverTrigger>
      </Popover>
    );
    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
  });
});

describe('PopoverContent', () => {
  it('should render content', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent className="custom-popover">Content</PopoverContent>
      </Popover>
    );
    expect(document.querySelector('.custom-popover')).toBeInTheDocument();
  });

  it('should have base styles', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    expect(document.querySelector('.rounded-md')).toBeInTheDocument();
    expect(document.querySelector('.border')).toBeInTheDocument();
    expect(document.querySelector('.p-4')).toBeInTheDocument();
  });

  it('should have shadow', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    expect(document.querySelector('.shadow-md')).toBeInTheDocument();
  });

  it('should have z-index', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    expect(document.querySelector('.z-50')).toBeInTheDocument();
  });
});

describe('PopoverContent alignment', () => {
  it('should support center alignment', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent align="center">Centered</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Centered')).toBeInTheDocument();
  });

  it('should support start alignment', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent align="start">Start aligned</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Start aligned')).toBeInTheDocument();
  });

  it('should support end alignment', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent align="end">End aligned</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('End aligned')).toBeInTheDocument();
  });
});

describe('PopoverContent sideOffset', () => {
  it('should support custom sideOffset', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent sideOffset={10}>Content</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('PopoverAnchor', () => {
  it('should render anchor', () => {
    render(
      <Popover>
        <PopoverAnchor>Anchor Element</PopoverAnchor>
        <PopoverTrigger>Trigger</PopoverTrigger>
      </Popover>
    );
    expect(screen.getByText('Anchor Element')).toBeInTheDocument();
  });
});

describe('Popover composition', () => {
  it('should render with form content', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Edit</PopoverTrigger>
        <PopoverContent>
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" type="text" />
            <button type="submit">Save</button>
          </div>
        </PopoverContent>
      </Popover>
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should render with multiple elements', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Options</PopoverTrigger>
        <PopoverContent>
          <h4>Settings</h4>
          <p>Configure your preferences</p>
          <button>Apply</button>
        </PopoverContent>
      </Popover>
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure your preferences')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });
});

describe('Popover dark mode', () => {
  it('should have dark mode styles', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    const content = document.querySelector('[class*="dark:"]');
    expect(content).toBeInTheDocument();
  });
});

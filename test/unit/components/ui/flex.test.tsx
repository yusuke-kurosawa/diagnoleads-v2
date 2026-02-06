/**
 * Flex and Grid Component Tests
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Flex, Grid } from '@/components/ui/flex';

describe('Flex', () => {
  it('should render flex container', () => {
    render(<Flex>Content</Flex>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should have flex display', () => {
    render(<Flex>Flex content</Flex>);
    expect(document.querySelector('.flex')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Flex className="custom-flex">Custom</Flex>);
    expect(document.querySelector('.custom-flex')).toBeInTheDocument();
  });

  describe('alignItems', () => {
    it('should apply items-center by default', () => {
      render(<Flex>Center</Flex>);
      expect(document.querySelector('.items-center')).toBeInTheDocument();
    });

    it('should apply items-start', () => {
      render(<Flex alignItems="start">Start</Flex>);
      expect(document.querySelector('.items-start')).toBeInTheDocument();
    });

    it('should apply items-end', () => {
      render(<Flex alignItems="end">End</Flex>);
      expect(document.querySelector('.items-end')).toBeInTheDocument();
    });

    it('should apply items-baseline', () => {
      render(<Flex alignItems="baseline">Baseline</Flex>);
      expect(document.querySelector('.items-baseline')).toBeInTheDocument();
    });

    it('should apply items-stretch', () => {
      render(<Flex alignItems="stretch">Stretch</Flex>);
      expect(document.querySelector('.items-stretch')).toBeInTheDocument();
    });
  });

  describe('justifyContent', () => {
    it('should apply justify-between by default', () => {
      render(<Flex>Between</Flex>);
      expect(document.querySelector('.justify-between')).toBeInTheDocument();
    });

    it('should apply justify-start', () => {
      render(<Flex justifyContent="start">Start</Flex>);
      expect(document.querySelector('.justify-start')).toBeInTheDocument();
    });

    it('should apply justify-center', () => {
      render(<Flex justifyContent="center">Center</Flex>);
      expect(document.querySelector('.justify-center')).toBeInTheDocument();
    });

    it('should apply justify-end', () => {
      render(<Flex justifyContent="end">End</Flex>);
      expect(document.querySelector('.justify-end')).toBeInTheDocument();
    });

    it('should apply justify-around', () => {
      render(<Flex justifyContent="around">Around</Flex>);
      expect(document.querySelector('.justify-around')).toBeInTheDocument();
    });

    it('should apply justify-evenly', () => {
      render(<Flex justifyContent="evenly">Evenly</Flex>);
      expect(document.querySelector('.justify-evenly')).toBeInTheDocument();
    });
  });

  describe('flexDirection', () => {
    it('should apply flex-row by default', () => {
      render(<Flex>Row</Flex>);
      expect(document.querySelector('.flex-row')).toBeInTheDocument();
    });

    it('should apply flex-col', () => {
      render(<Flex flexDirection="col">Column</Flex>);
      expect(document.querySelector('.flex-col')).toBeInTheDocument();
    });

    it('should apply flex-row-reverse', () => {
      render(<Flex flexDirection="row-reverse">Row Reverse</Flex>);
      expect(document.querySelector('.flex-row-reverse')).toBeInTheDocument();
    });

    it('should apply flex-col-reverse', () => {
      render(<Flex flexDirection="col-reverse">Column Reverse</Flex>);
      expect(document.querySelector('.flex-col-reverse')).toBeInTheDocument();
    });
  });

  it('should combine multiple props', () => {
    render(
      <Flex alignItems="start" justifyContent="center" flexDirection="col">
        Combined
      </Flex>
    );

    const container = document.querySelector('.flex');
    expect(container).toHaveClass('items-start');
    expect(container).toHaveClass('justify-center');
    expect(container).toHaveClass('flex-col');
  });

  it('should pass additional props', () => {
    render(<Flex data-testid="flex-test">Test</Flex>);
    expect(screen.getByTestId('flex-test')).toBeInTheDocument();
  });
});

describe('Grid', () => {
  it('should render grid container', () => {
    render(<Grid>Grid content</Grid>);
    expect(screen.getByText('Grid content')).toBeInTheDocument();
  });

  it('should have grid display', () => {
    render(<Grid>Grid</Grid>);
    expect(document.querySelector('.grid')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Grid className="custom-grid">Custom</Grid>);
    expect(document.querySelector('.custom-grid')).toBeInTheDocument();
  });

  it('should have single column by default', () => {
    render(<Grid>Single column</Grid>);
    expect(document.querySelector('.grid-cols-1')).toBeInTheDocument();
  });

  it('should set data attributes for responsive columns', () => {
    render(<Grid numItemsSm={2} numItemsLg={4}>Responsive</Grid>);
    const grid = document.querySelector('.grid');
    expect(grid).toHaveAttribute('data-sm-cols', '2');
    expect(grid).toHaveAttribute('data-lg-cols', '4');
  });

  it('should use default responsive values', () => {
    render(<Grid>Default</Grid>);
    const grid = document.querySelector('.grid');
    expect(grid).toHaveAttribute('data-sm-cols', '1');
    expect(grid).toHaveAttribute('data-lg-cols', '4');
  });

  it('should pass additional props', () => {
    render(<Grid data-testid="grid-test">Test</Grid>);
    expect(screen.getByTestId('grid-test')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Grid>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });
});

describe('Layout composition', () => {
  it('should render flex with multiple children', () => {
    render(
      <Flex justifyContent="between" alignItems="center">
        <span>Left</span>
        <span>Right</span>
      </Flex>
    );

    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });

  it('should render grid with cards', () => {
    render(
      <Grid numItemsSm={2} numItemsLg={3}>
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
      </Grid>
    );

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByText('Card 3')).toBeInTheDocument();
  });

  it('should nest flex inside grid', () => {
    render(
      <Grid>
        <Flex>
          <span>Nested content</span>
        </Flex>
      </Grid>
    );

    expect(screen.getByText('Nested content')).toBeInTheDocument();
    expect(document.querySelector('.grid .flex')).toBeInTheDocument();
  });
});

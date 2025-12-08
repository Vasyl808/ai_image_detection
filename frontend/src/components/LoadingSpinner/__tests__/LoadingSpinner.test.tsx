import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render with default message', () => {
    render(<LoadingSpinner />);

    const messages = screen.getAllByText('Loading...');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should render with custom message', () => {
    render(<LoadingSpinner message="Processing..." />);

    const messages = screen.getAllByText('Processing...');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should not render message when empty string is provided', () => {
    const { container } = render(<LoadingSpinner message="" />);

    const message = container.querySelector('p');
    expect(message).not.toBeInTheDocument();
  });

  it('should render spinner element', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('[class*="spinner"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinner = container.querySelector('[class*="spinnerSm"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with medium size by default', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('[class*="spinnerMd"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinner = container.querySelector('[class*="spinnerLg"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner message="Loading..." />);

    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('should have aria-hidden on spinner', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('[aria-hidden="true"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should have screen reader only text', () => {
    const { container } = render(<LoadingSpinner message="Loading..." />);

    const srOnly = container.querySelector('[class*="srOnly"]');
    expect(srOnly).toBeInTheDocument();
    expect(srOnly).toHaveTextContent('Loading...');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LoadingSpinner className="custom-class" />
    );

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('custom-class');
  });

  it('should render with all props combined', () => {
    const { container } = render(
      <LoadingSpinner 
        message="Analyzing..." 
        size="lg"
        className="custom-spinner"
      />
    );

    const messages = screen.getAllByText('Analyzing...');
    expect(messages.length).toBeGreaterThan(0);
    expect(container.querySelector('[class*="spinnerLg"]')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('custom-spinner');
  });

  it('should render spinner with correct role', () => {
    render(<LoadingSpinner />);

    const statusContainer = screen.getByRole('status');
    expect(statusContainer).toBeInTheDocument();
  });

  it('should handle long loading message', () => {
    const longMessage = 'This is a very long loading message that describes what is currently being processed in the application';
    render(<LoadingSpinner message={longMessage} />);

    const messages = screen.getAllByText(longMessage);
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should render message in both visible and screen reader text', () => {
    const message = 'Processing image...';
    const { container } = render(<LoadingSpinner message={message} />);

    const messages = screen.getAllByText(message);
    expect(messages.length).toBe(2);
    const srOnlyMessage = container.querySelector('[class*="srOnly"]');
    expect(srOnlyMessage).toHaveTextContent(message);
  });

  it('should maintain message when size changes', () => {
    const { rerender } = render(
      <LoadingSpinner message="Loading..." size="sm" />
    );

    let messages = screen.getAllByText('Loading...');
    expect(messages.length).toBeGreaterThan(0);

    rerender(<LoadingSpinner message="Loading..." size="lg" />);

    messages = screen.getAllByText('Loading...');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should render without message prop', () => {
    render(<LoadingSpinner />);

    const statusContainer = screen.getByRole('status');
    expect(statusContainer).toBeInTheDocument();
  });

  it('should handle undefined message gracefully', () => {
    render(<LoadingSpinner message={undefined} />);

    const statusContainer = screen.getByRole('status');
    expect(statusContainer).toBeInTheDocument();
  });
});

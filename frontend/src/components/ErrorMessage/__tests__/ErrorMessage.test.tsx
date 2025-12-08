import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage Component', () => {
  it('should render error message with default title', () => {
    render(
      <ErrorMessage message="Test error message" />
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(
      <ErrorMessage message="Test error" title="Custom Title" />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render error severity by default', () => {
    const { container } = render(
      <ErrorMessage message="Error message" severity="error" />
    );

    const alertDiv = container.querySelector('[role="alert"]');
    expect(alertDiv).toBeInTheDocument();
  });

  it('should render warning severity when specified', () => {
    const { container } = render(
      <ErrorMessage message="Warning message" severity="warning" />
    );

    const alertDiv = container.querySelector('[role="alert"]');
    expect(alertDiv).toBeInTheDocument();
  });

  it('should render dismiss button when onDismiss callback is provided', () => {
    const mockOnDismiss = vi.fn();
    render(
      <ErrorMessage 
        message="Test error" 
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByLabelText('Dismiss error');
    expect(dismissButton).toBeInTheDocument();
  });

  it('should not render dismiss button when onDismiss is not provided', () => {
    render(
      <ErrorMessage message="Test error" />
    );

    const dismissButton = screen.queryByLabelText('Dismiss error');
    expect(dismissButton).not.toBeInTheDocument();
  });

  it('should call onDismiss callback when dismiss button is clicked', () => {
    const mockOnDismiss = vi.fn();
    render(
      <ErrorMessage 
        message="Test error" 
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByLabelText('Dismiss error');
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ErrorMessage 
        message="Test error" 
        className="custom-class"
      />
    );

    const alertDiv = container.querySelector('[role="alert"]');
    expect(alertDiv).toHaveClass('custom-class');
  });

  it('should display error icon for error severity', () => {
    const { container } = render(
      <ErrorMessage message="Error message" severity="error" />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should display warning icon for warning severity', () => {
    const { container } = render(
      <ErrorMessage message="Warning message" severity="warning" />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should render with all props combined', () => {
    const mockOnDismiss = vi.fn();
    render(
      <ErrorMessage 
        message="Combined test error"
        title="Test Title"
        severity="warning"
        onDismiss={mockOnDismiss}
        className="test-class"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Combined test error')).toBeInTheDocument();
    expect(screen.getByLabelText('Dismiss error')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ErrorMessage message="Test error" />
    );

    const alertDiv = screen.getByRole('alert');
    expect(alertDiv).toBeInTheDocument();
  });

  it('should handle long error messages', () => {
    const longMessage = 'This is a very long error message that should wrap properly in the component without breaking the layout or causing any visual issues.';
    render(
      <ErrorMessage message={longMessage} />
    );

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle special characters in message', () => {
    const specialMessage = 'Error: <script>alert("test")</script> & "quotes"';
    render(
      <ErrorMessage message={specialMessage} />
    );

    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });
});

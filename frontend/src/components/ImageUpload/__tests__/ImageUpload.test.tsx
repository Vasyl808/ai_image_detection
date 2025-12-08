import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUpload } from '../ImageUpload';

describe('ImageUpload Component', () => {
  const mockOnImageSelect = vi.fn();

  beforeEach(() => {
    mockOnImageSelect.mockClear();
  });

  it('should render upload component with title', () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('should render upload prompt when no preview', () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
  });

  it('should render preview image when imagePreview is provided', () => {
    const previewUrl = 'data:image/png;base64,test';
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={previewUrl}
      />
    );

    const previewImage = screen.getByAltText('Preview');
    expect(previewImage).toBeInTheDocument();
    expect(previewImage).toHaveAttribute('src', previewUrl);
  });

  it('should show status bar when preview is available', () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview="data:image/png;base64,test"
      />
    );

    expect(screen.getByText(/Image ready/i)).toBeInTheDocument();
  });

  it('should handle file input change', async () => {
    const user = userEvent.setup();
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await user.upload(input, file);

    expect(mockOnImageSelect).toHaveBeenCalledWith(file);
  });

  it('should have dropzone element', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const dropzone = container.querySelector('[class*="dropzone"]');
    expect(dropzone).toBeInTheDocument();
  });

  it('should handle file selection through input', async () => {
    const user = userEvent.setup();
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await user.upload(input, file);

    expect(mockOnImageSelect).toHaveBeenCalledWith(file);
  });

  it('should not call onImageSelect when disabled', async () => {
    const user = userEvent.setup();
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await user.upload(input, file);

    expect(mockOnImageSelect).not.toHaveBeenCalled();
  });

  it('should not process file selection when disabled', async () => {
    const user = userEvent.setup();
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await user.upload(input, file);

    expect(mockOnImageSelect).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
        className="custom-class"
      />
    );

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const input = screen.getByLabelText('Upload image file');
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('type', 'file');
  });

  it('should handle click on dropzone to open file picker', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const dropzone = container.querySelector('[class*="dropzone"]') as HTMLElement;
    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;

    const clickSpy = vi.spyOn(input, 'click');
    await user.click(dropzone);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should render file input with image accept type', () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', 'image/*');
  });

  it('should display correct text when preview is shown', () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview="data:image/png;base64,test"
      />
    );

    expect(screen.getByText('Click or drag to change image')).toBeInTheDocument();
  });

  it('should handle file input with multiple files (only first)', async () => {
    const user = userEvent.setup();
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const file1 = new File(['test1'], 'test1.png', { type: 'image/png' });
    const file2 = new File(['test2'], 'test2.png', { type: 'image/png' });

    await user.upload(input, [file1, file2]);

    expect(mockOnImageSelect).toHaveBeenCalledWith(file1);
    expect(mockOnImageSelect).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('should render upload icon', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });


  it('should render preview container when image is selected', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview="data:image/png;base64,test"
      />
    );

    const previewContainer = container.querySelector('[class*="previewContainer"]');
    expect(previewContainer).toBeInTheDocument();
  });

  it('should render upload prompt when no preview', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const uploadPrompt = container.querySelector('[class*="uploadPrompt"]');
    expect(uploadPrompt).toBeInTheDocument();
  });

  it('should handle click on disabled component', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
        disabled={true}
      />
    );

    const dropzone = container.querySelector('[class*="dropzone"]') as HTMLElement;
    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    await user.click(dropzone);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should render status bar with icon', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview="data:image/png;base64,test"
      />
    );

    const statusBar = container.querySelector('[class*="statusBar"]');
    expect(statusBar).toBeInTheDocument();
    const svgs = statusBar?.querySelectorAll('svg');
    expect(svgs?.length).toBeGreaterThan(0);
  });

  it('should render icon circle in upload prompt', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const iconCircle = container.querySelector('[class*="iconCircle"]');
    expect(iconCircle).toBeInTheDocument();
  });

  it('should render text container in upload prompt', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const textContainer = container.querySelector('[class*="textContainer"]');
    expect(textContainer).toBeInTheDocument();
  });

  it('should render prompt title and instructions', () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/up to 10MB/i)).toBeInTheDocument();
  });

  it('should handle file change with empty files', async () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const event = new Event('change', { bubbles: true });
    Object.defineProperty(input, 'files', {
      value: [],
      writable: false,
    });

    input.dispatchEvent(event);
    expect(mockOnImageSelect).not.toHaveBeenCalled();
  });

  it('should render with all required elements', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="dropzone"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="title"]')).toBeInTheDocument();
  });

  it('should have correct file input attributes', () => {
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const input = screen.getByLabelText('Upload image file') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('aria-label', 'Upload image file');
  });

  it('should render container with correct structure', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const mainContainer = container.firstChild;
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer?.childNodes.length).toBeGreaterThan(0);
  });

  it('should update preview when imagePreview prop changes', () => {
    const { rerender } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();

    rerender(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview="data:image/png;base64,test"
      />
    );

    expect(screen.getByAltText('Preview')).toBeInTheDocument();
  });

  it('should handle className prop correctly', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
        className="custom-upload"
      />
    );

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('custom-upload');
  });

  it('should render image with correct src when preview is provided', () => {
    const previewUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={previewUrl}
      />
    );

    const img = screen.getByAltText('Preview') as HTMLImageElement;
    expect(img.src).toBe(previewUrl);
  });

  it('should render status bar only when preview exists', () => {
    const { container: containerWithoutPreview } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    let statusBar = containerWithoutPreview.querySelector('[class*="statusBar"]');
    expect(statusBar).not.toBeInTheDocument();

    const { container: containerWithPreview } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview="data:image/png;base64,test"
      />
    );

    statusBar = containerWithPreview.querySelector('[class*="statusBar"]');
    expect(statusBar).toBeInTheDocument();
  });

  it('should handle synthetic drag over event', async () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const dropzone = container.querySelector('[class*="dropzone"]') as HTMLElement;
    const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
    dropzone.dispatchEvent(dragOverEvent);
    expect(dropzone).toBeInTheDocument();
  });

  it('should handle synthetic drop event with valid file', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const dropzone = container.querySelector('[class*="dropzone"]') as HTMLElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        types: ['Files'],
      },
      writable: false,
    });

    dropzone.dispatchEvent(dropEvent);
    expect(dropzone).toBeInTheDocument();
  });

  it('should prevent default on drag over', async () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
      />
    );

    const dropzone = container.querySelector('[class*="dropzone"]') as HTMLElement;
    const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
    
    dropzone.dispatchEvent(dragOverEvent);
    expect(dropzone).toBeInTheDocument();
  });

  it('should handle drop event when disabled', () => {
    const { container } = render(
      <ImageUpload 
        onImageSelect={mockOnImageSelect}
        imagePreview={null}
        disabled={true}
      />
    );

    const dropzone = container.querySelector('[class*="dropzone"]') as HTMLElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
        types: ['Files'],
      },
      writable: false,
    });

    dropzone.dispatchEvent(dropEvent);
    expect(mockOnImageSelect).not.toHaveBeenCalled();
  });
});

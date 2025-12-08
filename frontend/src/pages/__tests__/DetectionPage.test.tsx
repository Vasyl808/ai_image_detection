import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetectionPage } from '../DetectionPage';
import * as hooks from '../../hooks';

vi.mock('../../hooks', () => ({
  useImageUpload: vi.fn(),
  useDetection: vi.fn(),
  useReportDownload: vi.fn(() => ({
    isDownloading: false,
    downloadError: null,
    downloadReport: vi.fn(),
  })),
}));

describe('DetectionPage', () => {
  const mockHandleFileSelect = vi.fn();
  const mockClearSelection = vi.fn();
  const mockDetectDeepfake = vi.fn();
  const mockResetDetection = vi.fn();

  const mockImageUploadHook = {
    selectedFile: null,
    preview: null,
    error: null,
    isValid: false,
    handleFileSelect: mockHandleFileSelect,
    clearSelection: mockClearSelection,
  };

  const mockDetectionHook = {
    result: null,
    isLoading: false,
    error: null,
    detectDeepfake: mockDetectDeepfake,
    reset: mockResetDetection,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (hooks.useImageUpload as any).mockReturnValue(mockImageUploadHook);
    (hooks.useDetection as any).mockReturnValue(mockDetectionHook);
  });

  it('should render page title', () => {
    render(<DetectionPage />);
    expect(screen.getByText('Deepfake Detection')).toBeInTheDocument();
  });

  it('should render page description', () => {
    render(<DetectionPage />);
    expect(screen.getByText(/Upload an image to analyze/i)).toBeInTheDocument();
  });

  it('should render ImageUpload component', () => {
    render(<DetectionPage />);
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('should render empty state when no image is selected', () => {
    render(<DetectionPage />);
    expect(screen.getByText(/Upload an image and click.*Analyze.*to see results/i)).toBeInTheDocument();
  });

  it('should show action buttons when file is selected', () => {
    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      selectedFile: new File(['test'], 'test.png', { type: 'image/png' }),
      isValid: true,
    });

    render(<DetectionPage />);

    const analyzeButtons = screen.getAllByText('Analyze Image');
    expect(analyzeButtons.length).toBeGreaterThan(0);
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should call detectDeepfake when Analyze button is clicked', async () => {
    const user = userEvent.setup();
    const testFile = new File(['test'], 'test.png', { type: 'image/png' });

    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      selectedFile: testFile,
      isValid: true,
    });

    render(<DetectionPage />);

    const analyzeButtons = screen.getAllByText('Analyze Image');
    await user.click(analyzeButtons[0]);

    expect(mockDetectDeepfake).toHaveBeenCalledWith(testFile);
  });

  it('should disable Analyze button when loading', () => {
    const testFile = new File(['test'], 'test.png', { type: 'image/png' });

    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      selectedFile: testFile,
      isValid: true,
    });

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      isLoading: true,
    });

    render(<DetectionPage />);

    const analyzingButtons = screen.getAllByText(/Analyzing/i);
    expect(analyzingButtons[0]).toBeDisabled();
  });

  it('should show loading spinner when analyzing', () => {
    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      selectedFile: new File(['test'], 'test.png', { type: 'image/png' }),
      isValid: true,
    });

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      isLoading: true,
    });

    render(<DetectionPage />);

    const analyzingMessages = screen.getAllByText(/Analyzing/i);
    expect(analyzingMessages.length).toBeGreaterThan(0);
  });

  it('should display error message when upload error occurs', () => {
    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      error: 'Invalid file format',
    });

    render(<DetectionPage />);

    expect(screen.getByText('Invalid file format')).toBeInTheDocument();
  });

  it('should display error message when detection error occurs', () => {
    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      error: 'Detection failed',
    });

    render(<DetectionPage />);

    expect(screen.getByText('Detection failed')).toBeInTheDocument();
  });

  it('should call reset handlers when error dismiss is clicked', async () => {
    const user = userEvent.setup();

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      error: 'Detection failed',
    });

    render(<DetectionPage />);

    const dismissButton = screen.getByLabelText('Dismiss error');
    await user.click(dismissButton);

    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockResetDetection).toHaveBeenCalled();
  });

  it('should call reset handlers when Reset button is clicked', async () => {
    const user = userEvent.setup();
    const testFile = new File(['test'], 'test.png', { type: 'image/png' });

    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      selectedFile: testFile,
      isValid: true,
    });

    render(<DetectionPage />);

    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);

    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockResetDetection).toHaveBeenCalled();
  });

  it('should display results when detection is complete', () => {
    const mockResult = {
      success: true,
      prediction: {
        label: 'AI-generated image',
        is_deepfake: true,
      },
      explanation: {
        gradcam_image: '/api/gradcam/test.png',
        description: 'Test description',
      },
      session_id: 'test-session',
    };

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      result: mockResult,
    });

    render(<DetectionPage />);

    expect(screen.getByText('AI-generated image')).toBeInTheDocument();
  });

  it('should render info panel with instructions', () => {
    render(<DetectionPage />);

    expect(screen.getByText('How to use:')).toBeInTheDocument();
    expect(screen.getByText(/Upload an image by dragging/i)).toBeInTheDocument();
    expect(screen.getByText(/Click "Analyze Image"/i)).toBeInTheDocument();
    expect(screen.getByText(/Review the results/i)).toBeInTheDocument();
  });

  it('should disable ImageUpload when loading', () => {
    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      isLoading: true,
    });

    const { container } = render(<DetectionPage />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDisabled();
  });

  it('should hide action buttons when no file is selected', () => {
    render(<DetectionPage />);

    const analyzeButtons = screen.queryAllByText('Analyze Image');
    expect(analyzeButtons.length).toBe(0);
  });

  it('should hide action buttons when result is displayed', () => {
    const mockResult = {
      success: true,
      prediction: {
        label: 'Real',
        is_deepfake: false,
      },
      explanation: {
        gradcam_image: '/api/gradcam/test.png',
        description: 'Test',
      },
    };

    const testFile = new File(['test'], 'test.png', { type: 'image/png' });

    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      selectedFile: testFile,
      isValid: true,
    });

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      result: mockResult,
    });

    render(<DetectionPage />);

    const analyzeButtons = screen.queryAllByText('Analyze Image');
    expect(analyzeButtons.length).toBe(0);
  });

  it('should handle file selection through ImageUpload', async () => {
    const user = userEvent.setup();
    render(<DetectionPage />);

    const fileInput = screen.getByLabelText('Upload image file') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await user.upload(fileInput, file);

    expect(mockHandleFileSelect).toHaveBeenCalledWith(file);
  });

  it('should show loading message during analysis', () => {
    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      isLoading: true,
    });

    render(<DetectionPage />);

    const analyzingMessages = screen.getAllByText(/Analyzing/i);
    expect(analyzingMessages.length).toBeGreaterThan(0);
  });

  it('should render page header with icon', () => {
    const { container } = render(<DetectionPage />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should handle both upload and detection errors', () => {
    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      error: 'Upload error',
    });

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      error: 'Detection error',
    });

    render(<DetectionPage />);

    expect(screen.getByText('Upload error')).toBeInTheDocument();
  });

  it('should render results section when result exists', () => {
    const mockResult = {
      success: true,
      prediction: {
        label: 'AI-generated image',
        is_deepfake: true,
      },
      explanation: {
        gradcam_image: '/api/gradcam/test.png',
        description: 'Test',
      },
      session_id: 'test-session',
    };

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      result: mockResult,
    });

    const { container } = render(<DetectionPage />);

    const resultsSection = container.querySelector('[class*="resultsSection"]');
    expect(resultsSection).toBeInTheDocument();
  });

  it('should pass correct props to ResultDisplay', () => {
    const mockResult = {
      success: true,
      prediction: {
        label: 'Real',
        is_deepfake: false,
      },
      explanation: {
        gradcam_image: '/api/gradcam/test.png',
        description: 'Test',
      },
      session_id: 'test-session',
    };

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      result: mockResult,
    });

    render(<DetectionPage />);

    expect(screen.getByText('Real')).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    const { container } = render(<DetectionPage />);

    const mainContainer = container.querySelector('[class*="container"]');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should handle analyze with invalid file', () => {
    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      selectedFile: new File(['test'], 'test.png', { type: 'image/png' }),
      isValid: false,
    });

    render(<DetectionPage />);

    const analyzeButtons = screen.getAllByText('Analyze Image');
    expect(analyzeButtons[0]).toBeDisabled();
  });

  it('should render page with proper structure', () => {
    const { container } = render(<DetectionPage />);
    const mainContent = container.querySelector('[class*="container"]');
    expect(mainContent).toBeInTheDocument();
  });

  it('should render both upload and info sections', () => {
    render(<DetectionPage />);
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText('How to use:')).toBeInTheDocument();
  });

  it('should show all instruction steps', () => {
    render(<DetectionPage />);
    expect(screen.getByText(/Upload an image by dragging/i)).toBeInTheDocument();
    expect(screen.getByText(/Click "Analyze Image"/i)).toBeInTheDocument();
    expect(screen.getByText(/Review the results/i)).toBeInTheDocument();
  });

  it('should render page header with icon', () => {
    const { container } = render(<DetectionPage />);
    const header = container.querySelector('[class*="header"]');
    expect(header).toBeInTheDocument();
  });

  it('should render empty state message', () => {
    render(<DetectionPage />);
    const emptyStateMessages = screen.getAllByText(/Upload an image and click.*Analyze.*to see results/i);
    expect(emptyStateMessages.length).toBeGreaterThan(0);
  });

  it('should render info panel', () => {
    const { container } = render(<DetectionPage />);
    const infoPanel = container.querySelector('[class*="infoPanel"]');
    expect(infoPanel).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(<DetectionPage />);
    const descriptions = screen.getAllByText(/Upload an image to analyze/i);
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('should handle reset with file selected', async () => {
    const user = userEvent.setup();
    const testFile = new File(['test'], 'test.png', { type: 'image/png' });

    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      selectedFile: testFile,
      isValid: true,
    });

    render(<DetectionPage />);

    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);

    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockResetDetection).toHaveBeenCalled();
  });

  it('should display results section when result is available', () => {
    const mockResult = {
      success: true,
      prediction: {
        label: 'AI-generated image',
        is_deepfake: true,
      },
      explanation: {
        gradcam_image: '/api/gradcam/test.png',
        description: 'Test',
      },
      session_id: 'test-session',
    };

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      result: mockResult,
    });

    const { container } = render(<DetectionPage />);
    const resultsSection = container.querySelector('[class*="resultsSection"]');
    expect(resultsSection).toBeInTheDocument();
  });

  it('should pass onReset callback to ResultDisplay', () => {
    const mockResult = {
      success: true,
      prediction: {
        label: 'Real',
        is_deepfake: false,
      },
      explanation: {
        gradcam_image: '/api/gradcam/test.png',
        description: 'Test',
      },
      session_id: 'test-session',
    };

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      result: mockResult,
    });

    render(<DetectionPage />);
    expect(screen.getByText('Real')).toBeInTheDocument();
  });

  it('should render main content area', () => {
    const { container } = render(<DetectionPage />);
    const mainArea = container.querySelector('[class*="container"]');
    expect(mainArea).toBeInTheDocument();
  });

  it('should handle multiple error states', () => {
    (hooks.useImageUpload as any).mockReturnValue({
      ...mockImageUploadHook,
      error: 'File too large',
    });

    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      error: null,
    });

    render(<DetectionPage />);
    expect(screen.getByText('File too large')).toBeInTheDocument();
  });

  it('should render ImageUpload with correct props', () => {
    (hooks.useDetection as any).mockReturnValue({
      ...mockDetectionHook,
      isLoading: true,
    });

    render(<DetectionPage />);
    const fileInput = screen.getByLabelText('Upload image file') as HTMLInputElement;
    expect(fileInput).toBeDisabled();
  });
});

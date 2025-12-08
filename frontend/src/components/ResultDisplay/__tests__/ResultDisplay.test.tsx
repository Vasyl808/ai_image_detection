import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultDisplay } from '../ResultDisplay';
import type { DetectionResponse } from '../../../types';

vi.mock('../../../hooks', () => ({
  useReportDownload: vi.fn(() => ({
    isDownloading: false,
    downloadError: null,
    downloadReport: vi.fn(),
    clearDownloadError: vi.fn(),
  })),
}));

import { useReportDownload } from '../../../hooks';

describe('ResultDisplay Component', () => {
  const mockOnReset = vi.fn();

  const mockDeepfakeResult: DetectionResponse = {
    success: true,
    prediction: {
      label: 'AI-generated image',
      is_deepfake: true,
    },
    explanation: {
      gradcam_image: '/api/gradcam/test.png',
      description: 'This image shows signs of AI generation in the facial features.',
    },
    session_id: 'test-session-123',
  };

  const mockAuthenticResult: DetectionResponse = {
    success: true,
    prediction: {
      label: 'Real',
      is_deepfake: false,
    },
    explanation: {
      gradcam_image: '/api/gradcam/test2.png',
      description: 'This image appears to be authentic.',
    },
    session_id: 'test-session-456',
  };

  beforeEach(() => {
    mockOnReset.mockClear();
    vi.clearAllMocks();
  });

  it('should render deepfake result correctly', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    expect(screen.getByText('AI-generated image')).toBeInTheDocument();
    expect(screen.getByText(/AI-generated or manipulated/i)).toBeInTheDocument();
  });

  it('should render authentic result correctly', () => {
    render(
      <ResultDisplay result={mockAuthenticResult} onReset={mockOnReset} />
    );

    expect(screen.getByText('Real')).toBeInTheDocument();
    const descriptions = screen.getAllByText(/appears to be authentic/i);
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('should display Grad-CAM image', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const gradcamImage = screen.getByAltText('Grad-CAM visualization');
    expect(gradcamImage).toBeInTheDocument();
    expect(gradcamImage).toHaveAttribute('src', expect.stringContaining('/api/gradcam/test.png'));
  });

  it('should display explanation description', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    expect(screen.getByText('This image shows signs of AI generation in the facial features.')).toBeInTheDocument();
  });

  it('should render interpretation guide', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    expect(screen.getByText(/Red\/Yellow areas/i)).toBeInTheDocument();
    expect(screen.getByText(/Blue\/Green areas/i)).toBeInTheDocument();
  });

  it('should render reset button', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const resetButton = screen.getByText('Analyze Another Image');
    expect(resetButton).toBeInTheDocument();
  });

  it('should call onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const resetButton = screen.getByText('Analyze Another Image');
    await user.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('should render download button when session_id is present', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const downloadButton = screen.getByText('Download PDF Report');
    expect(downloadButton).toBeInTheDocument();
  });

  it('should disable download button when session_id is not present', () => {
    const resultWithoutSession: DetectionResponse = {
      ...mockDeepfakeResult,
      session_id: undefined,
    };

    render(
      <ResultDisplay result={resultWithoutSession} onReset={mockOnReset} />
    );

    const downloadButton = screen.getByText('Download PDF Report') as HTMLButtonElement;
    expect(downloadButton).toBeDisabled();
  });

  it('should have proper accessibility for result card', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const resultCard = container.querySelector('[class*="resultCard"]');
    expect(resultCard).toBeInTheDocument();
  });

  it('should display different styling for deepfake vs authentic', () => {
    const { container: deepfakeContainer } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const deepfakeCard = deepfakeContainer.querySelector('[class*="resultCardDeepfake"]');
    expect(deepfakeCard).toBeInTheDocument();

    const { container: authenticContainer } = render(
      <ResultDisplay result={mockAuthenticResult} onReset={mockOnReset} />
    );

    const authenticCard = authenticContainer.querySelector('[class*="resultCardAuthentic"]');
    expect(authenticCard).toBeInTheDocument();
  });

  it('should render interpretation list items', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThanOrEqual(3);
  });

  it('should have correct image attributes for Grad-CAM', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const gradcamImage = screen.getByAltText('Grad-CAM visualization') as HTMLImageElement;
    expect(gradcamImage).toHaveAttribute('loading', 'lazy');
    expect(gradcamImage).toHaveAttribute('crossOrigin', 'anonymous');
  });

  it('should render with deepfake prediction label', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    expect(screen.getByText('AI-generated image')).toBeInTheDocument();
  });

  it('should render with authentic prediction label', () => {
    render(
      <ResultDisplay result={mockAuthenticResult} onReset={mockOnReset} />
    );

    expect(screen.getByText('Real')).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const downloadButton = screen.getByText(/Download/i);
    const resetButton = screen.getByText('Analyze Another Image');

    expect(downloadButton).toBeInTheDocument();
    expect(resetButton).toBeInTheDocument();
  });

  it('should handle missing explanation gracefully', () => {
    const resultWithExplanation: DetectionResponse = {
      ...mockDeepfakeResult,
      explanation: {
        gradcam_image: '/api/gradcam/test.png',
        description: '',
      },
    };

    render(
      <ResultDisplay result={resultWithExplanation} onReset={mockOnReset} />
    );

    const gradcamImage = screen.getByAltText('Grad-CAM visualization');
    expect(gradcamImage).toBeInTheDocument();
  });

  it('should render interpretation title', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    expect(screen.getByText(/How to interpret the heatmap/i)).toBeInTheDocument();
  });

  it('should display icons for result status', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should render Grad-CAM title', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    expect(screen.getByText(/Visual Explanation.*Grad-CAM/i)).toBeInTheDocument();
  });

  it('should handle long description text', () => {
    const longDescription = 'This is a very long description that explains the Grad-CAM visualization and what the model detected in the image. ' +
      'It provides detailed information about the areas that influenced the decision.';

    const resultWithLongDescription: DetectionResponse = {
      ...mockDeepfakeResult,
      explanation: {
        gradcam_image: '/api/gradcam/test.png',
        description: longDescription,
      },
    };

    render(
      <ResultDisplay result={resultWithLongDescription} onReset={mockOnReset} />
    );

    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('should have proper button types', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('should display download button with correct text', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const downloadButton = screen.getByText('Download PDF Report');
    expect(downloadButton).toBeInTheDocument();
  });

  it('should show generating state when downloading', () => {
    vi.mocked(useReportDownload).mockReturnValue({
      isDownloading: true,
      downloadError: null,
      downloadReport: vi.fn(),
      clearDownloadError: vi.fn(),
    });

    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    expect(screen.getByText(/Generating/i)).toBeInTheDocument();
  });

  it('should display download error when present', () => {
    vi.mocked(useReportDownload).mockReturnValue({
      isDownloading: false,
      downloadError: 'Failed to download report',
      downloadReport: vi.fn(),
      clearDownloadError: vi.fn(),
    });

    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    expect(screen.getByText('Failed to download report')).toBeInTheDocument();
  });

  it('should call downloadReport with session_id when download button is clicked', async () => {
    const user = userEvent.setup();
    const mockDownloadReport = vi.fn();
    
    vi.mocked(useReportDownload).mockReturnValue({
      isDownloading: false,
      downloadError: null,
      downloadReport: mockDownloadReport,
      clearDownloadError: vi.fn(),
    });

    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const downloadButton = screen.getByText('Download PDF Report');
    await user.click(downloadButton);

    expect(mockDownloadReport).toHaveBeenCalledWith('test-session-123');
  });

  it('should render result card with correct styling for deepfake', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const resultCard = container.querySelector('[class*="resultCard"]');
    expect(resultCard).toBeInTheDocument();
    expect(resultCard?.className).toContain('resultCard');
  });

  it('should render result card with correct styling for authentic', () => {
    const { container } = render(
      <ResultDisplay result={mockAuthenticResult} onReset={mockOnReset} />
    );

    const resultCard = container.querySelector('[class*="resultCard"]');
    expect(resultCard).toBeInTheDocument();
    expect(resultCard?.className).toContain('resultCard');
  });

  it('should render gradcam card', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const gradcamCard = container.querySelector('[class*="gradcamCard"]');
    expect(gradcamCard).toBeInTheDocument();
  });

  it('should render interpretation card', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const interpretationCard = container.querySelector('[class*="interpretationCard"]');
    expect(interpretationCard).toBeInTheDocument();
  });

  it('should render action buttons container', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const actionButtons = container.querySelector('[class*="actionButtons"]');
    expect(actionButtons).toBeInTheDocument();
  });

  it('should have correct title for deepfake result', () => {
    render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const title = screen.getByText('AI-generated image');
    expect(title).toBeInTheDocument();
  });

  it('should have correct title for authentic result', () => {
    render(
      <ResultDisplay result={mockAuthenticResult} onReset={mockOnReset} />
    );

    const title = screen.getByText('Real');
    expect(title).toBeInTheDocument();
  });

  it('should render result header', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const resultHeader = container.querySelector('[class*="resultHeader"]');
    expect(resultHeader).toBeInTheDocument();
  });

  it('should render result content', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const resultContent = container.querySelector('[class*="resultContent"]');
    expect(resultContent).toBeInTheDocument();
  });

  it('should render gradcam header with icon', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const gradcamHeader = container.querySelector('[class*="gradcamHeader"]');
    expect(gradcamHeader).toBeInTheDocument();
  });

  it('should render gradcam image container', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const imageContainer = container.querySelector('[class*="gradcamImageContainer"]');
    expect(imageContainer).toBeInTheDocument();
  });

  it('should render gradcam description', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const description = container.querySelector('[class*="gradcamDescription"]');
    expect(description).toBeInTheDocument();
  });

  it('should render interpretation list with proper structure', () => {
    const { container } = render(
      <ResultDisplay result={mockDeepfakeResult} onReset={mockOnReset} />
    );

    const interpretationList = container.querySelector('[class*="interpretationList"]');
    expect(interpretationList).toBeInTheDocument();
  });
});

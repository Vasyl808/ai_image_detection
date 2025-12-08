import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../LandingPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LandingPage', () => {
  it('should render hero section', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Detect Deepfakes')).toBeInTheDocument();
  });

  it('should render hero description', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/Advanced neural network technology/i)).toBeInTheDocument();
  });

  it('should render AI-Powered Detection badge', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('AI-Powered Detection Technology')).toBeInTheDocument();
  });

  it('should render Start Detection CTA button', () => {
    renderWithRouter(<LandingPage />);
    const startButton = screen.getByText('Start Detection');
    expect(startButton).toBeInTheDocument();
  });

  it('should render Learn More link', () => {
    renderWithRouter(<LandingPage />);
    const learnMoreLink = screen.getByText('Learn More');
    expect(learnMoreLink).toBeInTheDocument();
  });

  it('should render stats section', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('95%+')).toBeInTheDocument();
    expect(screen.getByText('Detection Accuracy')).toBeInTheDocument();
  });

  it('should render analysis time stat', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('<2s')).toBeInTheDocument();
    expect(screen.getByText('Analysis Time')).toBeInTheDocument();
  });

  it('should render free to use stat', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Free to Use')).toBeInTheDocument();
  });

  it('should render features section title', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Powerful Features')).toBeInTheDocument();
  });

  it('should render features section description', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/cutting-edge technology/i)).toBeInTheDocument();
  });

  it('should render AI Detection feature', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('AI Detection')).toBeInTheDocument();
    expect(screen.getByText(/EfficientNet-B0/i)).toBeInTheDocument();
  });

  it('should render Visual Explanations feature', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Visual Explanations')).toBeInTheDocument();
    expect(screen.getByText(/Grad-CAM heatmaps/i)).toBeInTheDocument();
  });

  it('should render Lightning Fast feature', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
    expect(screen.getByText(/Get results in seconds/i)).toBeInTheDocument();
  });

  it('should render Privacy First feature', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Privacy First')).toBeInTheDocument();
    expect(screen.getByText(/never stored permanently/i)).toBeInTheDocument();
  });

  it('should render How It Works section', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('should render How It Works description', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/Three simple steps/i)).toBeInTheDocument();
  });

  it('should render Upload Image step', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop or click/i)).toBeInTheDocument();
  });

  it('should render AI Analysis step', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
    expect(screen.getByText(/neural network analyzes/i)).toBeInTheDocument();
  });

  it('should render Get Results step', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Get Results')).toBeInTheDocument();
    expect(screen.getByText(/View results and visual explanations/i)).toBeInTheDocument();
  });

  it('should render CTA section', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Ready to Detect Deepfakes?')).toBeInTheDocument();
  });

  it('should render CTA section description', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/Start analyzing images now/i)).toBeInTheDocument();
  });

  it('should render CTA button in CTA section', () => {
    renderWithRouter(<LandingPage />);
    const ctaButtons = screen.getAllByText(/Start Detection Now/i);
    expect(ctaButtons.length).toBeGreaterThan(0);
  });

  it('should have proper links to /detect route', () => {
    renderWithRouter(<LandingPage />);
    const detectLinks = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href') === '/detect'
    );
    expect(detectLinks.length).toBeGreaterThan(0);
  });

  it('should have Learn More link to features section', () => {
    renderWithRouter(<LandingPage />);
    const learnMoreLink = screen.getByText('Learn More');
    expect(learnMoreLink).toHaveAttribute('href', '#features');
  });

  it('should render all feature cards', () => {
    renderWithRouter(<LandingPage />);
    const featureCards = screen.getAllByText(/Detection|Explanations|Lightning|Privacy/);
    expect(featureCards.length).toBeGreaterThanOrEqual(4);
  });

  it('should render all step numbers', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    const { container } = renderWithRouter(<LandingPage />);
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThanOrEqual(4);
  });

  it('should render icons in hero section', () => {
    const { container } = renderWithRouter(<LandingPage />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should have background effects in hero', () => {
    const { container } = renderWithRouter(<LandingPage />);
    const backgroundElements = container.querySelectorAll('[class*="background"], [class*="blob"]');
    expect(backgroundElements.length).toBeGreaterThan(0);
  });

  it('should render feature cards with proper structure', () => {
    const { container } = renderWithRouter(<LandingPage />);
    const featureCards = container.querySelectorAll('[class*="featureCard"]');
    expect(featureCards.length).toBeGreaterThanOrEqual(4);
  });

  it('should render step containers', () => {
    const { container } = renderWithRouter(<LandingPage />);
    const stepContainers = container.querySelectorAll('[class*="stepContainer"]');
    expect(stepContainers.length).toBeGreaterThanOrEqual(3);
  });

  it('should have proper semantic HTML structure', () => {
    const { container } = renderWithRouter(<LandingPage />);
    const headings = container.querySelectorAll('h1, h2, h3');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should render stat cards', () => {
    const { container } = renderWithRouter(<LandingPage />);
    const statCards = container.querySelectorAll('[class*="statCard"]');
    expect(statCards.length).toBeGreaterThanOrEqual(3);
  });

  it('should have proper navigation links', () => {
    renderWithRouter(<LandingPage />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render feature descriptions', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/trained on thousands of images/i)).toBeInTheDocument();
    expect(screen.getByText(/exactly which regions influenced/i)).toBeInTheDocument();
    expect(screen.getByText(/optimized inference/i)).toBeInTheDocument();
    expect(screen.getByText(/processed securely/i)).toBeInTheDocument();
  });

  it('should have all main sections', () => {
    const { container } = renderWithRouter(<LandingPage />);
    expect(container.querySelector('[class*="heroSection"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="featuresSection"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="howItWorksSection"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="ctaSection"]')).toBeInTheDocument();
  });

  it('should render all feature titles', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('AI Detection')).toBeInTheDocument();
    expect(screen.getByText('Visual Explanations')).toBeInTheDocument();
    expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
    expect(screen.getByText('Privacy First')).toBeInTheDocument();
  });

  it('should have proper button elements', () => {
    renderWithRouter(<LandingPage />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render complete hero content', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText('Detect Deepfakes')).toBeInTheDocument();
    expect(screen.getByText(/Advanced neural network/i)).toBeInTheDocument();
    expect(screen.getByText('Start Detection')).toBeInTheDocument();
  });
});

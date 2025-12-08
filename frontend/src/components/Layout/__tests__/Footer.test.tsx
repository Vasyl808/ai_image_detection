import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer Component', () => {
  it('should render footer element', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('should render brand name', () => {
    render(<Footer />);
    expect(screen.getByText('DeepfakeGuard')).toBeInTheDocument();
  });

  it('should render brand description', () => {
    render(<Footer />);
    expect(screen.getByText(/Advanced AI-powered deepfake detection/i)).toBeInTheDocument();
  });

  it('should render Technology section', () => {
    render(<Footer />);
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('should render About section', () => {
    render(<Footer />);
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('should render technology list items', () => {
    render(<Footer />);
    expect(screen.getByText(/EfficientNet-B0 Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/PyTorch Deep Learning/i)).toBeInTheDocument();
    expect(screen.getByText(/Grad-CAM Visualization/i)).toBeInTheDocument();
    expect(screen.getByText(/FastAPI Backend/i)).toBeInTheDocument();
    expect(screen.getByText(/React \+ TypeScript/i)).toBeInTheDocument();
  });

  it('should render about text', () => {
    render(<Footer />);
    expect(screen.getByText(/Built with modern web technologies/i)).toBeInTheDocument();
  });

  it('should render version information', () => {
    render(<Footer />);
    expect(screen.getByText(/Version 1\.0\.0/i)).toBeInTheDocument();
  });

  it('should render copyright text', () => {
    const currentYear = new Date().getFullYear();
    render(<Footer />);
    expect(screen.getByText(new RegExp(`© ${currentYear} DeepfakeGuard`))).toBeInTheDocument();
  });

  it('should render made with text', () => {
    render(<Footer />);
    expect(screen.getByText(/Made with.*for a safer digital world/i)).toBeInTheDocument();
  });

  it('should render footer grid', () => {
    const { container } = render(<Footer />);
    const footerGrid = container.querySelector('[class*="footerGrid"]');
    expect(footerGrid).toBeInTheDocument();
  });

  it('should render brand section', () => {
    const { container } = render(<Footer />);
    const brandSection = container.querySelector('[class*="brandSection"]');
    expect(brandSection).toBeInTheDocument();
  });

  it('should render tech section', () => {
    const { container } = render(<Footer />);
    const techSection = container.querySelector('[class*="techSection"]');
    expect(techSection).toBeInTheDocument();
  });

  it('should render about section', () => {
    const { container } = render(<Footer />);
    const aboutSection = container.querySelector('[class*="aboutSection"]');
    expect(aboutSection).toBeInTheDocument();
  });

  it('should render bottom bar', () => {
    const { container } = render(<Footer />);
    const bottomBar = container.querySelector('[class*="bottomBar"]');
    expect(bottomBar).toBeInTheDocument();
  });

  it('should render brand icon', () => {
    const { container } = render(<Footer />);
    const brandIcon = container.querySelector('[class*="brandIcon"]');
    expect(brandIcon).toBeInTheDocument();
  });

  it('should render tech list', () => {
    const { container } = render(<Footer />);
    const techList = container.querySelector('[class*="techList"]');
    expect(techList).toBeInTheDocument();
  });

  it('should render all section titles', () => {
    render(<Footer />);
    const sectionTitles = screen.getAllByText(/Technology|About/);
    expect(sectionTitles.length).toBeGreaterThanOrEqual(2);
  });

  it('should render heart icon', () => {
    const { container } = render(<Footer />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should render footer container', () => {
    const { container } = render(<Footer />);
    const footerContainer = container.querySelector('[class*="container"]');
    expect(footerContainer).toBeInTheDocument();
  });

  it('should have proper footer structure', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    const container_el = footer?.querySelector('[class*="container"]');
    expect(container_el).toBeInTheDocument();
  });

  it('should render brand header', () => {
    const { container } = render(<Footer />);
    const brandHeader = container.querySelector('[class*="brandHeader"]');
    expect(brandHeader).toBeInTheDocument();
  });

  it('should render bottom content', () => {
    const { container } = render(<Footer />);
    const bottomContent = container.querySelector('[class*="bottomContent"]');
    expect(bottomContent).toBeInTheDocument();
  });
});

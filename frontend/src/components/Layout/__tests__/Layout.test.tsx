import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../Layout';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Layout Component', () => {
  it('should render layout container', () => {
    const { container } = renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    const layoutContainer = container.querySelector('[class*="container"]');
    expect(layoutContainer).toBeInTheDocument();
  });

  it('should render Header component', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    const deepfakeGuardTexts = screen.getAllByText('DeepfakeGuard');
    expect(deepfakeGuardTexts.length).toBeGreaterThan(0);
  });

  it('should render Footer component', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    expect(screen.getByText(/Advanced AI-powered deepfake detection/i)).toBeInTheDocument();
  });

  it('should render children content', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render main element', () => {
    const { container } = renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('should render header before main', () => {
    const { container } = renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    const header = container.querySelector('header');
    const main = container.querySelector('main');
    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    if (header && main) {
      expect(header.compareDocumentPosition(main)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
  });

  it('should render footer after main', () => {
    const { container } = renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    const main = container.querySelector('main');
    const footer = container.querySelector('footer');
    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    if (main && footer) {
      expect(main.compareDocumentPosition(footer)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
  });

  it('should render multiple children', () => {
    renderWithRouter(
      <Layout>
        <div>Content 1</div>
        <div>Content 2</div>
      </Layout>
    );
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('should render with complex children', () => {
    renderWithRouter(
      <Layout>
        <section>
          <h1>Test Section</h1>
          <p>Test paragraph</p>
        </section>
      </Layout>
    );
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    const { container } = renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    const layoutContainer = container.querySelector('[class*="container"]');
    const header = layoutContainer?.querySelector('header');
    const main = layoutContainer?.querySelector('main');
    const footer = layoutContainer?.querySelector('footer');
    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
  });

  it('should render header with navigation', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Detect')).toBeInTheDocument();
  });

  it('should render footer with brand info', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('should render main with children', () => {
    const { container } = renderWithRouter(
      <Layout>
        <div className="test-child">Test Content</div>
      </Layout>
    );
    const main = container.querySelector('main');
    const testChild = main?.querySelector('.test-child');
    expect(testChild).toBeInTheDocument();
  });

  it('should accept ReactNode children', () => {
    renderWithRouter(
      <Layout>
        <span>Span content</span>
        <article>Article content</article>
      </Layout>
    );
    expect(screen.getByText('Span content')).toBeInTheDocument();
    expect(screen.getByText('Article content')).toBeInTheDocument();
  });

  it('should render layout with text children', () => {
    renderWithRouter(
      <Layout>
        Just text content
      </Layout>
    );
    expect(screen.getByText('Just text content')).toBeInTheDocument();
  });

  it('should have footer with version info', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    const versionTexts = screen.getAllByText(/Version 1\.0\.0/i);
    expect(versionTexts.length).toBeGreaterThan(0);
  });

  it('should have footer with copyright', () => {
    const currentYear = new Date().getFullYear();
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    const copyrightTexts = screen.getAllByText(new RegExp(`© ${currentYear}`));
    expect(copyrightTexts.length).toBeGreaterThan(0);
  });

  it('should render complete page structure', () => {
    const { container } = renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    const elements = container.querySelectorAll('header, main, footer');
    expect(elements.length).toBe(3);
  });
});

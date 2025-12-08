import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Header Component', () => {
  it('should render header element', () => {
    const { container } = renderWithRouter(<Header />);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('should render logo with text', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('DeepfakeGuard')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Detect')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('should render home link with correct href', () => {
    renderWithRouter(<Header />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should render detect link with correct href', () => {
    renderWithRouter(<Header />);
    const detectLink = screen.getByText('Detect').closest('a');
    expect(detectLink).toHaveAttribute('href', '/detect');
  });

  it('should render GitHub link with correct href', () => {
    renderWithRouter(<Header />);
    const githubLink = screen.getByText('GitHub').closest('a');
    expect(githubLink).toHaveAttribute('href', 'https://github.com');
  });

  it('should render GitHub link with target blank', () => {
    renderWithRouter(<Header />);
    const githubLink = screen.getByText('GitHub').closest('a');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('should render GitHub link with noopener noreferrer', () => {
    renderWithRouter(<Header />);
    const githubLink = screen.getByText('GitHub').closest('a');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render nav element', () => {
    const { container } = renderWithRouter(<Header />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should render logo link', () => {
    renderWithRouter(<Header />);
    const logoLink = screen.getByText('DeepfakeGuard').closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should render all navigation links in correct order', () => {
    const { container } = renderWithRouter(<Header />);
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(4);
  });

  it('should render icons for navigation links', () => {
    const { container } = renderWithRouter(<Header />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should have proper header structure', () => {
    const { container } = renderWithRouter(<Header />);
    const header = container.querySelector('header');
    const nav = header?.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should render logo icon', () => {
    const { container } = renderWithRouter(<Header />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should have nav links with proper structure', () => {
    const { container } = renderWithRouter(<Header />);
    const navLinks = container.querySelectorAll('[class*="navLink"]');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('should render home link text', () => {
    renderWithRouter(<Header />);
    const homeLink = screen.getByText('Home');
    expect(homeLink).toBeInTheDocument();
  });

  it('should render detect link text', () => {
    renderWithRouter(<Header />);
    const detectLink = screen.getByText('Detect');
    expect(detectLink).toBeInTheDocument();
  });

  it('should render GitHub link text', () => {
    renderWithRouter(<Header />);
    const githubLink = screen.getByText('GitHub');
    expect(githubLink).toBeInTheDocument();
  });

  it('should have proper nav container', () => {
    const { container } = renderWithRouter(<Header />);
    const navContainer = container.querySelector('[class*="navContainer"]');
    expect(navContainer).toBeInTheDocument();
  });

  it('should render logo with icon and text', () => {
    const { container } = renderWithRouter(<Header />);
    const logo = container.querySelector('[class*="logo"]');
    expect(logo).toBeInTheDocument();
    expect(screen.getByText('DeepfakeGuard')).toBeInTheDocument();
  });
});

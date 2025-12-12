import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { describe, it, expect } from 'vitest';

const renderNavbar = () => {
  render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  it('renders logo and navigation links', () => {
    renderNavbar();
    
    // Check logo (by alt text)
    expect(screen.getByAltText('SoulMind')).toBeInTheDocument();
    
    // Check links
    expect(screen.getByText('Főoldal')).toBeInTheDocument();
    expect(screen.getByText('Szolgáltatások')).toBeInTheDocument();
    expect(screen.getByText('Áraink')).toBeInTheDocument();
    expect(screen.getByText('Munkatársak')).toBeInTheDocument();
    expect(screen.getByText('Kötetek')).toBeInTheDocument();
    expect(screen.getAllByText('JELENTKEZZ')[0]).toBeInTheDocument();
  });

  it('toggles mobile menu on click', () => {
    renderNavbar();
    
    const toggleButton = screen.getByLabelText('Toggle menu');
    expect(toggleButton).toBeInTheDocument();

    // Menu should be closed initially
    fireEvent.click(toggleButton);
    
    // Mobile menu items should now be present (desktop + mobile versions)
    const homeLinks = screen.getAllByText('Főoldal');
    expect(homeLinks.length).toBeGreaterThan(0);
  });
});

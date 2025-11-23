import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkClass = ({ isActive }) => 
    `text-sm uppercase tracking-widest font-medium transition-colors duration-300 ${
      isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'
    }`;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-serif font-bold text-dark tracking-wider">
            SoulMind<span className="text-primary">.</span>
          </Link>
          
          <div className="hidden md:flex space-x-10">
            <NavLink to="/" className={navLinkClass}>Főoldal</NavLink>
            <NavLink to="/kerdoiv" className={navLinkClass}>Kérdőív</NavLink>
            <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-dark">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-4 flex flex-col space-y-4">
          <Link to="/" onClick={() => setIsOpen(false)} className="text-dark font-medium hover:text-primary">Főoldal</Link>
          <Link to="/kerdoiv" onClick={() => setIsOpen(false)} className="text-dark font-medium hover:text-primary">Kérdőív</Link>
          <Link to="/admin" onClick={() => setIsOpen(false)} className="text-dark font-medium hover:text-primary">Admin</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom'; // useLocation importálása
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation(); // Aktuális oldal lekérése

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- JAVÍTOTT LOGIKA ---
  // Mikor legyen sötét a szöveg?
  // 1. Ha görgettünk (scrolled) -> Fehér a háttér, sötét a szöveg.
  // 2. Ha nyitva a menü (isOpen) -> Fehér háttér, sötét szöveg.
  // 3. HA NEM A FŐOLDALON VAGYUNK (location.pathname !== '/') -> Admin/Kérdőív oldalon mindig sötét kell.
  const isDarkText = scrolled || isOpen || location.pathname !== '/';

  const navLinkClass = ({ isActive }) => 
    `text-sm uppercase tracking-widest font-medium transition-colors duration-300 ${
      isActive 
        ? 'text-primary font-bold' 
        : isDarkText ? 'text-gray-600 hover:text-primary' : 'text-gray-200 hover:text-white'
    }`;

  // Háttér logika: Görgetésnél VAGY nyitott menünél legyen fehér alap
  const showWhiteBg = scrolled || isOpen;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      showWhiteBg ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
    } py-4`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className={`text-2xl font-serif font-bold tracking-wider transition-colors duration-300 ${isDarkText ? 'text-dark' : 'text-white drop-shadow-md'} flex items-center gap-2`}>
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="SoulMind" className="h-16 md:h-28 w-auto max-w-[80vw]" />
          </Link>
          
          <div className="hidden md:flex space-x-10 items-center">
            <NavLink to="/" className={navLinkClass}>Főoldal</NavLink>
            <NavLink to="/szolgaltatasok" className={navLinkClass}>Szolgáltatások</NavLink>
            <NavLink to="/kotetek" className={navLinkClass}>Kötetek</NavLink>
            <NavLink 
              to="/jelentkezes" 
              className={`px-5 py-2 rounded-full font-bold text-sm tracking-widest transition-all duration-300 shadow-md transform hover:scale-105 ${
                isDarkText ? 'bg-primary text-white hover:bg-dark' : 'bg-white text-primary hover:bg-gray-100'
              }`}
            >
              JELENTKEZZ
            </NavLink>
            <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className={isDarkText ? 'text-dark' : 'text-white'}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-4 flex flex-col space-y-4 animate-fade-in">
          <Link to="/" onClick={() => setIsOpen(false)} className="text-dark font-medium hover:text-primary">Főoldal</Link>
          <Link to="/szolgaltatasok" onClick={() => setIsOpen(false)} className="text-dark font-medium hover:text-primary">Szolgáltatások</Link>
          <Link to="/kotetek" onClick={() => setIsOpen(false)} className="text-dark font-medium hover:text-primary">Kötetek</Link>
          <Link to="/jelentkezes" onClick={() => setIsOpen(false)} className="text-primary font-bold hover:text-dark">JELENTKEZZ</Link>
          <Link to="/admin" onClick={() => setIsOpen(false)} className="text-dark font-medium hover:text-primary">Admin</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

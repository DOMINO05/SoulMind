import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';

const FloatingCTA = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Csak a főoldalon legyen görgetéshez kötve
      if (location.pathname === '/') {
        setVisible(window.scrollY > 300);
      } else {
        setVisible(true);
      }
    };

    // Kezdeti ellenőrzés
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);
  
  // Ne jelenjen meg a Jelentkezés oldalon és az Admin felületen
  if (['/jelentkezes', '/admin'].includes(location.pathname)) return null;

  // Ha nem látható, akkor ne rendereljen semmit
  if (!visible) return null;

  return (
    <Link 
      to="/jelentkezes" 
      className="fixed bottom-6 right-6 md:bottom-12 z-[60] bg-primary text-white p-4 md:px-6 md:py-3 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-bold text-sm tracking-wider animate-fade-in-up"
      title="Jelentkezz most"
    >
      {/* Mobil nézet: Csak ikon */}
      <span className="md:hidden">
        <MessageCircle size={24} />
      </span>

      {/* Desktop nézet: Szöveg + Nyíl */}
      <span className="hidden md:flex items-center gap-2">
        Jelentkezz most <ArrowRight size={18} />
      </span>
    </Link>
  );
};

export default FloatingCTA;

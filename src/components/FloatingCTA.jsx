import { useLocation, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const FloatingCTA = () => {
  const location = useLocation();
  
  // Ne jelenjen meg a Jelentkezés oldalon és az Admin felületen
  if (['/jelentkezes', '/admin'].includes(location.pathname)) return null;

  return (
    <Link 
      to="/jelentkezes" 
      className="fixed bottom-6 right-6 md:bottom-12 z-[60] bg-primary text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-bold text-sm tracking-wider animate-fade-in-up"
    >
      Jelentkezz most <ArrowRight size={18} />
    </Link>
  );
};

export default FloatingCTA;

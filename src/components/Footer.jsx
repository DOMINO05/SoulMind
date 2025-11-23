const Footer = () => {
  return (
    <footer className="bg-dark text-white py-12 border-t border-primary/20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <h3 className="text-xl font-serif font-bold mb-4 text-primary">SoulMind Academy</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Ősi önismereti módszerek, mai vezetői kihívásokra adaptálva.
          </p>
        </div>
        <div className="flex flex-col space-y-2 md:items-center">
          <h4 className="font-bold mb-2">Navigáció</h4>
          <a href="/" className="text-gray-400 hover:text-primary transition">Főoldal</a>
          <a href="/kerdoiv" className="text-gray-400 hover:text-primary transition">Jelentkezés</a>
          {/* Itt van a link a Footerben */}
          <a 
            href="./adatkezelesi_tajekoztato.pdf" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-primary transition"
          >
            Adatkezelési tájékoztató
          </a>
        </div>
        <div className="md:text-right">
          <h4 className="font-bold mb-2">Kapcsolat</h4>
          <p className="text-gray-400">soulmindacademy@gmail.com</p>
          <p className="text-gray-400">+36 30 478 5623</p>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} SoulMind Academy. Minden jog fenntartva.
      </div>
    </footer>
  );
};

export default Footer;
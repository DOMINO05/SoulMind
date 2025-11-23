import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Questionnaire from './pages/Questionnaire';
import Admin from './pages/Admin';
import ScrollToTop from './components/ScrollToTop';
import ThemeSwitcher from './components/ThemeSwitcher';
// 1. Importáld a Providert
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    // 2. Csomagold be az egészet
    <ThemeProvider>
      <HashRouter>
        <ScrollToTop />
        <ThemeSwitcher />
        
        <div className="flex flex-col min-h-screen font-sans text-dark transition-colors duration-500 bg-light">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/kerdoiv" element={<Questionnaire />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
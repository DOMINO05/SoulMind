import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Questionnaire from './pages/Questionnaire';
import Admin from './pages/Admin';
import Volumes from './pages/Volumes';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      
      <div className="flex flex-col min-h-screen font-sans text-dark transition-colors duration-500 bg-light">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kotetek" element={<Volumes />} />
            <Route path="/kerdoiv" element={<Questionnaire />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}

export default App;

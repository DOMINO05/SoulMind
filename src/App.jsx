import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Questionnaire from './pages/Questionnaire';
import Admin from './pages/Admin';
import ScrollToTop from './components/ScrollToTop'; // 1. Importálás

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop /> {/* 2. Beillesztés ide, a Router alá */}
      
      <div className="flex flex-col min-h-screen font-sans text-dark">
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
    </BrowserRouter>
  );
}

export default App;
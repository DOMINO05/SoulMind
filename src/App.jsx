import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import Prices from './pages/Prices';
import Team from './pages/Team';
import Application from './pages/Application';
import Admin from './pages/Admin';
import Volumes from './pages/Volumes';
import Login from './pages/Login';
import Register from './pages/Register';
import ScrollToTop from './components/ScrollToTop';
import FloatingCTA from './components/FloatingCTA';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter basename="/">
      <AuthProvider>
        <ScrollToTop />
        
        <div className="flex flex-col min-h-screen font-sans text-dark transition-colors duration-500 bg-light">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/szolgaltatasok" element={<Services />} />
              <Route path="/araink" element={<Prices />} />
              <Route path="/munkatarsak" element={<Team />} />
              <Route path="/kotetek" element={<Volumes />} />
              <Route path="/jelentkezes" element={<Application />} />
              <Route path="/soulmind-login-2025" element={<Login />} />
              <Route path="/soulmind-register-2025" element={<Register />} />
              <Route 
                path="/soulmind-control-2025" 
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
          <FloatingCTA />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

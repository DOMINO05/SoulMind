import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Register = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const fetchIpAndCheckAccess = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setIpAddress(data.ip);

        // Check if IP is banned
        const { data: accessData, error: rpcError } = await supabase.rpc('check_access', { request_ip: data.ip });
        
        if (rpcError) throw rpcError;

        if (!accessData.allowed) {
          setIsLocked(true);
          setError(accessData.error || 'Hozzáférés megtagadva.');
        } else {
          setIsLocked(false);
        }
      } catch (err) {
        console.error('Error checking access:', err);
      }
    };

    fetchIpAndCheckAccess();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
        setError('Túl sok próbálkozás. Kérlek várj.');
        return;
    }

    if (!ipAddress) {
      setError('Nem sikerült azonosítani az IP címet. Kérlek kapcsold ki a reklámblokkolót.');
      return;
    }

    setLoading(true);

    // Double check before attempting registration
    const { data: accessData } = await supabase.rpc('check_access', { request_ip: ipAddress });
    if (accessData && !accessData.allowed) {
      setIsLocked(true);
      setError(accessData.error);
      setLoading(false);
      return;
    }
    
    const { error: signUpError } = await signUp({ 
      email, 
      password,
      options: {
        data: {
          admin_secret: secretCode
        }
      }
    });
    
    if (signUpError) {
      await supabase.rpc('log_failure', { request_ip: ipAddress });
      
      // Re-check status to see if they got banned just now
      const { data: newAccessData } = await supabase.rpc('check_access', { request_ip: ipAddress });
      if (newAccessData && !newAccessData.allowed) {
        setIsLocked(true);
        setError(newAccessData.error);
      } else {
        setError(`${signUpError.message}`);
      }
      setLoading(false);
    } else {
      // Success
      await supabase.rpc('reset_access', { request_ip: ipAddress });
      alert("Sikeres regisztráció! Most már bejelentkezhetsz.");
      navigate('/soulmind-login-2025');
    }
  };

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4 pt-20">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-serif font-bold text-dark mb-6 text-center">Admin Regisztráció</h2>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm text-center font-bold">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary outline-none disabled:bg-gray-100 disabled:text-gray-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLocked || loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1">Jelszó</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary outline-none disabled:bg-gray-100 disabled:text-gray-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLocked || loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1">Adminisztrátori Jelszó</label>
            <input 
              type="password" 
              required 
              placeholder="Titkos kód"
              className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary outline-none disabled:bg-gray-100 disabled:text-gray-400"
              value={secretCode}
              onChange={e => setSecretCode(e.target.value)}
              disabled={isLocked || loading}
            />
          </div>

          <button 
            disabled={loading || isLocked}
            className="w-full py-3 bg-primary text-white font-bold rounded hover:bg-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Regisztráció...' : 'Regisztráció'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Lockout State
  const [attempts, setAttempts] = useState(() => parseInt(localStorage.getItem('register_attempts') || '0'));
  const [lockoutTime, setLockoutTime] = useState(() => parseInt(localStorage.getItem('register_lockout') || '0'));

  useEffect(() => {
    if (Date.now() < lockoutTime) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 60000);
      setError(`Túl sok próbálkozás. Kérlek várj ${remaining} percet.`);
    } else if (attempts >= 3 && lockoutTime > 0 && Date.now() > lockoutTime) {
        // Clear lockout if time passed
        localStorage.removeItem('register_lockout');
        localStorage.setItem('register_attempts', '0');
        setLockoutTime(0);
        setAttempts(0);
        setError('');
    }
  }, [lockoutTime, attempts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (Date.now() < lockoutTime) {
        const remaining = Math.ceil((lockoutTime - Date.now()) / 60000);
        setError(`Túl sok próbálkozás. Kérlek várj ${remaining} percet.`);
        return;
    }

    setLoading(true);
    
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
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('register_attempts', newAttempts);
      
      if (newAttempts >= 3) {
        const lockUntil = Date.now() + 15 * 60 * 1000; // 15 perc
        setLockoutTime(lockUntil);
        localStorage.setItem('register_lockout', lockUntil);
        setError('Túl sok sikertelen próbálkozás. 15 percre letiltottunk.');
      } else {
        setError(`${signUpError.message} (Maradék próbálkozás: ${3 - newAttempts})`);
      }
      setLoading(false);
    } else {
      // Success
      localStorage.removeItem('register_attempts');
      localStorage.removeItem('register_lockout');
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
              disabled={Date.now() < lockoutTime}
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
              disabled={Date.now() < lockoutTime}
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
              disabled={Date.now() < lockoutTime}
            />
          </div>

          <button 
            disabled={loading || Date.now() < lockoutTime}
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

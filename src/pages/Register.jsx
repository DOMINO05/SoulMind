import { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      setError(signUpError.message); // Jobb hibaüzenet
      setLoading(false);
    } else {
      alert("Sikeres regisztráció! Most már bejelentkezhetsz.");
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4 pt-20">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-serif font-bold text-dark mb-6 text-center">Admin Regisztráció</h2>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1">Jelszó</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1">Adminisztrátori Jelszó</label>
            <input 
              type="password" 
              required 
              placeholder="Titkos kód"
              className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-primary outline-none"
              value={secretCode}
              onChange={e => setSecretCode(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-bold rounded hover:bg-dark transition-colors disabled:opacity-70"
          >
            {loading ? 'Regisztráció...' : 'Regisztráció'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Már van fiókod? <Link to="/login" className="text-primary hover:underline">Bejelentkezés</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

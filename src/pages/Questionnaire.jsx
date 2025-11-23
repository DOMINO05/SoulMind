import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Questionnaire = () => {
  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', interests: '', gdpr: false
  });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gdpr) return alert('GDPR elfogadása kötelező!');
    
    setStatus('submitting');
    const { error } = await supabase.from('questionnaire').insert({
      full_name: formData.full_name,
      phone: formData.phone,
      email: formData.email,
      interests: formData.interests
    });

    if (error) {
      console.error(error);
      setStatus('error');
    } else {
      setStatus('success');
      setFormData({ full_name: '', phone: '', email: '', interests: '', gdpr: false });
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-light flex items-center justify-center px-4 py-12 animate-fade-in">
      {/* Itt a fade-in-up animáció a konténeren */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in-up">
        <div className="bg-primary p-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-white">Kérdőív</h2>
          <p className="text-white/90 mt-2 font-light">Jelentkezz a következő vezetői csoportunkba.</p>
        </div>
        
        <div className="p-8">
          {status === 'success' ? (
            <div className="text-center py-10 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">✓</div>
              <h3 className="text-xl font-bold text-dark mb-2">Köszönjük!</h3>
              <p className="text-gray-500">Hamarosan felvesszük veled a kapcsolatot.</p>
              <button onClick={() => setStatus('idle')} className="mt-6 text-primary font-semibold underline hover:text-dark transition">Új kitöltés</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {['full_name', 'email', 'phone'].map((field) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">
                    {field === 'full_name' ? 'Teljes Név' : field === 'email' ? 'Email Cím' : 'Telefonszám'}
                  </label>
                  <input 
                    required 
                    type={field === 'email' ? 'email' : 'text'}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={formData[field]}
                    onChange={e => setFormData({...formData, [field]: e.target.value})}
                  />
                </div>
              ))}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Üzenet / Érdeklődés</label>
                <textarea 
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  value={formData.interests}
                  onChange={e => setFormData({...formData, interests: e.target.value})}
                ></textarea>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary flex-shrink-0"
                  checked={formData.gdpr}
                  onChange={e => setFormData({...formData, gdpr: e.target.checked})}
                />
                <span className="text-sm text-gray-600 group-hover:text-dark transition">
                  Elolvastam és elfogadom az{' '}
                  <a 
                    href="/adatkezelesi_tajekoztato.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary font-semibold underline hover:text-dark z-10 relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Adatkezelési tájékoztatót
                  </a>.
                </span>
              </label>

              <button 
                disabled={status === 'submitting'}
                className="w-full py-4 bg-dark text-white font-bold rounded-lg hover:bg-primary transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 uppercase tracking-wider text-sm active:scale-98"
              >
                {status === 'submitting' ? 'Küldés...' : 'Beküldés'}
              </button>
              {status === 'error' && <p className="text-red-500 text-center text-sm">Hiba történt. Próbáld újra.</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
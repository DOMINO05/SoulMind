import { useEffect } from 'react';

const Impresszum = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-light pt-24 pb-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-dark mb-8">Impresszum</h1>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
          
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Szolgáltató Adatai</h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <p className="font-bold">Cégnév:</p>
                <p>SoulMind Academy Kft.</p>
              </div>
              <div>
                <p className="font-bold">Székhely:</p>
                <p>4030 Debrecen, Balaton utca 110.</p>
              </div>
              <div>
                <p className="font-bold">Cégjegyzékszám:</p>
                <p>09-09-036808</p>
              </div>
              <div>
                <p className="font-bold">Adószám:</p>
                <p>32768684-1-09</p>
              </div>
              <div>
                <p className="font-bold">Email:</p>
                <p><a href="mailto:soulmindacademy@gmail.com" className="hover:text-primary transition">soulmindacademy@gmail.com</a></p>
              </div>
              <div>
                <p className="font-bold">Telefon:</p>
                <p><a href="tel:+36304785623" className="hover:text-primary transition">+36 30 478 5623</a></p>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-8">
            <h2 className="text-xl font-bold text-primary mb-4">Tárhelyszolgáltatók</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-dark mb-2">Frontend (Weboldal)</h3>
                <p className="font-bold">Cloudflare, Inc.</p>
                <p className="text-sm text-gray-600">101 Townsend St, San Francisco, CA 94107, USA</p>
                <p className="text-sm text-gray-600"><a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className="hover:underline">www.cloudflare.com</a></p>
              </div>

              <div>
                <h3 className="font-bold text-dark mb-2">Backend (Adatbázis)</h3>
                <p className="font-bold">Supabase, Inc.</p>
                <p className="text-sm text-gray-600">Adatközpont: West EU (Írország)</p>
                <p className="text-sm text-gray-600"><a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="hover:underline">www.supabase.com</a></p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Impresszum;

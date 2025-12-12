import { useEffect } from 'react';

const Adatvedelem = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-light pt-24 pb-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-dark mb-8">Adatkezelési Tájékoztató</h1>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8 text-gray-700 leading-relaxed">
          
          <p className="text-sm text-gray-500 italic">Hatályba lépés: 2025. 12. 01. | Utolsó frissítés: 2025. 12. 12.</p>

          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">1. Adatkezelő adatai</h2>
            <p><strong>Cégnév:</strong> SoulMind Academy Kft.</p>
            <p><strong>Székhely:</strong> 4030 Debrecen, Balaton utca 110.</p>
            <p><strong>Cégjegyzékszám:</strong> 09-09-036808</p>
            <p><strong>Adószám:</strong> 32768684-1-09</p>
            <p><strong>Email:</strong> soulmindacademy@gmail.com</p>
            <p><strong>Telefon:</strong> +36 30 478 5623</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">2. Kezelt adatok köre és célja</h2>
            
            <h3 className="font-bold text-lg mt-4 mb-2">A. Kapcsolatfelvételi űrlap (Jelentkezés)</h3>
            <p>A weboldalon található jelentkezési űrlap kitöltésekor az alábbi adatokat kezeljük:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>Név</li>
              <li>E-mail cím</li>
              <li>Telefonszám</li>
              <li>Érdeklődés tárgya / Üzenet</li>
            </ul>
            <p><strong>Cél:</strong> Kapcsolatfelvétel az érdeklődővel, tájékoztatás a tréningekről.</p>
            <p><strong>Jogalap:</strong> Az érintett önkéntes hozzájárulása (GDPR 6. cikk (1) bekezdés a) pont), illetve szerződéskötést megelőző lépések (b) pont).</p>

            <h3 className="font-bold text-lg mt-4 mb-2">B. Technikai adatok és Sütik (Cookie-k)</h3>
            <p>A weboldal <strong>nem használ</strong> marketing célú, harmadik féltől származó követő sütiket (pl. Facebook Pixel, Google Analytics).</p>
            <p>Kizárólag a működéshez elengedhetetlenül szükséges technikai tárolókat alkalmazunk:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li><strong>Munkamenet sütik (Session cookies):</strong> Az adminisztrációs felületre való bejelentkezéshez szükségesek (Supabase Auth).</li>
              <li><strong>Biztonsági azonosító (Device ID):</strong> Az adminisztrátori felület védelme érdekében a böngésző helyi tárolójában (LocalStorage) rögzítünk egy véletlenszerű azonosítót (`soulmind_device_id`), amely segít megelőzni a jelszófeltörési kísérleteket. Ez az adat nem alkalmas a látogatók személyes azonosítására, kizárólag biztonsági célt szolgál (Jogos érdek, GDPR 6. cikk (1) f) pont).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">3. Adatfeldolgozók (Tárhely és Technológia)</h2>
            <p>Az adatok biztonságos tárolása érdekében az alábbi szolgáltatókat vesszük igénybe:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Cloudflare, Inc.</strong> (Frontend kiszolgálás és biztonság)<br/>
                Székhely: USA. A Cloudflare a GDPR előírásainak megfelelően működik, biztosítva az adatok védelmét.
              </li>
              <li>
                <strong>Supabase, Inc.</strong> (Adatbázis és háttérszolgáltatás)<br/>
                Adatközpont helye: <strong>West EU (Írország)</strong>. Az adatok az Európai Unión belül maradnak.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">4. Az érintettek jogai</h2>
            <p>Ön bármikor jogosult:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tájékoztatást kérni személyes adatai kezeléséről.</li>
              <li>Kérni adatai helyesbítését vagy törlését.</li>
              <li>Tiltakozni az adatkezelés ellen.</li>
            </ul>
            <p className="mt-2">Kérelmét a fenti elérhetőségeink bármelyikén jelezheti. Válaszadási határidő: 30 nap.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">5. Jogorvoslat</h2>
            <p>Panaszával a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH) fordulhat:</p>
            <p>1055 Budapest, Falk Miksa utca 9–11. | Web: <a href="https://naih.hu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">naih.hu</a></p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Adatvedelem;

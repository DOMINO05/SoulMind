import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowRight, X, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const Home = () => {
  const heroImage = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop";
  
  const [sections, setSections] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, , trainRes] = await Promise.all([
          supabase.from('sections').select('*').order('id'),
          supabase.from('section_items').select('*'),
          supabase.from('trainings').select('*')
        ]);
        if (secRes.data) setSections(secRes.data);
        if (trainRes.data) setTrainings(trainRes.data);
      } catch (error) {
        console.error("Hiba:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // const getItems = (secId) => sectionItems.filter(i => i.section_id === secId);

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'letoltes.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-light text-primary font-serif text-xl animate-pulse">Betöltés...</div>;

  const heroContainerClass = "relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up pt-24";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SoulMind Academy",
    "url": "https://www.soulmindacademy.eu",
    "logo": "https://www.soulmindacademy.eu/logo.svg",
    "description": "Vezetői tréningek, önismereti csoportok és pszichológiai tanácsadás vezetőknek.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Debrecen",
      "addressCountry": "HU"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "areaServed": "HU",
      "availableLanguage": ["Hungarian"]
    },
    "sameAs": [] // Add social media links if available
  };

  return (
    <div className="bg-light min-h-screen animate-fade-in transition-colors duration-500">
      <SEO 
        title="Tudatos Vezetés & Önismeret"
        description="SoulMind Academy: Vezetői tréning, önismereti csoportok és munkahelyi stresszkezelés. Fejlessze vezetői kompetenciáit és előzze meg a kiégést."
        keywords="vezetői tréning, önismeret, burnout kezelés, asszertív kommunikáció, Debrecen, pszichológus vezetőknek"
        schema={schema}
      />
      
      {/* HERO SECTION */}
      <header className="relative min-h-[95vh] overflow-hidden flex items-center justify-center py-20">
         <div className="absolute inset-0 z-0">
           <img 
             src={heroImage} 
             alt="Tudatos Vezetés és Önismeret Háttér" 
             fetchPriority="high"
             width="2032"
             height="1355"
             className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-110"
           />
           <div className="absolute inset-0 bg-black/80" />
         </div>

        <div className={heroContainerClass}>
          <div>
            <h1 className="uppercase tracking-[0.2em] text-xl md:text-3xl lg:text-4xl font-bold mb-8 block drop-shadow-md text-white">
              <span className="block mb-2">Tudatos Vezetés &</span>
              <span className="block">Önismeret</span>
            </h1>
            
            <div className="text-base md:text-lg mb-8 font-light leading-relaxed drop-shadow-md text-gray-100 text-left md:text-center space-y-2 max-w-3xl mx-auto mt-10">
              <p>Gyakran előfordul, hogy nehezen boldogulsz a kommunikációs helyzetekben?</p>
              <p>Vezetői ambícióid vannak és szeretnéd biztonságos közegben kipróbálni magad?</p>
              <p>Kezdő vezető vagy és elveszettnek érzed magad?</p>
              <p>Unod már, hogy mindent egyedül kell elvégezned?</p>
            </div>
            
            <div className="mb-8">
               <p className="text-white font-medium text-lg md:text-xl mb-6 max-w-2xl mx-auto">
                 Ha igennel válaszoltál valamelyik kérdésre és szeretnél hatékonyabban működni ezeken a területeken, akkor jelentkezz ingyenes konzultációnkra!
               </p>
            </div>

            <Link 
              to="/jelentkezes" 
              className="inline-flex items-center px-8 py-4 rounded-full transition-all duration-300 shadow-xl font-medium border backdrop-blur-sm bg-primary text-white hover:bg-white hover:text-primary border-primary group"
            >
              Jelentkezem <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {sections
          .filter(section => section.name === 'Tréningek')
          .map((section) => {
            return (
              <section key={section.id} className="py-24 bg-white px-4">
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-16">
                    <h2 className="text-4xl font-serif font-bold text-dark mb-4">{section.name}</h2>
                    <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
                  </div>
                  
                  {trainings.length === 0 ? (
                    <p className="text-center text-gray-500">Jelenleg nincs elérhető tréning.</p>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-8">
                      {trainings.map(train => (
                        <div 
                          key={train.id} 
                          className="relative cursor-pointer overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gray-50 w-full sm:w-[calc(50%-2rem)] lg:w-[calc(33%-2rem)] max-w-md aspect-[4/5] rounded-2xl"
                          onClick={() => setLightboxImg({ src: train.image_path, alt: train.alt_text })}
                        >
                          <img 
                            src={train.image_path} 
                            alt={train.alt_text} 
                            className="w-full h-full object-contain p-2" 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
        })}
      </main>

      {/* Lightbox */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <button className="absolute top-4 right-4 md:top-6 md:right-6 text-white hover:text-primary transition p-2 z-50">
            <X size={32} />
          </button>
          <div className="flex flex-col items-center gap-6 max-h-full w-full max-w-5xl" onClick={e => e.stopPropagation()}>
            <img 
              src={lightboxImg.src} 
              alt={lightboxImg.alt} 
              className="max-h-[70vh] md:max-h-[80vh] rounded shadow-2xl object-contain bg-white animate-fade-in-up" 
            />
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/jelentkezes"
                className="bg-primary text-white px-8 py-3 rounded-full flex items-center gap-2 text-base font-bold hover:bg-white hover:text-primary transition-all duration-300 shadow-lg border border-primary"
              >
                Jelentkezem <ArrowRight size={20} />
              </Link>
              <button 
                onClick={() => downloadImage(lightboxImg.src, lightboxImg.alt)}
                className="bg-white text-dark px-8 py-3 rounded-full flex items-center gap-2 text-base font-bold hover:bg-primary hover:text-white transition-all duration-300 shadow-lg"
              >
                <Download size={20} /> Kép Letöltése
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

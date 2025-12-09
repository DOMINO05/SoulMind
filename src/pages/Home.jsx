import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowRight, X, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const heroImage = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop";
  
  const [sections, setSections] = useState([]);
  const [sectionItems, setSectionItems] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, itemRes, trainRes] = await Promise.all([
          supabase.from('sections').select('*').order('id'),
          supabase.from('section_items').select('*'),
          supabase.from('trainings').select('*')
        ]);
        if (secRes.data) setSections(secRes.data);
        if (itemRes.data) setSectionItems(itemRes.data);
        if (trainRes.data) setTrainings(trainRes.data);
      } catch (error) {
        console.error("Hiba:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getItems = (secId) => sectionItems.filter(i => i.section_id === secId);

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
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-light text-primary font-serif text-xl animate-pulse">Betöltés...</div>;

  const heroContainerClass = "relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up pt-24";

  return (
    <div className="bg-light min-h-screen animate-fade-in transition-colors duration-500">
      
      {/* HERO SECTION */}
      <header className="relative h-[95vh] overflow-hidden flex items-center justify-center">
         <div className="absolute inset-0 z-0">
           <img 
             src={heroImage} 
             alt="Background" 
             className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-110"
           />
           <div className="absolute inset-0 bg-black/80" />
         </div>

        <div className={heroContainerClass}>
          <div>
            <h1 className="uppercase tracking-[0.2em] text-2xl md:text-4xl lg:text-5xl font-bold mb-8 block drop-shadow-md leading-normal text-white">
              Tudatos Vezetés & Önismeret
            </h1>
            
            <p className="text-lg md:text-xl mb-10 font-light leading-relaxed drop-shadow-md text-gray-100">
              Hiteles vezetés pszichológiai alapokon. Fejleszd vezetői kompetenciáidat és önismeretedet szakértőink vezetésével.
            </p>
            
            <Link 
              to="/jelentkezes" 
              className="inline-flex items-center px-8 py-4 rounded-full transition-all duration-300 shadow-xl font-medium border backdrop-blur-sm bg-primary text-white hover:bg-white hover:text-primary border-primary"
            >
              Csatlakozz hozzánk <ArrowRight className="ml-2 w-5 h-5" />
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
            <button 
              onClick={() => downloadImage(lightboxImg.src, lightboxImg.alt)}
              className="bg-white text-dark px-8 py-3 rounded-full flex items-center gap-2 text-base font-bold hover:bg-primary hover:text-white transition-all duration-300 shadow-lg"
            >
              <Download size={20} /> Kép Letöltése
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

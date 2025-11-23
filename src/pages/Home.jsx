import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowRight, Leaf, Heart, Sun, X, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
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

  // Letöltés funkció
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
      console.error("Letöltési hiba:", error);
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-light text-primary font-serif text-xl">Betöltés...</div>;

  return (
    <div className="bg-light min-h-screen">
      {/* Hero Section */}
      <header className="relative h-[95vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=2070&auto=format&fit=crop" 
            alt="Background" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up">
          <span className="text-secondary uppercase tracking-[0.3em] text-sm font-bold mb-4 block">
            Harmony & Balance
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-white font-bold mb-6 leading-tight drop-shadow-lg">
            SoulMind Academy
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Fedezd fel a belső békédet és építsd fel a testi-lelki egyensúlyodat szakértőink segítségével.
          </p>
          <Link 
            to="/kerdoiv" 
            className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-full hover:bg-white hover:text-primary transition-all transform hover:scale-105 shadow-xl font-medium border border-primary"
          >
            Csatlakozz hozzánk <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </header>

      <main>
        {sections.map((section, index) => {
          const items = getItems(section.id);
          const isEven = index % 2 === 0;

          if (section.name === 'Tréningek') {
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {trainings.map(train => (
                        <div 
                          key={train.id} 
                          className="relative aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
                          onClick={() => setLightboxImg({ src: train.image_path, alt: train.alt_text })}
                        >
                          <img 
                            src={train.image_path} 
                            alt={train.alt_text} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          return (
            <section key={section.id} className={`py-24 px-4 ${isEven ? 'bg-light' : 'bg-white'}`}>
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-start gap-12">
                  <div className="md:w-1/3 relative md:sticky md:top-28 mb-8 md:mb-0">
                    <h2 className="text-4xl font-serif font-bold text-dark mb-6 relative inline-block">
                      {section.name}
                      <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-primary rounded-full"></span>
                    </h2>
                    <div className="text-primary opacity-80 mt-4 animate-bounce-slow">
                      {index === 0 ? <Leaf size={48} strokeWidth={1} /> : index === 1 ? <Heart size={48} strokeWidth={1} /> : <Sun size={48} strokeWidth={1} />}
                    </div>
                  </div>
                  
                  <div className="md:w-2/3 grid gap-6">
                    {items.map(item => (
                      <div key={item.id} className="bg-white/60 p-8 rounded-xl border-l-4 border-primary shadow-sm hover:shadow-lg transition-all duration-300 hover:bg-white hover:-translate-y-1">
                        <p className="text-gray-700 text-lg leading-relaxed font-light">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
              className="max-h-[70vh] md:max-h-[80vh] rounded shadow-2xl object-contain animate-fade-in-up" 
            />
            
            <button 
              onClick={() => downloadImage(lightboxImg.src, lightboxImg.alt)}
              className="bg-white text-dark px-8 py-3 rounded-full flex items-center gap-2 text-base font-bold hover:bg-primary hover:text-white transition-all duration-300 shadow-lg hover:shadow-primary/50 active:scale-95"
            >
              <Download size={20} /> 
              Kép Letöltése
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
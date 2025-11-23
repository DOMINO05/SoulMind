import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowRight, Leaf, Heart, Sun, X, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Home = () => {
  const { activeTheme } = useTheme();
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

  // Stílus változók
  const isCorporate = activeTheme.type === 'corporate';
  
  const heroContainerClass = isCorporate
    ? "max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center h-full relative z-10"
    : "relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up";

  const getSectionLayout = (index) => {
    if (activeTheme.type === 'corporate') return 'grid md:grid-cols-3 gap-8';
    return 'flex flex-col md:flex-row items-start gap-12'; 
  };

  return (
    <div className="bg-light min-h-screen animate-fade-in transition-colors duration-500">
      
      {/* HERO SECTION */}
      <header className={`relative h-[95vh] overflow-hidden flex items-center ${isCorporate ? 'bg-light' : 'justify-center'}`}>
        
        {isCorporate ? (
           // 2-es Stílus (Üzleti)
           <>
             {/* DESKTOP: Jobb oldali kép */}
             <div className="hidden md:block absolute right-0 top-0 w-1/2 h-full clip-path-slant">
                <img src={activeTheme.heroImage} className="w-full h-full object-cover" alt="Hero" />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
             </div>
             
             {/* MOBIL: Háttérkép erős fehér fedéssel */}
             <div className="md:hidden absolute inset-0 z-0">
                <img src={activeTheme.heroImage} className="w-full h-full object-cover" alt="Hero" />
                <div className="absolute inset-0 bg-white/90"></div> {/* Erős fehér fedés, hogy a sötét szöveg olvasható legyen */}
             </div>
           </>
        ) : (
           // 1-es és 3-as Stílus (Normál)
           <div className="absolute inset-0 z-0">
             <img 
               src={activeTheme.heroImage} 
               alt="Background" 
               key={activeTheme.heroImage}
               className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-110"
             />
             <div className="absolute inset-0 bg-black/80" />
           </div>
        )}

        <div className={heroContainerClass}>
          <div className={isCorporate ? "z-10 py-20" : ""}>
            {/* KONTRASZT JAVÍTÁS: drop-shadow-md hozzáadva */}
            <span className={`uppercase tracking-[0.3em] text-sm font-bold mb-4 block drop-shadow-md ${isCorporate ? 'text-primary' : 'text-secondary'}`}>
              {activeTheme.type === 'corporate' ? 'Professzionális Megoldások' : 'Tudatos Vezetés & Önismeret'}
            </span>
            
            {/* KONTRASZT JAVÍTÁS: drop-shadow-lg hozzáadva a címhez */}
            <h1 className={`text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight drop-shadow-lg ${isCorporate ? 'text-dark' : 'text-white'}`}>
              SoulMind Academy
            </h1>
            
            {/* KONTRASZT JAVÍTÁS: szöveg szín és árnyék */}
            <p className={`text-lg md:text-xl mb-10 font-light leading-relaxed drop-shadow-md ${isCorporate ? 'text-gray-800' : 'text-gray-100'}`}>
              Hiteles vezetés pszichológiai alapokon. Fejleszd vezetői kompetenciáidat és önismeretedet szakértőink vezetésével.
            </p>
            
            <Link 
              to="/kerdoiv" 
              className={`inline-flex items-center px-8 py-4 rounded-full transition-all duration-300 shadow-xl font-medium border backdrop-blur-sm
                ${isCorporate 
                  ? 'bg-primary text-white hover:bg-dark border-transparent' 
                  : 'bg-primary text-white hover:bg-white hover:text-primary border-primary'
                }
              `}
            >
              Csatlakozz hozzánk <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
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
                    <div className={`grid gap-8 ${activeTheme.type === 'creative' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                      {trainings.map(train => (
                        <div 
                          key={train.id} 
                          className={`
                            relative cursor-pointer overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gray-50
                            ${activeTheme.type === 'corporate' ? 'aspect-square rounded-lg' : 'aspect-[4/5] rounded-2xl'}
                          `}
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
          }

          return (
            <section key={section.id} className={`py-24 px-4 ${isEven ? 'bg-light' : 'bg-white'} transition-colors duration-500`}>
              <div className="max-w-6xl mx-auto">
                
                <div className={activeTheme.type === 'corporate' ? 'block' : 'flex flex-col md:flex-row items-start gap-12'}>
                  
                  <div className={`${activeTheme.type === 'corporate' ? 'text-center mb-12' : 'md:w-1/3 relative md:sticky md:top-28 mb-8 md:mb-0'}`}>
                    <h2 className={`text-4xl font-serif font-bold text-dark mb-6 relative inline-block`}>
                      {section.name}
                      <span className={`absolute -bottom-2 left-0 h-1 bg-primary rounded-full ${isCorporate ? 'w-full left-1/2 -translate-x-1/2' : 'w-1/2'}`}></span>
                    </h2>
                    {!isCorporate && (
                      <div className="text-primary opacity-80 mt-4">
                        {index === 0 ? <Leaf size={48} strokeWidth={1} /> : index === 1 ? <Heart size={48} strokeWidth={1} /> : <Sun size={48} strokeWidth={1} />}
                      </div>
                    )}
                  </div>
                  
                  <div className={`${activeTheme.type === 'corporate' ? getSectionLayout(index) : 'md:w-2/3 grid gap-6'}`}>
                    {items.map(item => (
                      <div key={item.id} className={`
                        p-8 border-l-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1
                        ${isCorporate 
                          ? 'bg-white border-t-4 border-l-0 border-primary text-center rounded-lg' 
                          : 'bg-white/60 border-primary hover:bg-white'
                        }
                        rounded-xl
                      `}>
                        <p className="text-lg leading-relaxed font-light text-gray-700">{item.content}</p>
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
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Heart, Sun } from 'lucide-react';

const Services = () => {
  const [sections, setSections] = useState([]);
  const [sectionItems, setSectionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, itemRes] = await Promise.all([
          supabase.from('sections').select('*').order('id'),
          supabase.from('section_items').select('*')
        ]);
        if (secRes.data) setSections(secRes.data);
        if (itemRes.data) setSectionItems(itemRes.data);
      } catch (error) {
        console.error("Hiba:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getItems = (secId) => sectionItems.filter(i => i.section_id === secId);

  // Sections to show on this page
  const allowedSections = [
    'Műhelyek', 
    'Előadások', 
    'Csoportfoglalkozások', 
    'Pszichológusi tevékenység'
  ];

  const getSectionLayout = (index) => {
    // Keeping the original creative layout logic
    return 'flex flex-col md:flex-row items-start gap-12'; 
  };

  const ctaTexts = ["Jelentkezem", "Érdekel", "Csatlakozom", "Részletek"];

  if (loading) return <div className="h-screen flex items-center justify-center bg-light text-primary font-serif text-xl animate-pulse">Betöltés...</div>;

  return (
    <div className="bg-light min-h-screen animate-fade-in transition-colors duration-500 pt-24">
      <div className="max-w-7xl mx-auto px-4 mb-16 mt-20 text-center">
        <h1 className="text-4xl font-serif font-bold text-dark mb-6">Szolgáltatásaink</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Fedezd fel kínálatunkat, melyek célja a tudatos fejlődés és a mentális jólét támogatása.
        </p>
      </div>

      <main>
        {sections
          .filter(section => allowedSections.includes(section.name))
          .map((section, index) => {
          const items = getItems(section.id);
          const isEven = index % 2 === 0;

          return (
            <section key={section.id} className={`py-24 px-4 ${isEven ? 'bg-warm-light' : 'bg-white'} transition-colors duration-500`}>
              <div className="max-w-6xl mx-auto">
                
                <div className="flex flex-col md:flex-row items-start gap-12">
                  
                  <div className="md:w-1/3 relative md:sticky md:top-28 mb-8 md:mb-0">
                    <h2 className="text-4xl font-serif font-bold text-dark mb-6 relative inline-block">
                      {section.name}
                      <span className="absolute -bottom-2 left-0 h-1 bg-primary rounded-full w-1/2"></span>
                    </h2>
                    <div className="text-primary opacity-80 mt-4">
                      {index % 3 === 0 ? <Leaf size={48} strokeWidth={1} /> : index % 3 === 1 ? <Heart size={48} strokeWidth={1} /> : <Sun size={48} strokeWidth={1} />}
                    </div>
                  </div>
                  
                  <div className="md:w-2/3 grid gap-6">
                    {items.map(item => (
                      <div key={item.id} className="p-8 border-l-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/60 border-primary hover:bg-white rounded-xl">
                        <p className="text-xl leading-relaxed font-medium text-gray-800">{item.content}</p>
                      </div>
                    ))}
                    
                    <div className="text-center md:text-left pt-4">
                      <Link 
                        to="/jelentkezes" 
                        className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-dark transition-all duration-300 shadow-md hover:shadow-lg text-sm tracking-wide group"
                      >
                        {ctaTexts[index % ctaTexts.length]} <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};

export default Services;

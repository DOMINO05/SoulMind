import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Heart, Sun, ChevronDown, ChevronUp } from 'lucide-react';
import SEO from '../components/SEO';

const Services = () => {
  const [sections, setSections] = useState([]);
  const [sectionItems, setSectionItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [loading, setLoading] = useState(true);

  const toggleItem = (itemId, hasDetails) => {
    if (!hasDetails) return;
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, itemRes] = await Promise.all([
          supabase.from('sections').select('*').order('id', { ascending: true }),
          supabase.from('section_items').select('*').order('id', { ascending: true })
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

  // Sections to exclude (Tréningek is on Home, Kötetek is on Volumes/Home)
  const excludedSections = [
    'Tréningek',
    'A témákhoz kapcsolódó kötetek'
  ];


  const ctaTexts = ["Jelentkezem", "Érdekel", "Csatlakozom", "Részletek"];

  if (loading) return <div className="h-screen flex items-center justify-center bg-light text-primary font-serif text-xl animate-pulse">Betöltés...</div>;

  return (
    <div className="bg-light min-h-screen animate-fade-in transition-colors duration-500 pt-24">
      <SEO 
        title="Vezetői Tréningek & Szolgáltatások"
        description="Asszertív kommunikáció, stresszkezelés, vezetői coaching és szervezetfejlesztés. Professzionális megoldások vezetőknek és cégeknek."
        keywords="asszertív kommunikáció tréning, stresszkezelés tréning, vezetői coaching, szervezetfejlesztés, pszichológiai tanácsadás"
      />
      <div className="max-w-7xl mx-auto px-4 mb-16 mt-10 text-center">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-dark mb-6">Szolgáltatásaink: Vezetői Tréning és Tanácsadás</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Fedezd fel kínálatunkat, melyek célja a tudatos fejlődés és a mentális jólét támogatása.
        </p>
      </div>

      <main>
        {sections
          .filter(section => !excludedSections.includes(section.name))
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
                    {items.map(item => {
                      const hasDetails = !!item.details;
                      const isExpanded = expandedItems[item.id];
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`p-6 border-l-4 shadow-sm transition-all duration-300 bg-white/60 border-primary hover:bg-white rounded-xl ${hasDetails ? 'cursor-pointer hover:shadow-lg' : ''}`}
                          onClick={() => toggleItem(item.id, hasDetails)}
                        >
                          <div className="flex justify-between items-center gap-4">
                            <p className="text-xl leading-relaxed font-medium text-gray-800">{item.content}</p>
                            {hasDetails && (
                              <div className="text-primary flex-shrink-0">
                                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                              </div>
                            )}
                          </div>
                          
                          {/* Dropdown Content */}
                          <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                              <div className="pt-2 text-gray-600 border-t border-gray-100">
                                <p className="whitespace-pre-wrap">{item.details}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
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

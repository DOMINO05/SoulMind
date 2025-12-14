import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Book } from 'lucide-react';
import SEO from '../components/SEO';

const Volumes = () => {
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolumes = async () => {
      try {
        const { data, error } = await supabase
          .from('volumes')
          .select('*')
          .order('id');
        
        if (error) throw error;
        if (data) setVolumes(data);
      } catch (error) {
        console.error("Hiba a kötetek betöltésekor:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVolumes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light text-primary font-serif text-xl animate-pulse">
        Betöltés...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pt-24 pb-12 animate-fade-in">
      <SEO 
        title="Szakirodalom & Kötetek"
        description="Ajánlott olvasmányok, saját kiadványok és szakirodalom a tudatos vezetés és önismeret témakörében."
        keywords="pszichológiai szakkönyvek, önismereti könyvek, vezetői szakirodalom, ajánlott irodalom"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 mt-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-dark mb-4">Kötetek és Szakirodalom</h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto font-light">
            A témákhoz kapcsolódó szakirodalom és kiadványok gyűjteménye.
          </p>
        </div>

        {volumes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Book size={48} className="mx-auto mb-4 opacity-20" />
            <p>Jelenleg nincs elérhető kötet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {volumes.map((volume) => {
              const hasLink = !!volume.link;
              const Tag = hasLink ? 'a' : 'div';
              const props = hasLink ? {
                href: volume.link,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full hover:-translate-y-2 cursor-pointer"
              } : {
                className: "bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col h-full"
              };

              return (
                <Tag key={volume.id} {...props}>
                  {/* Image */}
                  <div className="aspect-[5/7] overflow-hidden bg-gray-50 relative group">
                     {volume.image_path ? (
                       <img 
                         src={volume.image_path} 
                         alt={volume.title} 
                         className={`w-full h-full object-cover transition-transform duration-700 ${hasLink ? 'group-hover:scale-105' : ''}`}
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-300">
                         <Book size={64} />
                       </div>
                     )}
                     {hasLink && <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300"></div>}
                  </div>

                  {/* Text */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className={`text-xl font-bold text-dark mb-2 transition-colors ${hasLink ? 'group-hover:text-primary' : ''}`}>
                        {volume.title}
                      </h3>
                    </div>
                    {hasLink && (
                      <div className="mt-4 text-sm font-medium text-primary uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        Megtekintés &rarr;
                      </div>
                    )}
                  </div>
                </Tag>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Volumes;

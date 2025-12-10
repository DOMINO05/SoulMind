import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from 'lucide-react';

const Team = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('id');
        
        if (error) throw error;
        setTeam(data || []);
      } catch (error) {
        console.error("Hiba a munkatársak betöltésekor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-light text-primary font-serif text-xl animate-pulse">Betöltés...</div>;

  return (
    <div className="bg-light min-h-screen animate-fade-in transition-colors duration-500 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-dark mb-6">Munkatársak</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Ismerje meg szakértő csapatunkat, akik elkötelezettek a fejlődés támogatásában.
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-4">
        {team.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <User size={48} className="mx-auto mb-4 opacity-20" />
            <p>Jelenleg nincsenek feltöltött munkatársak.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {team.map((member, index) => {
              const isEven = index % 2 !== 0;
              return (
                <div key={member.id} className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 md:p-10 hover:shadow-xl transition-shadow duration-300">
                  <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                    
                    {/* Image Container */}
                    <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
                      <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg bg-gray-50 relative">
                        {member.image_path ? (
                          <img 
                            src={member.image_path} 
                            alt={member.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <User size={64} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="w-full md:w-2/3 lg:w-3/4">
                      <div className="flex flex-col items-center md:items-start">
                        <h2 className="text-3xl font-serif font-bold text-dark mb-4 text-center md:text-left w-full">{member.name}</h2>
                        <div className="w-16 h-1 bg-primary rounded-full mb-6 mx-auto md:mx-0"></div>
                        <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap text-justify w-full">
                          {member.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Team;

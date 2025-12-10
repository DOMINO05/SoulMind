import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Prices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) console.error('Error fetching prices:', error);
      if (data) setPrices(data);
      setLoading(false);
    };
    fetchPrices();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-xl animate-pulse text-primary">Betöltés...</div>;

  return (
    <div className="min-h-screen bg-light pt-24 pb-12 px-4 animate-fade-in transition-colors duration-500">
       <div className="max-w-4xl mx-auto text-center">
         <h1 className="text-3xl md:text-5xl font-serif font-bold text-dark mb-12">Áraink</h1>
         
         <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
           <div className="p-8 md:p-12">
             <div className="space-y-6">
               {prices.map((price) => (
                 <div key={price.id} className="flex flex-col md:flex-row justify-between items-center p-4 hover:bg-warm-light/30 rounded-lg transition-colors border-b border-gray-100 last:border-0">
                   <h3 className="text-lg md:text-xl font-medium text-gray-800 text-center md:text-left">{price.name}</h3>
                   <span className="text-xl md:text-2xl font-bold text-primary mt-2 md:mt-0 whitespace-nowrap">{price.price}</span>
                 </div>
               ))}
               {prices.length === 0 && <p className="text-gray-500 italic">Jelenleg nincsenek feltöltött árak.</p>}
             </div>
           </div>
         </div>

         <div className="mt-16 mb-8 animate-fade-in-up">
           <p className="text-xl md:text-2xl font-medium text-dark mb-8">
             Jelentkezz ingyenes konzultációnkra!
           </p>
           <Link 
              to="/jelentkezes" 
              className="inline-flex items-center px-8 py-4 rounded-full bg-primary text-white font-bold hover:bg-dark transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
            >
              Jelentkezem <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
         </div>
       </div>
    </div>
  );
};

export default Prices;

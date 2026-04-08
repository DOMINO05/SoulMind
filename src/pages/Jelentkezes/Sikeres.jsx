import React from 'react';
import { Link } from 'react-router-dom';

const SikeresJelentkezes = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl overflow-hidden text-center p-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sikeresen jelentkeztél az ingyenes vezetői konzultációra!
        </h1>
        
        <div className="text-lg text-gray-600 mb-8 space-y-4">
          <p>Köszönjük a jelentkezésedet. Hamarosan egy automatikus visszaigazoló emailt fogsz kapni tőlünk.</p>
          <p>A jelentkezésed jelenleg <span className="font-semibold text-yellow-600">elbírálás alatt áll</span>.</p>
          <p>Amint elfogadásra kerül az időpontod, küldeni fogjuk a részleteket és a megbeszélés linkjét a megadott email címedre.</p>
        </div>

        <Link 
          to="/" 
          className="inline-block bg-red-800 text-white py-3 px-8 rounded-md hover:bg-red-900 transition-colors font-bold"
        >
          Vissza a főoldalra
        </Link>
      </div>
    </div>
  );
};

export default SikeresJelentkezes;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isWeekend, parseISO, startOfDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import { supabase } from '../../lib/supabaseClient';
import { CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

const Jelentkezes = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyType: '',
    biggestChallenge: '',
    bookingDate: null,
    bookingTime: '',
    acceptGdpr: false
  });
  
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [bookedDates, setBookedDates] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Adatok lekérése a Supabase-ből (foglalt időpontok, letiltott napok, heti beosztás, vélemények)
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const [bookingsRes, blockedRes, workingHoursRes, reviewsRes] = await Promise.all([
          supabase.from('consultation_bookings')
            .select('booking_datetime')
            .in('status', ['pending', 'approved'])
            .gte('booking_datetime', new Date().toISOString()),
          supabase.from('blocked_times')
            .select('*')
            .gte('block_date', new Date().toISOString().split('T')[0]),
          supabase.from('working_hours')
            .select('*'),
          supabase.from('reviews')
            .select('*')
            .order('created_at', { ascending: false })
        ]);

        if (bookingsRes.error) throw bookingsRes.error;
        if (blockedRes.error) throw blockedRes.error;
        if (workingHoursRes.error) throw workingHoursRes.error;
        if (reviewsRes.error) throw reviewsRes.error;

        setBookedDates(bookingsRes.data || []);
        setBlockedTimes(blockedRes.data || []);
        setWorkingHours(workingHoursRes.data || []);
        setReviews(reviewsRes.data || []);
      } catch (err) {
        console.error("Hiba a naptár vagy vélemény adatok lekérésekor:", err);
      }
    };
    fetchAvailability();
  }, []);

  const getTimesForDate = (date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday...
    let possibleTimes = [];

    // Dinamikus heti beosztás lekérése az adott napra
    const daySchedule = workingHours.find(w => w.day_of_week === dayOfWeek);
    
    if (daySchedule && daySchedule.is_active && daySchedule.start_time && daySchedule.end_time) {
      const startHour = parseInt(daySchedule.start_time.split(':')[0], 10);
      // Az end_time-nál az utolsó lehetséges sáv kezdete az end_time előtti óra (pl. 20:00-nál az utolsó sáv 19:00)
      const endHour = parseInt(daySchedule.end_time.split(':')[0], 10); 
      
      for (let i = startHour; i < endHour; i++) {
        possibleTimes.push(`${i.toString().padStart(2, '0')}:00`);
      }
    }

    const dateStr = format(date, 'yyyy-MM-dd');

    // Szűrés a letiltott időpontok (blocked_times) alapján
    const dayBlocks = blockedTimes.filter(b => b.block_date === dateStr);
    
    // Ha van egész napos tiltás, nincs elérhető időpont
    if (dayBlocks.some(b => b.is_full_day)) return [];

    let filteredTimes = possibleTimes.filter(time => {
      // Megnézzük, esik-e valamilyen részleges blokkolásba ez az óra
      const isBlocked = dayBlocks.some(b => {
        if (!b.start_time || !b.end_time) return false;
        const blockStart = b.start_time.substring(0, 5);
        const blockEnd = b.end_time.substring(0, 5);
        return time >= blockStart && time <= blockEnd;
      });
      return !isBlocked;
    });

    // Szűrés a már lefoglalt időpontok (consultation_bookings) alapján
    const dayBookings = bookedDates.filter(b => {
      const bDate = new Date(b.booking_datetime);
      return format(bDate, 'yyyy-MM-dd') === dateStr;
    });

    filteredTimes = filteredTimes.filter(time => {
      const isBooked = dayBookings.some(b => {
        const bDate = new Date(b.booking_datetime);
        return format(bDate, 'HH:mm') === time;
      });
      return !isBooked;
    });

    return filteredTimes;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, bookingDate: date, bookingTime: '' });
    setAvailableTimes(getTimesForDate(date));
  };

  const handleTimeSelect = (time) => {
    setFormData({ ...formData, bookingTime: time });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (step === 1) {
      setStep(2);
    } else {
      setIsLoading(true);
      try {
        // Összerakjuk a pontos dátumot: YYYY-MM-DDTHH:mm:ss
        const dateStr = format(formData.bookingDate, 'yyyy-MM-dd');
        const dateTimeStr = `${dateStr}T${formData.bookingTime}:00`;
        const bookingDatetime = new Date(dateTimeStr).toISOString();

        const { error } = await supabase
          .from('consultation_bookings')
          .insert([
            {
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              company_type: formData.companyType,
              biggest_challenge: formData.biggestChallenge,
              booking_datetime: bookingDatetime,
              status: 'pending'
            }
          ]);

        if (error) throw error;
        
        navigate('/jelentkezes/sikeres');
      } catch (err) {
        console.error('Hiba a mentésnél:', err);
        setErrorMsg('Hiba történt a foglalás során. Kérlek, próbáld újra később!');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      // Múltbeli dátumok tiltása
      if (startOfDay(date) < startOfDay(new Date())) return true;

      // Nap tiltása, ha az adatbázis szerint nincs beosztás (is_active = false)
      const dayOfWeek = date.getDay();
      const daySchedule = workingHours.find(w => w.day_of_week === dayOfWeek);
      if (daySchedule && !daySchedule.is_active) return true;
      
      // Fallback: Ha még nem jött le a workingHours, tiltjuk a hétvégét (ne villogjon hibásan)
      if (workingHours.length === 0 && isWeekend(date)) return true;

      // Egész napos admin letiltások
      const dateStr = format(date, 'yyyy-MM-dd');
      const isFullDayBlocked = blockedTimes.some(b => b.block_date === dateStr && b.is_full_day);
      if (isFullDayBlocked) return true;

      // Ha aznapra egyetlen elérhető időpont sincs a foglalások/részleges tiltások miatt
      const available = getTimesForDate(date);
      // Extra védelem, ha elméletileg aktív nap, de nincs egyetlen legenerálható óra se (pl hibás DB beállítás)
      if (available.length === 0) return true;
    }
    return false;
  };

  const scrollToForm = (e) => {
    e.preventDefault();
    document.getElementById('jelentkezes-urlap').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] pt-20">
      
      {/* 1. HERO SECTION */}
      <section className="bg-[#faf8f5] py-16 md:py-24 border-b border-[#eebf63]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            
            {/* SZÖVEGÉSZ (Cím + Szöveg + Gomb) */}
            <div className="order-1 md:order-1 text-center md:text-left flex flex-col justify-center space-y-6 w-full">
              <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.3] md:leading-[1.2] text-dark tracking-normal">
                Szeretnél olyan vezető lenni, aki nem csak irányít, hanem a saját életét is kézben tartja?
              </h1>
              
              {/* Asztali alcím */}
              <p className="hidden md:block text-lg md:text-xl text-gray-600 leading-relaxed md:leading-loose">
                Ha vezetőként - vagy vezetővé válás előtt - folyamatos nyomás alatt működsz, és közben nehéz megtartani a határokat, a fókuszt és az egyensúlyt, az nem véletlen. Az előzetes díjmentes konzultáción segítünk ránézni arra, hol csúszik el most a működésed.
              </p>
              
              {/* Asztali Gomb */}
              <div className="hidden md:block pt-4">
                <button 
                  onClick={scrollToForm}
                  className="inline-block bg-red-800 text-white font-bold text-xl py-4 px-10 rounded-full shadow-lg hover:bg-red-900 hover:scale-105 transition-all duration-300"
                >
                  Jelentkezem
                </button>
              </div>
            </div>
            
            {/* KÉP (mobilon második, asztalon a jobb oldalon) */}
            <div className="order-2 md:order-2 flex justify-center items-center w-full relative mb-4 md:mb-0">
              <img 
                src="/elso.png" 
                alt="A vágyott állapot, szabadság" 
                className="w-full max-w-[320px] md:max-w-[400px] h-auto object-contain rounded-2xl shadow-2xl shadow-[#eebf63]/20"
              />
            </div>

            {/* MOBIL EXTRA: Szöveg és gomb a kép alatt */}
            <div className="order-3 md:hidden text-center flex flex-col items-center space-y-6 w-full">
              <p className="text-lg text-gray-600 leading-relaxed">
                Ha vezetőként - vagy vezetővé válás előtt - folyamatos nyomás alatt működsz, és közben nehéz megtartani a határokat, a fókuszt és az egyensúlyt, az nem véletlen. Az előzetes díjmentes konzultáción segítünk ránézni arra, hol csúszik el most a működésed.
              </p>
              <button 
                onClick={scrollToForm}
                className="inline-block bg-red-800 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg hover:bg-red-900 hover:scale-105 transition-all duration-300 w-full max-w-[300px]"
              >
                Jelentkezem
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PAIN POINTS SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            
            {/* Cím (Mindig legfelül) */}
            <div className="md:col-span-2 text-center mb-8 md:mb-16">
              <h2 className="text-3xl md:text-[2.5rem] font-bold text-dark leading-tight tracking-normal max-w-4xl mx-auto relative inline-block">
                <span className="relative z-10">Ismerős, hogy állandó rajtad a nyomás, a felelősség és közben egyre kevesebb szabadságod marad a saját életedben?</span>
                <span className="absolute bottom-1 left-0 w-full h-4 bg-[#eebf63]/30 -z-10 rounded-full blur-sm"></span>
              </h2>
            </div>
            
            {/* Kép mobilon második */}
            <div className="order-2 md:order-1 flex justify-center items-center w-full">
              <img 
                src="/masodik.png" 
                alt="A stresszes vezető" 
                className="w-full max-w-[320px] md:max-w-[400px] h-auto object-contain rounded-2xl shadow-xl shadow-[#eebf63]/10"
              />
            </div>
            
            {/* Felsorolás mobilon harmadik */}
            <div className="order-3 md:order-2 space-y-6 bg-[#faf8f5] p-6 md:p-8 rounded-2xl border border-[#eebf63]/20 shadow-sm">
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">Sokszor inkább te oldasz meg mindent</strong>, mert nehéz kiadni a feladatokat a kezedből.
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">Kommunikációs helyzetekben</strong> - egy megbeszélés vagy nehéz beszélgetés után - még sokáig visszapörgeted a mondatokat.
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">Stresszhelyzetben kapkodsz</strong> vagy épp lefagysz, és nem tudsz tisztán reagálni.
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">Folyamatos nyomás alatt működsz</strong>, és szinte nincs valódi leállás.
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">A munka-magánélet egyensúly felborul:</strong> akkor is a feladatokon jár az agyad, amikor már pihennél.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOLUTION / DESIRED STATE SECTION */}
      <section className="py-24 bg-[#faf8f5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-[2.5rem] font-bold text-center text-dark mb-14 leading-tight tracking-normal relative inline-block w-full">
            Képzeld el, hogy már nem az az ember vagy, akit csak a feladatok és a felelősség irányítanak
            <div className="w-24 h-1 bg-[#eebf63] mx-auto mt-6 rounded-full"></div>
          </h2>
          
          <div className="bg-white rounded-3xl shadow-xl shadow-[#eebf63]/10 p-8 md:p-12 border border-[#eebf63]/20">
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  Egy olyan vezető vagy, aki rendszert épít és nem roskad össze alatta.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  Kimondod, amit kell, amikor kell (pl. nehéz döntés esetén nem halogatsz).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  Kifejezetten jól működsz nyomás alatt (pl. egy fontos megbeszélésen laza vagy és céltudatos).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  Természetes számodra, hogy megtartod a határaid (pl. családi nyaraláson el tudod engedni a munkát).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  Kézben tartod, amit csinálsz (nyugodtan indul a napod és nyugodtan alszol el).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  Egy olyan emberré válsz, aki egyszerre vezet és él.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. BOOKING FORM SECTION (The Original Form) */}
      <section id="jelentkezes-urlap" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Jelentkezz a vezetői konzultációra (díjmentes)
            </h2>
            <p className="text-xl text-gray-600">
              Legyél egy olyan vezető, aki határozottan reagál nehéz helyzetekben
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-200 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-gray-200">
                <div className="pt-4 md:pt-0">
                  <div className="w-10 h-10 mx-auto bg-red-100 text-red-800 font-bold rounded-full flex items-center justify-center mb-3">1</div>
                  <h4 className="font-bold text-dark">Töltsd ki az űrlapot</h4>
                  <p className="text-sm text-gray-500 mt-1">Néhány rövid válasszal, hogy lássuk hol tartasz most.</p>
                </div>
                <div className="pt-4 md:pt-0">
                  <div className="w-10 h-10 mx-auto bg-red-100 text-red-800 font-bold rounded-full flex items-center justify-center mb-3">2</div>
                  <h4 className="font-bold text-dark">Foglalj időpontot</h4>
                  <p className="text-sm text-gray-500 mt-1">Válaszd ki a számodra megfelelő időpontot a naptárból.</p>
                </div>
                <div className="pt-4 md:pt-0">
                  <div className="w-10 h-10 mx-auto bg-red-100 text-red-800 font-bold rounded-full flex items-center justify-center mb-3">3</div>
                  <h4 className="font-bold text-dark">Várd az emailt</h4>
                  <p className="text-sm text-gray-500 mt-1">A részleteket és a megerősítést emailben fogod megkapni.</p>
                </div>
              </div>
              <div className="mt-6 text-[15px] leading-relaxed text-center text-gray-700 bg-[#fffdf0] p-5 rounded-xl border border-[#eebf63]/40 font-medium shadow-inner">
                * A jelentkezőket szűrjük, ezért kérlek egyértelműen fogalmazz az űrlapon. A beszélgetésen ránézünk a jelenlegi helyzetedre, és megmutatjuk, milyen irányba tudsz elindulni.
                <br/><br/>
                <span className="text-dark font-bold underline decoration-[#eebf63] decoration-2 underline-offset-4">FONTOS:</span> Csak akkor jelentkezz, ha ténylegesen szeretnél fejlődni, elkötelezett vagy és rászánod az időt.
              </div>
            </div>

            <div className="p-8 bg-white">
              <div className="flex items-center justify-center mb-8 max-w-sm mx-auto">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step === 1 ? 'bg-red-800 text-white shadow-md scale-110' : 'bg-green-500 text-white'}`}>1</div>
                <div className={`h-1.5 flex-1 mx-2 rounded-full transition-colors ${step === 2 ? 'bg-red-800' : 'bg-gray-200'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step === 2 ? 'bg-red-800 text-white shadow-md scale-110' : 'bg-gray-200 text-gray-500'}`}>2</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                  <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vezetéknév *</label>
                    <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Keresztnév *</label>
                    <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email cím *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefonszám *</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Milyen típusú cégnél dolgozol? *</label>
                  <input type="text" name="companyType" required value={formData.companyType} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Jelenleg mi a legnagyobb kihívás számodra? *</label>
                  <textarea name="biggestChallenge" rows="4" required value={formData.biggestChallenge} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" name="acceptGdpr" required checked={formData.acceptGdpr} onChange={handleInputChange} className="h-4 w-4 text-red-800 focus:ring-red-800 border-gray-300 rounded" />
                  <label className="ml-2 block text-sm text-gray-900">
                    Elfogadom az <a href="/adatkezelesi_tajekoztato.pdf" target="_blank" className="text-red-800 underline">Adatkezelési tájékoztatóban</a> foglaltakat *
                  </label>
                </div>

                <button type="submit" className="w-full bg-red-800 text-white py-4 px-4 rounded-[8px] hover:bg-red-900 transition-colors font-bold text-lg shadow-lg flex items-center justify-center gap-2 mt-8">
                  Tovább az időpontfoglaláshoz <ChevronRight className="w-5 h-5" />
                </button>
              </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Válassz napot</h3>
                    <Calendar 
                      onChange={handleDateChange} 
                      value={formData.bookingDate}
                      minDate={new Date()}
                      tileDisabled={tileDisabled}
                      className="border-none shadow-sm rounded-lg p-2 w-full"
                      locale="hu-HU"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Válassz időpontot</h3>
                    {formData.bookingDate ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableTimes.map((time) => {
                          const hour = parseInt(time.split(':')[0], 10);
                          const nextHour = `${(hour + 1).toString().padStart(2, '0')}:00`;
                          const timeRange = `${time} - ${nextHour}`;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => handleTimeSelect(time)}
                              className={`p-3 text-center border rounded-md transition-colors ${
                                formData.bookingTime === time 
                                  ? 'bg-red-800 text-white border-red-800' 
                                  : 'border-gray-300 hover:border-red-800 hover:text-red-800'
                              }`}
                            >
                              {timeRange}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Kérlek, előbb válassz egy napot a naptárban.</p>
                    )}
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-md">
                    {errorMsg}
                  </div>
                )}

                    <div className="flex gap-4 pt-8 border-t border-gray-200">
                      <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-200 text-gray-800 py-3 px-4 rounded-[8px] hover:bg-gray-300 transition-colors font-bold disabled:opacity-50" disabled={isLoading}>
                        Vissza
                      </button>
                      <button 
                        type="submit" 
                        disabled={!formData.bookingDate || !formData.bookingTime || isLoading}
                        className="w-2/3 bg-red-800 text-white py-3 px-4 rounded-[8px] hover:bg-red-900 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                      >
                        {isLoading ? (
                          <span className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                        ) : 'Jelentkezés véglegesítése'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS SECTION */}
      <section className="py-24 bg-dark text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-[#eebf63] to-red-900 opacity-50"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[2.5rem] font-bold mb-6 leading-tight tracking-normal text-white">
              Nem a nyomás irányít, hanem képes leszel stabilan reagálni a helyzetekben
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light">
              Hogyan tudsz valóban stabil, szabad vezetővé válni a munkában anélkül, hogy közben kimerülnél?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-[#eebf63]/70 hover:shadow-lg hover:shadow-[#eebf63]/10 transition-all duration-300 group">
              <div className="w-12 h-1 bg-[#eebf63] mb-6 rounded-full group-hover:w-16 transition-all duration-300"></div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Tiszta vezetői működés</h3>
              <p className="text-gray-400 leading-relaxed">Átláthatóbbá válik, hogyan kommunikálsz, döntesz és vezetsz a mindennapokban.</p>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-[#eebf63]/70 hover:shadow-lg hover:shadow-[#eebf63]/10 transition-all duration-300 group">
              <div className="w-12 h-1 bg-[#eebf63] mb-6 rounded-full group-hover:w-16 transition-all duration-300"></div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Határozott keretek</h3>
              <p className="text-gray-400 leading-relaxed">Megtanulod megtartani a határaidat anélkül, hogy folyamatos belső feszültséget éreznél.</p>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-[#eebf63]/70 hover:shadow-lg hover:shadow-[#eebf63]/10 transition-all duration-300 group">
              <div className="w-12 h-1 bg-[#eebf63] mb-6 rounded-full group-hover:w-16 transition-all duration-300"></div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Delegálás</h3>
              <p className="text-gray-400 leading-relaxed">Nem mindent egyedül viszel és oldasz meg, így végre felszabadul a kapacitásod.</p>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-[#eebf63]/70 hover:shadow-lg hover:shadow-[#eebf63]/10 transition-all duration-300 group">
              <div className="w-12 h-1 bg-[#eebf63] mb-6 rounded-full group-hover:w-16 transition-all duration-300"></div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Egyensúly</h3>
              <p className="text-gray-400 leading-relaxed">A vezetői szereped stabilizálása mellett a saját magánéleted is visszakerül a helyére.</p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <button 
              onClick={scrollToForm}
              className="inline-block bg-red-800 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg hover:bg-red-700 hover:scale-105 transition-transform duration-300"
            >
              Jelentkezem a konzultációra
            </button>
          </div>
        </div>
      </section>

      {/* 6. ABOUT (RÓLAM) SECTION */}
      <section className="py-24 bg-[#faf8f5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white rounded-3xl p-8 md:p-12 lg:p-16 border border-[#eebf63]/20 shadow-2xl shadow-[#eebf63]/5 flex flex-col md:flex-row gap-12 md:gap-20 items-center">
            
            {/* KÉP és NÉV JOBB OLDALON (mobilon első lesz) */}
            <div className="w-full md:w-[40%] flex-shrink-0 flex flex-col items-center order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-dark mb-6 tracking-normal text-center w-full">Dr. Polonyi Tünde</h2>
              <div className="w-full max-w-[340px] rounded-3xl border-8 border-[#faf8f5] shadow-xl overflow-hidden bg-white">
                <img 
                  src="/Polonyi_Tünde.jpg" 
                  alt="Dr. Polonyi Tünde" 
                  className="w-full h-auto object-contain hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = '<div class="w-full h-96 flex items-center justify-center text-gray-400 text-center px-4 bg-gray-100 font-medium">A /Polonyi_Tünde.jpg fájl nem található.</div>';
                  }}
                />
              </div>
            </div>

            {/* SZÖVEG BAL OLDALON (mobilon második lesz) */}
            <div className="flex-1 space-y-8 order-2 md:order-1 pt-4 md:pt-16">
              <p className="text-lg md:text-xl text-gray-700 leading-loose">
                Olyan gyakorlati eszközöket adok át, amelyek növelik a vezetői hatékonyságot, fejlesztik a kommunikációt és az együttműködést, valamint támogatják a stresszkezelést és a rezilienciát.
              </p>
              <p className="text-lg md:text-xl text-dark font-medium leading-loose">
                Célom, hogy pszichológusként segítsek megoldani a legnehezebb vezetői kihívásokat. A leghatékonyabb fegyverem az a tudás, amely lehetővé teszi a kiégés megelőzését és a mentális jóllét fejlesztését.
              </p>
              
              <div className="bg-[#fffdf0] p-8 rounded-2xl border-l-4 border-[#eebf63] shadow-sm relative mt-10">
                <span className="absolute -top-6 -left-2 text-6xl text-[#eebf63] opacity-30 font-serif">"</span>
                <p className="text-lg md:text-xl text-gray-800 italic leading-relaxed font-serif relative z-10">
                  Szakmai hitvallásom, hogy a jó vezető önmagát ismeri a legjobban – és e tudást tudatosan használja saját csapata emberséges, lendületes és eredményes támogatására.
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION (Only visible if there are review images uploaded) */}
      {reviews && reviews.length > 0 && (
        <section className="py-24 bg-white border-t border-[#eebf63]/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-[2.5rem] font-bold text-center text-dark mb-16 leading-tight tracking-normal relative inline-block w-full">
              Ügyfélvélemények
              <div className="w-16 h-1 bg-[#eebf63] mx-auto mt-6 rounded-full"></div>
            </h2>
            
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
              {reviews.map((rev) => (
                <div key={rev.id} className="break-inside-avoid shadow-lg rounded-2xl overflow-hidden border border-gray-200 bg-white">
                  <img 
                    src={rev.image_path} 
                    alt={rev.alt_text || "Ügyfélvélemény"} 
                    className="w-full h-auto object-contain pointer-events-none"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. FINAL CTA SECTION */}
      <section className="py-24 md:py-32 bg-[#faf8f5] text-center border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-extrabold text-dark mb-10 leading-[1.3] tracking-normal">
            Jelentkezz a vezetői konzultációra
          </h2>
          <button 
            onClick={scrollToForm}
            className="inline-block bg-red-800 text-white font-bold text-xl md:text-2xl py-5 px-10 rounded-full shadow-2xl hover:bg-red-900 hover:scale-105 transition-all duration-300"
          >
            Jelentkezem
          </button>
        </div>
      </section>

    </div>
  );
};

export default Jelentkezes;
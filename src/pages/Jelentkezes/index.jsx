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

  // Adatok lekérése a Supabase-ből (foglalt időpontok, letiltott napok, heti beosztás)
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const [bookingsRes, blockedRes, workingHoursRes] = await Promise.all([
          supabase.from('consultation_bookings')
            .select('booking_datetime')
            .in('status', ['pending', 'approved'])
            .gte('booking_datetime', new Date().toISOString()),
          supabase.from('blocked_times')
            .select('*')
            .gte('block_date', new Date().toISOString().split('T')[0]),
          supabase.from('working_hours')
            .select('*')
        ]);

        if (bookingsRes.error) throw bookingsRes.error;
        if (blockedRes.error) throw blockedRes.error;
        if (workingHoursRes.error) throw workingHoursRes.error;

        setBookedDates(bookingsRes.data || []);
        setBlockedTimes(blockedRes.data || []);
        setWorkingHours(workingHoursRes.data || []);
      } catch (err) {
        console.error("Hiba a naptár adatok lekérésekor:", err);
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
    <div className="min-h-screen bg-gray-50 pt-20">
      
      {/* 1. HERO SECTION */}
      <section className="bg-red-800 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
                Miért csúszik ki a kezedből a vezetői szerep, miközben pontosan érzed, hogy több van benned?
              </h1>
              <p className="text-lg md:text-xl opacity-90 leading-relaxed">
                Ha vezetőként (vagy vezetővé válás előtt) folyamatos nyomás alatt működsz, és közben nehéz megtartani a határokat, a fókuszt és az egyensúlyt, az nem véletlen. Az előzetes díjmentes konzultáción segítünk ránézni arra, hol csúszik el most a működésed – és hogyan tudsz valóban stabil, szabad vezetővé válni a munkában és a magánéletben is.
              </p>
              <button 
                onClick={scrollToForm}
                className="inline-block bg-white text-red-900 font-bold text-lg md:text-xl py-4 px-8 rounded-full shadow-xl hover:bg-gray-100 hover:scale-105 transition-transform duration-300"
              >
                Jelentkezem a konzultációra
              </button>
            </div>
            <div className="hidden md:block bg-red-900/40 rounded-2xl h-80 w-full flex items-center justify-center border-4 border-red-700/50 shadow-2xl relative overflow-hidden">
              {/* IMAGE PLACEHOLDER (Vágyott állapot) */}
              <span className="text-red-300 font-medium">Kép helye: A vágyott állapot, szabadság</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PAIN POINTS SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-dark mb-16 max-w-3xl mx-auto">
            Ismerős, hogy állandó rajtad a nyomás, a felelősség és közben egyre kevesebb szabadságod marad a saját életedben?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-100 rounded-2xl h-96 w-full flex items-center justify-center border border-gray-200 shadow-inner relative overflow-hidden">
              {/* IMAGE PLACEHOLDER (Stresszes vezető) */}
              <span className="text-gray-400 font-medium px-6 text-center">Kép helye: A stresszes vezető (pl. vasárnapi ebéd közben is a munkára gondol)</span>
            </div>
            
            <div className="space-y-6">
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">Sokszor inkább te oldasz meg mindent</strong>, mert nehéz kiadni a feladatokat a kezedből (vezetőként vagy egyre több felelősséget vállalva érzed, hogy rajtad áll vagy bukik minden).
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">Kommunikációs helyzetekben</strong> utólag már pontosan tudod, mit kellett volna mondani (egy megbeszélés vagy nehéz beszélgetés után még sokáig visszapörgeted a mondatokat).
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">Stresszhelyzetben kapkodsz</strong> vagy épp lefagysz, és nem tudsz tisztán reagálni (gyors döntéseknél bizonytalan vagy, vagy halogatod őket).
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">Folyamatos nyomás alatt működsz</strong>, és szinte nincs valódi leállás (akkor is a feladatokon jár az agyad, amikor már pihennél).
                  </p>
                </li>
                <li className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 text-lg leading-relaxed">
                    <strong className="text-dark">Az egyensúly felborul:</strong> A munka és a magánélet között egyre inkább felborul az egyensúly (a feltöltődés háttérbe szorul, miközben nő benned a feszültség).
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOLUTION / DESIRED STATE SECTION */}
      <section className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-dark mb-12">
            Képzeld el, hogy már nem az az ember vagy, akit a feladatok és a felelősség irányítanak
          </h2>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  <strong className="text-dark">Nem te tartasz össze mindent görcsösen</strong>, hanem egy olyan vezető vagy, aki rendszert épít és nem roskad alatta (nem rajtad múlik minden apró részlet).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  <strong className="text-dark">Nem bizonytalanodsz el</strong> helyzetekben, hanem kimondod, amit kell, amikor kell (nem utólag rakod össze, mit kellett volna mondani).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  <strong className="text-dark">Nem visz el a nyomás</strong>, hanem kifejezetten jól működsz benne (nem kapkodsz, hanem irányítasz).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  <strong className="text-dark">Nem csúsznak szét a határaid</strong>, mert természetes számodra, hogy megtartod őket (nem alkalmazkodsz túl, és nem égsz ki közben).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  <strong className="text-dark">Nem a túlélésről szól a napod</strong>, hanem arról, hogy kézben tartod, amit csinálsz (nem sodródsz a feladatokkal).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 text-lg leading-relaxed">
                  <strong className="text-dark">Egy olyan emberré válsz, aki egyszerre vezet és él</strong> (nem kell feláldoznod a saját életed ahhoz, hogy helytállj).
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
              Jelentkezz az ingyenes konzultációra
            </h2>
            <p className="text-xl text-gray-600">
              Legyél egy olyan vezető, aki nem csak irányít, hanem a saját életét is kézben tartja.
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
              <div className="mt-6 text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 font-medium">
                * A jelentkezőket szűrjük, ezért kérlek egyértelműen fogalmazz az űrlapon. A beszélgetésen ránézünk a jelenlegi helyzetedre, és megmutatjuk, milyen irányba tudsz elindulni.
                <br/><br/>
                <strong>FONTOS:</strong> Csak akkor jelentkezz, ha ténylegesen szeretnél fejlődni vezetőként, elkötelezett vagy és rászánod az időt.
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
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nem a nyomás irányít, hanem képes leszel stabilan reagálni a helyzetekben
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Hogyan tudsz határozottan működni anélkül, hogy közben kimerülnél?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-red-500 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">Tiszta vezetői működés</h3>
              <p className="text-gray-400">Átláthatóbbá válik, hogyan kommunikálsz, döntesz és vezetsz a mindennapokban.</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-red-500 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">Határozott keretek</h3>
              <p className="text-gray-400">Megtanulod megtartani a határaidat anélkül, hogy folyamatos belső feszültséget éreznél.</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-red-500 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">Delegálás</h3>
              <p className="text-gray-400">Nem mindent egyedül viszel és oldasz meg, így végre felszabadul a kapacitásod.</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-red-500 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">Egyensúly</h3>
              <p className="text-gray-400">A vezetői szereped stabilizálása mellett a saját magánéleted is visszakerül a helyére.</p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <button 
              onClick={scrollToForm}
              className="inline-block bg-red-600 text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg hover:bg-red-700 hover:scale-105 transition-transform duration-300"
            >
              Jelentkezem a konzultációra
            </button>
          </div>
        </div>
      </section>

      {/* 6. ABOUT (RÓLAM) SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-12 items-center">
            
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-dark mb-6 border-b-4 border-red-800 pb-4 inline-block">Dr. Polonyi Tünde</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Olyan gyakorlati eszközöket adok át, amelyek növelik a vezetői hatékonyságot, fejlesztik a kommunikációt és az együttműködést, valamint támogatják a stresszkezelést és a rezilienciát.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                Célom, hogy pszichológusként segítsek megoldani a legnehezebb vezetői kihívásokat. A leghatékonyabb fegyverem az a tudás, amely lehetővé teszi a kiégés megelőzését és a mentális jóllét fejlesztését.
              </p>
              <div className="bg-white p-6 rounded-xl border-l-4 border-red-800 shadow-sm mt-8">
                <p className="text-gray-800 italic">
                  "Szakmai hitvallásom, hogy a jó vezető önmagát ismeri a legjobban – és e tudást tudatosan használja saját csapata emberséges, lendületes és eredményes támogatására."
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 flex-shrink-0 flex justify-center">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-white shadow-xl overflow-hidden bg-gray-200">
                <img 
                  src="/Polonyi_Tünde.jpg" 
                  alt="Dr. Polonyi Tünde" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-center px-4 bg-gray-200">A /Polonyi_Tünde.jpg fájl nem található a public mappában.</div>';
                  }}
                />
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA SECTION */}
      <section className="py-24 bg-gray-100 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-dark mb-8 leading-tight">
            Jelentkezz a konzultációra, hogy egy olyan vezetővé válj, aki nem csak irányít, hanem szabadon is él közben.
          </h2>
          <button 
            onClick={scrollToForm}
            className="inline-block bg-red-800 text-white font-bold text-xl md:text-2xl py-5 px-10 rounded-full shadow-2xl hover:bg-red-900 hover:scale-105 transition-all duration-300"
          >
            Jelentkezem a konzultációra
          </button>
        </div>
      </section>

    </div>
  );
};

export default Jelentkezes;
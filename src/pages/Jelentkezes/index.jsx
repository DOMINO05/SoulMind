import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isWeekend, parseISO, startOfDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import { supabase } from '../../lib/supabaseClient';

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden mt-10">
        {/* Header/Hero Section */}
        <div className="bg-red-800 px-8 py-12 text-white text-center">
          <h1 className="text-3xl font-bold mb-4">
            Miért csúszik ki a kezedből a vezetői szerep, miközben pontosan érzed, hogy több van benned?
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Az előzetes díjmentes konzultáción Dr. Polonyi Tünde segít ránézni arra, hol csúszik el most a működésed és hogyan tudsz valóban stabil, szabad vezetővé válni a munkában és a magánéletben is.
          </p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Jelentkezem a konzultációra</h2>
            <div className="flex items-center mb-8">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-red-800 text-white' : 'bg-green-500 text-white'}`}>1</div>
              <div className={`h-1 flex-1 mx-2 ${step === 2 ? 'bg-red-800' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-red-800 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
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

                <button type="submit" className="w-full bg-red-800 text-white py-3 px-4 rounded-md hover:bg-red-900 transition-colors font-bold text-lg">
                  Tovább az időpontfoglaláshoz
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
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

                <div className="flex gap-4 pt-6 border-t">
                  <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-bold disabled:opacity-50" disabled={isLoading}>
                    Vissza
                  </button>
                  <button 
                    type="submit" 
                    disabled={!formData.bookingDate || !formData.bookingTime || isLoading}
                    className="w-2/3 bg-red-800 text-white py-3 px-4 rounded-md hover:bg-red-900 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
  );
};

export default Jelentkezes;
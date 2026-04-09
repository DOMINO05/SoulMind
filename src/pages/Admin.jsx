import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trash2, Plus, Upload, Image as ImageIcon, FileText, Users, Edit2, Check, X, Phone, Mail, MessageSquare, Book, Link as LinkIcon, LogOut, User, DollarSign, ArrowUp, ArrowDown, Layout, Calendar as CalendarIcon, Ban, AlertTriangle, Clock, MessageCircle } from 'lucide-react';
import ContactLink from '../components/ContactLink';
import { useAuth } from '../context/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isWeekend, parseISO, startOfDay } from 'date-fns';
import { hu } from 'date-fns/locale';

const Admin = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState('responses');
  const [contentSubTab, setContentSubTab] = useState('services'); // 'services' or 'home'
  const [data, setData] = useState({ sections: [], items: [], trainings: [], responses: [], volumes: [], team: [], prices: [], bookings: [], blockedTimes: [], workingHours: [], reviews: [] });
  const [refresh, setRefresh] = useState(0);
  
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [targetSec, setTargetSec] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editDetails, setEditDetails] = useState('');

  // Section State
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editSectionName, setEditSectionName] = useState('');

  // Price State
  const [newPrice, setNewPrice] = useState({ name: '', price: '' });
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editPriceData, setEditPriceData] = useState({ name: '', price: '' });

  // Volume State
  const [newVolume, setNewVolume] = useState({ title: '', link: '' });
  const [volumeImage, setVolumeImage] = useState(null);
  const [editingVolumeId, setEditingVolumeId] = useState(null);
  const [editVolumeData, setEditVolumeData] = useState({ title: '', link: '' });

  // Team State
  const [newMember, setNewMember] = useState({ name: '', bio: '' });
  const [memberImage, setMemberImage] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberData, setEditMemberData] = useState({ name: '', bio: '' });

  // Booking & Blocking State
  const [newBlock, setNewBlock] = useState({ date: '', startTime: '', endTime: '', isFullDay: true, reason: '' });
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  
  // Booking Sort State ('status' or 'time')
  const [bookingSort, setBookingSort] = useState('status');
  const [showRejected, setShowRejected] = useState(false);
  
  // Advanced Blocking Calendar State
  const [selectedBlockDate, setSelectedBlockDate] = useState(new Date());
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState([]);
  const [pendingBlockAction, setPendingBlockAction] = useState(null); // mit akartunk épp menteni
  const [generalAlertMsg, setGeneralAlertMsg] = useState(null); // Általános hibaüzenet (alert kiváltója)

  useEffect(() => {
    const load = async () => {
      const [s, i, t, r, v, tm, p, b, bt, wh, rev] = await Promise.all([
        supabase.from('sections').select('*').order('sort_order', { ascending: true }),
        supabase.from('section_items').select('*').order('id', { ascending: true }),
        supabase.from('trainings').select('*').order('created_at', { ascending: false }),
        supabase.from('questionnaire').select('*').order('created_at', { ascending: false }),
        supabase.from('volumes').select('*').order('id'),
        supabase.from('team_members').select('*').order('id'),
        supabase.from('prices').select('*').order('sort_order', { ascending: true }),
        supabase.from('consultation_bookings').select('*').order('booking_datetime', { ascending: false }),
        supabase.from('blocked_times').select('*').order('block_date', { ascending: false }),
        supabase.from('working_hours').select('*').order('day_of_week', { ascending: true }),
        supabase.from('reviews').select('*').order('created_at', { ascending: false })
      ]);
      setData({ 
        sections: s.data || [], 
        items: i.data || [], 
        trainings: t.data || [], 
        responses: r.data || [],
        volumes: v.data || [],
        team: tm.data || [],
        prices: p.data || [],
        bookings: b.data || [],
        blockedTimes: bt.data || [],
        workingHours: wh.data || [],
        reviews: rev.data || []
      });
    };
    load();
  }, [refresh]);

  // --- REVIEW IMAGE UPLOAD ---
  const handleReviewUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `reviews/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
      await supabase.from('reviews').insert({ image_path: publicUrl, alt_text: file.name });
      triggerRefresh();
    } catch (error) {
      console.error('Upload error:', error);
      setGeneralAlertMsg('Hiba történt a vélemény feltöltésekor.');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  // --- WORKING HOURS OPERATIONS ---
  const updateWorkingHour = async (whId, updates) => {
    const { error } = await supabase.from('working_hours').update(updates).eq('id', whId);
    if (error) {
      alert('Hiba a beosztás frissítésekor!');
    } else {
      triggerRefresh();
    }
  };

  // --- BOOKING OPERATIONS ---
  const updateBookingStatus = async (id, newStatus, email, name) => {
    const { error } = await supabase.from('consultation_bookings').update({ status: newStatus }).eq('id', id);
    if (error) {
      setGeneralAlertMsg('Hiba a státusz frissítésekor!');
    } else {
      triggerRefresh();
      
      // Megjegyzés: Jelenleg nincs automatikus mailto nyitás az elutasításkor a felhasználói kérés alapján.
    }
  };

  const initiateBlock = async (isFullDay, startTimeStr = null, endTimeStr = null, reasonStr = '') => {
    if (!selectedBlockDate) {
      setGeneralAlertMsg("Kérlek először válassz ki egy napot!");
      return;
    }
    const dateStr = format(selectedBlockDate, 'yyyy-MM-dd');
    const activeBookings = data.bookings.filter(b => b.status === 'pending' || b.status === 'approved');
    
    // Ütközés vizsgálat
    const conflicts = activeBookings.filter(b => {
      const bDate = new Date(b.booking_datetime);
      if (format(bDate, 'yyyy-MM-dd') !== dateStr) return false;
      if (isFullDay) return true;
      
      const bTime = format(bDate, 'HH:mm');
      return bTime >= startTimeStr && bTime < endTimeStr;
    });

    if (conflicts.length > 0) {
      setConflictingBookings(conflicts);
      setPendingBlockAction({
        block_date: dateStr,
        start_time: isFullDay ? null : startTimeStr,
        end_time: isFullDay ? null : endTimeStr,
        is_full_day: isFullDay,
        reason: reasonStr
      });
      setConflictModalOpen(true);
      return;
    }

    await executeBlockInsert({
      block_date: dateStr,
      start_time: isFullDay ? null : startTimeStr,
      end_time: isFullDay ? null : endTimeStr,
      is_full_day: isFullDay,
      reason: reasonStr
    });
  };

  const addBlock = async () => {
    if (!newBlock.date) {
      setGeneralAlertMsg("A dátum megadása kötelező!");
      return;
    }
    await initiateBlock(newBlock.isFullDay, newBlock.startTime, newBlock.endTime, newBlock.reason);
  };

  const executeBlockInsert = async (blockData) => {
    const { error } = await supabase.from('blocked_times').insert(blockData);
    if (error) {
      setGeneralAlertMsg('Hiba a letiltás mentésekor');
    } else {
      setNewBlock({ date: format(selectedBlockDate, 'yyyy-MM-dd'), startTime: '', endTime: '', isFullDay: true, reason: '' });
      triggerRefresh();
    }
  };

  const confirmBlockWithConflicts = async () => {
    setConflictModalOpen(false);
    
    // Elutasítjuk a konfliktusos foglalásokat
    for (const b of conflictingBookings) {
       await supabase.from('consultation_bookings').update({ status: 'rejected' }).eq('id', b.id);
    }
    
    // Utána beszúrjuk magát a letiltást
    if (pendingBlockAction) {
       await executeBlockInsert(pendingBlockAction);
       setPendingBlockAction(null);
    }
  };

  const handleAdminDateChange = (date) => {
    setSelectedBlockDate(date);
    setNewBlock(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
  };

  const getDayAvailability = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Szűrés a már letiltott időpontokra
    const dayBlocks = data.blockedTimes.filter(b => b.block_date === dateStr);
    
    // Szűrés a már lefoglalt időpontokra
    const dayBookings = data.bookings.filter(b => 
      (b.status === 'pending' || b.status === 'approved') && 
      format(new Date(b.booking_datetime), 'yyyy-MM-dd') === dateStr
    );

    // Beosztás (is it an active day?)
    const dayOfWeek = date.getDay();
    const daySchedule = data.workingHours.find(w => w.day_of_week === dayOfWeek);
    const isActiveDay = daySchedule ? daySchedule.is_active : false;

    return { dayBlocks, dayBookings, daySchedule, isActiveDay };
  };

  const adminTileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const { dayBlocks, dayBookings, isActiveDay } = getDayAvailability(date);
    
    // Ha nem munkanap a beosztás szerint (pl. hétvége vagy kikapcsolt szerda), szürke
    if (!isActiveDay) return null;

    const hasFullBlock = dayBlocks.some(b => b.is_full_day);

    if (hasFullBlock) {
      return <div className="w-full h-1 mt-1 bg-red-500 rounded-full" title="Egész nap letiltva"></div>;
    }

    return (
      <div className="flex gap-1 mt-1 justify-center">
        {dayBlocks.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Részleges letiltás"></div>}
        {dayBookings.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Létező foglalás"></div>}
      </div>
    );
  };

  const adminTileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const { isActiveDay } = getDayAvailability(date);
      if (!isActiveDay) return true; // Szürke, ha nincs rendelés
    }
    return false;
  };

  const triggerRefresh = () => setRefresh(p => p + 1);

  // --- CRUD Operations ---
  const addItem = async (secId) => {
    if(!newItem.trim()) return;
    await supabase.from('section_items').insert({ section_id: secId, content: newItem });
    setNewItem(''); setTargetSec(null); triggerRefresh();
  };

  // Általános törlés, alert helyett logolás a konzolra ha hiba van, a siker esetén csak frissít (pl. a "Kuka" ikonokhoz is)
  const deleteItem = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error("Delete error:", error);
      setGeneralAlertMsg("Hiba történt a törléskor.");
    } else {
      triggerRefresh();
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditValue(item.content);
    setEditDetails(item.details || '');
  };

  const updateItem = async (id) => {
    if (!editValue.trim()) return;
    const { error } = await supabase.from('section_items').update({ content: editValue, details: editDetails }).eq('id', id);
    if (error) {
      setGeneralAlertMsg('Hiba a mentés során!');
    } else {
      setEditingId(null); setEditValue(''); setEditDetails(''); triggerRefresh();
    }
  };

  const cancelEditing = () => {
    setEditingId(null); setEditValue(''); setEditDetails('');
  };

  // --- SECTIONS CRUD ---
  const addSection = async () => {
    if (!newSectionName.trim()) return;
    const { error } = await supabase.from('sections').insert({ name: newSectionName });
    if (error) {
      console.error(error);
      setGeneralAlertMsg('Hiba a létrehozáskor: ' + error.message);
    } else {
      setNewSectionName('');
      triggerRefresh();
    }
  };

  const startEditingSection = (sec) => {
    setEditingSectionId(sec.id);
    setEditSectionName(sec.name);
  };

  const updateSection = async (id) => {
    if (!editSectionName.trim()) return;
    const { error } = await supabase.from('sections').update({ name: editSectionName }).eq('id', id);
    if (error) {
      setGeneralAlertMsg('Hiba a frissítéskor');
    } else {
      setEditingSectionId(null);
      setEditSectionName('');
      triggerRefresh();
    }
  };

  const deleteSection = async (id) => {
    if (confirm('Biztosan törlöd a teljes szekciót? A benne lévő összes elem is törlődik!')) {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) {
        alert('Hiba a törléskor');
      } else {
        triggerRefresh();
      }
    }
  };

  const handleUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
      await supabase.from('trainings').insert({ image_path: publicUrl, alt_text: file.name });
      triggerRefresh();
    } catch (error) {
      console.error('Upload error:', error);
      setGeneralAlertMsg('Hiba történt a feltöltéskor.');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  // --- PRICES CRUD ---
  const addPrice = async () => {
    if (!newPrice.name.trim() || !newPrice.price.trim()) {
      setGeneralAlertMsg("Minden mező kitöltése kötelező!");
      return;
    }
    
    const { error } = await supabase.from('prices').insert({
      name: newPrice.name,
      price: newPrice.price
    });

    if (error) {
       console.error("Hiba:", error);
       setGeneralAlertMsg("Hiba történt mentéskor.");
    } else {
       setNewPrice({ name: '', price: '' });
       triggerRefresh();
    }
  };

  const startEditingPrice = (price) => {
    setEditingPriceId(price.id);
    setEditPriceData({ name: price.name, price: price.price });
  };

  const updatePrice = async (id) => {
    if (!editPriceData.name.trim() || !editPriceData.price.trim()) return;
    try {
      const { error } = await supabase.from('prices')
        .update({ name: editPriceData.name, price: editPriceData.price })
        .eq('id', id);
        
      if (error) throw error;
      setEditingPriceId(null);
      triggerRefresh();
    } catch (error) {
       console.error("Update error:", error);
       setGeneralAlertMsg("Hiba történt frissítéskor.");
    }
  };

  // --- VOLUMES CRUD ---
  const handleVolumeImageUpload = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `volumes/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
    return publicUrl;
  };

  const addVolume = async () => {
    if (!newVolume.title.trim()) {
      setGeneralAlertMsg("A cím megadása kötelező!");
      return;
    }
    
    setUploading(true);
    try {
      let imageUrl = null;
      if (volumeImage) {
        imageUrl = await handleVolumeImageUpload(volumeImage);
      }

      const { error } = await supabase.from('volumes').insert({
        title: newVolume.title,
        link: newVolume.link,
        image_path: imageUrl
      });

      if (error) throw error;
      
      setNewVolume({ title: '', link: '' });
      setVolumeImage(null);
      triggerRefresh();
    } catch (error) {
      console.error("Hiba a kötet hozzáadásakor:", error);
      setGeneralAlertMsg("Hiba történt mentéskor.");
    } finally {
      setUploading(false);
    }
  };

  const startEditingVolume = (vol) => {
    setEditingVolumeId(vol.id);
    setEditVolumeData({ title: vol.title, link: vol.link });
  };

  const updateVolume = async (id) => {
    if (!editVolumeData.title.trim()) return;
    try {
      const { error } = await supabase.from('volumes')
        .update({ title: editVolumeData.title, link: editVolumeData.link })
        .eq('id', id);
        
      if (error) throw error;
      setEditingVolumeId(null);
      triggerRefresh();
    } catch (error) {
       console.error("Update error:", error);
       setGeneralAlertMsg("Hiba történt frissítéskor.");
    }
  };

  // --- TEAM CRUD ---
  const handleTeamImageUpload = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `team/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
    return publicUrl;
  };

  const addMember = async () => {
    if (!newMember.name.trim()) {
      setGeneralAlertMsg("A név megadása kötelező!");
      return;
    }
    
    setUploading(true);
    try {
      let imageUrl = null;
      if (memberImage) {
        imageUrl = await handleTeamImageUpload(memberImage);
      }

      const { error } = await supabase.from('team_members').insert({
        name: newMember.name,
        bio: newMember.bio,
        image_path: imageUrl
      });

      if (error) throw error;
      
      setNewMember({ name: '', bio: '' });
      setMemberImage(null);
      triggerRefresh();
    } catch (error) {
      console.error("Hiba a munkatárs hozzáadásakor:", error);
      setGeneralAlertMsg("Hiba történt mentéskor.");
    } finally {
      setUploading(false);
    }
  };

  const startEditingMember = (member) => {
    setEditingMemberId(member.id);
    setEditMemberData({ name: member.name, bio: member.bio || '' });
  };

  const updateMember = async (id) => {
    if (!editMemberData.name.trim()) return;
    try {
      const { error } = await supabase.from('team_members')
        .update({ name: editMemberData.name, bio: editMemberData.bio })
        .eq('id', id);
        
      if (error) throw error;
      setEditingMemberId(null);
      triggerRefresh();
    } catch (error) {
       console.error("Update error:", error);
       setGeneralAlertMsg("Hiba történt frissítéskor.");
    }
  };

  const moveSection = async (sectionId, direction) => {
    const sectionIndex = data.sections.findIndex(s => s.id === sectionId);
    if (direction === 'up' && sectionIndex === 0) return;
    if (direction === 'down' && sectionIndex === data.sections.length - 1) return;

    const otherIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    const currentSection = data.sections[sectionIndex];
    const otherSection = data.sections[otherIndex];

    const { error } = await supabase.from('sections').upsert([
      { ...currentSection, sort_order: otherSection.sort_order },
      { ...otherSection, sort_order: currentSection.sort_order }
    ]);

    if (error) {
      setGeneralAlertMsg('Hiba a mozgatás során!');
      console.error(error);
    } else {
      triggerRefresh();
    }
  };

  const filteredSections = data.sections.filter(s => {
    const isHomeSection = ['Főoldal Kérdések', 'Főoldal'].includes(s.name);
    
    if (contentSubTab === 'home') {
      return isHomeSection;
    } else {
      return !isHomeSection;
    }
  });

  const TabButton = ({ id, label, icon: Icon }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`
        flex-1 flex items-center justify-center gap-1 md:gap-2 
        py-3 px-1 md:px-6 md:py-4 
        text-xs sm:text-sm md:text-base 
        font-medium transition-all duration-300 rounded-t-[10px]
        ${activeTab === id 
          ? 'bg-primary text-white shadow-md translate-y-1' 
          : 'text-gray-500 hover:text-primary hover:bg-gray-50'
        }
      `}
    >
      <Icon className="w-4 h-4 md:w-[18px] md:h-[18px]" /> 
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 pt-24 pb-12 px-2 md:px-4 animate-fade-in">
      <div className="max-w-7xl mt-5 mx-auto bg-white rounded-[12px] shadow-sm border border-gray-200 min-h-[600px] flex flex-col overflow-hidden">
        
        <div className="flex w-full border-b border-gray-200 px-1 md:px-6 pt-4 gap-1 bg-gray-50/50 flex-wrap items-center">
          <TabButton id="sections" label="Tartalom" icon={FileText} />
          <TabButton id="prices" label="Áraink" icon={DollarSign} />
          <TabButton id="volumes" label="Kötetek" icon={Book} />
          <TabButton id="team" label="Munkatársak" icon={User} />
          <TabButton id="trainings" label="Galéria" icon={ImageIcon} />
          <TabButton id="reviews" label="Vélemények" icon={MessageCircle} />
          <TabButton id="bookings" label="Konzultációk" icon={CalendarIcon} />
          <TabButton id="working_hours" label="Beosztás" icon={Clock} />
          <TabButton id="blocked" label="Naptár Letiltások" icon={Ban} />
          
          <div className="ml-auto p-2 flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden md:inline">{user?.email}</span>
            <button 
              onClick={signOut} 
              className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm font-bold"
              title="Kijelentkezés"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Kilépés</span>
            </button>
          </div>
        </div>

        <div key={activeTab} className="p-4 md:p-8 flex-grow animate-fade-in">
          
          {/* CONTENT EDITOR */}
          {activeTab === 'sections' && (
            <div className="grid gap-6">
              
              {/* Sub-tabs for Content */}
              <div className="flex border-b border-gray-200 mb-2">
                <button 
                  onClick={() => setContentSubTab('services')}
                  className={`px-6 py-2 font-medium transition-all ${contentSubTab === 'services' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Szolgáltatások oldal
                </button>
                <button 
                  onClick={() => setContentSubTab('home')}
                  className={`px-6 py-2 font-medium transition-all ${contentSubTab === 'home' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Főoldal
                </button>
              </div>

              {/* Create New Section - Only for services tab */}
              {contentSubTab === 'services' && (
                <div className="bg-blue-50 p-4 md:p-6 rounded-[8px] border border-blue-100 mb-4">
                  <h4 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2"><Plus size={20} /> Új Szekció Létrehozása</h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" 
                      placeholder="Szekció neve" 
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      className="flex-1 border border-blue-200 rounded-[4px] px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                      onClick={addSection}
                      className="bg-blue-600 text-white px-6 py-2 rounded-[4px] hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
                    >
                      Létrehozás
                    </button>
                  </div>
                </div>
              )}

              {filteredSections.map((sec, idx) => (
                <div key={sec.id} className="bg-gray-50 p-4 md:p-6 rounded-[8px] border border-gray-200 transition-all hover:shadow-md">
                  
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                    {editingSectionId === sec.id && contentSubTab === 'services' ? (
                      <div className="flex gap-2 w-full items-center">
                        <input 
                          value={editSectionName}
                          onChange={(e) => setEditSectionName(e.target.value)}
                          className="flex-1 px-3 py-1 border border-primary rounded-[4px] font-bold text-xl"
                        />
                        <button onClick={() => updateSection(sec.id)} className="text-green-600 hover:bg-green-50 p-2 rounded-[4px]"><Check size={20}/></button>
                        <button onClick={() => setEditingSectionId(null)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-[4px]"><X size={20}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {contentSubTab === 'services' && (
                          <div className="flex flex-col gap-1 mr-2">
                            <button 
                              onClick={() => moveSection(sec.id, 'up')}
                              disabled={idx === 0}
                              className={`p-1 rounded hover:bg-gray-200 transition ${idx === 0 ? 'text-gray-300' : 'text-gray-500'}`}
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button 
                              onClick={() => moveSection(sec.id, 'down')}
                              disabled={idx === filteredSections.length - 1}
                              className={`p-1 rounded hover:bg-gray-200 transition ${idx === filteredSections.length - 1 ? 'text-gray-300' : 'text-gray-500'}`}
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-dark flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {sec.name}
                        </h3>
                      </div>
                    )}
                    
                    {editingSectionId !== sec.id && contentSubTab === 'services' && (
                      <div className="flex gap-2">
                         <button onClick={() => startEditingSection(sec)} className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-[4px] transition" title="Szekció átnevezése"><Edit2 size={18}/></button>
                         <button onClick={() => deleteSection(sec.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-[4px] transition" title="Szekció törlése"><Trash2 size={18}/></button>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-4">
                    {data.items.filter(i => i.section_id === sec.id).map(item => (
                      <li key={item.id} className="bg-white p-3 rounded-[6px] border border-gray-100 shadow-sm">
                        {editingId === item.id ? (
                          <div className="flex flex-col gap-2 w-full animate-fade-in">
                            <textarea 
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full px-3 py-2 border border-primary rounded-[4px] outline-none focus:ring-2 focus:ring-primary/50 text-dark min-h-[100px]"
                              placeholder="Fő szöveg"
                              autoFocus
                            />
                            {!['Főoldal Kérdések', 'Főoldal CTA'].includes(sec.name) && (
                              <textarea 
                                value={editDetails}
                                onChange={(e) => setEditDetails(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-[4px] outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[80px]"
                                placeholder="Részletes leírás (lenyíló menü)..."
                              />
                            )}
                            <div className="flex gap-2 w-full justify-end">
                              <button onClick={() => updateItem(item.id)} className="bg-green-50 text-green-600 p-2 rounded-[4px] hover:bg-green-100 flex items-center gap-1"><Check size={18} /> Mentés</button>
                              <button onClick={cancelEditing} className="bg-gray-50 text-gray-500 p-2 rounded-[4px] hover:bg-gray-100 flex items-center gap-1"><X size={18} /> Mégse</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-2 md:gap-4">
                            <div className="flex-1">
                              <span className="text-gray-700 font-medium whitespace-pre-wrap">{item.content}</span>
                              {item.details && (
                                <p className="text-gray-400 text-sm mt-1 truncate">{item.details.substring(0, 50)}...</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 self-end md:self-auto">
                              <button onClick={() => startEditing(item)} className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-[4px] transition"><Edit2 size={16} /></button>
                              <button onClick={() => deleteItem('section_items', item.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-[4px] transition"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col md:flex-row gap-2 mt-4 pt-4 border-t border-gray-200">
                    <input 
                      className="flex-1 border border-gray-300 rounded-[4px] px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all focus:shadow-sm" 
                      placeholder="Új sor hozzáadása..." 
                      value={targetSec === sec.id ? newItem : ''}
                      onChange={e => { setTargetSec(sec.id); setNewItem(e.target.value); }}
                    />
                    <button onClick={() => addItem(sec.id)} className="bg-primary text-white px-4 py-2 rounded-[4px] hover:bg-opacity-90 transition flex items-center justify-center gap-2 active:scale-95"><Plus size={20}/> Hozzáad</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PRICES MANAGEMENT */}
          {activeTab === 'prices' && (
            <div className="space-y-8">
              {/* Add New Price */}
              <div className="bg-green-50 p-6 rounded-[8px] border border-green-100">
                <h4 className="font-bold text-green-900 text-lg mb-4 flex items-center gap-2"><Plus size={20} /> Új ár hozzáadása</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Megnevezés (pl. 3 tréning)" 
                    value={newPrice.name}
                    onChange={(e) => setNewPrice({...newPrice, name: e.target.value})}
                    className="border border-green-200 rounded-[4px] px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                  <input 
                    type="text" 
                    placeholder="Ár (pl. 111 000 Ft)" 
                    value={newPrice.price}
                    onChange={(e) => setNewPrice({...newPrice, price: e.target.value})}
                    className="border border-green-200 rounded-[4px] px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                  <div className="md:col-span-2 flex justify-end">
                     <button 
                       onClick={addPrice} 
                       className="bg-green-600 text-white px-6 py-2 rounded-[4px] hover:bg-green-700 transition shadow-md flex items-center gap-2"
                     >
                       Hozzáadás
                     </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="grid gap-4">
                {data.prices.map(price => (
                  <div key={price.id} className="bg-white p-4 rounded-[8px] border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    
                    <div className="flex-grow w-full">
                       {editingPriceId === price.id ? (
                         <div className="grid gap-2">
                           <input 
                             type="text" 
                             value={editPriceData.name} 
                             onChange={(e) => setEditPriceData({...editPriceData, name: e.target.value})}
                             className="border border-primary rounded-[4px] px-3 py-1 w-full"
                           />
                           <input 
                             type="text" 
                             value={editPriceData.price} 
                             onChange={(e) => setEditPriceData({...editPriceData, price: e.target.value})}
                             className="border border-gray-300 rounded-[4px] px-3 py-1 w-full"
                           />
                           <div className="flex gap-2 mt-2">
                             <button onClick={() => updatePrice(price.id)} className="bg-green-50 text-green-600 px-3 py-1 rounded-[4px] text-sm hover:bg-green-100 flex items-center gap-1"><Check size={14}/> Mentés</button>
                             <button onClick={() => setEditingPriceId(null)} className="bg-gray-50 text-gray-500 px-3 py-1 rounded-[4px] text-sm hover:bg-gray-100 flex items-center gap-1"><X size={14}/> Mégse</button>
                           </div>
                         </div>
                       ) : (
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
                           <h4 className="font-medium text-dark text-lg">{price.name}</h4>
                           <span className="font-bold text-primary text-xl">{price.price}</span>
                         </div>
                       )}
                    </div>

                    {/* Operations */}
                    <div className="flex gap-2 self-end md:self-center">
                      {editingPriceId !== price.id && (
                        <>
                          <button onClick={() => startEditingPrice(price)} className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-[4px] transition"><Edit2 size={18} /></button>
                          <button onClick={() => deleteItem('prices', price.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-[4px] transition"><Trash2 size={18}/></button>
                        </>
                      )}
                    </div>

                  </div>
                ))}
                {data.prices.length === 0 && <p className="text-center text-gray-500 py-8">Még nincsenek feltöltött árak.</p>}
              </div>
            </div>
          )}

          {/* VOLUMES MANAGEMENT */}
          {activeTab === 'volumes' && (
            <div className="space-y-8">
              {/* Add New Volume */}
              <div className="bg-blue-50 p-6 rounded-[8px] border border-blue-100">
                <h4 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2"><Plus size={20} /> Új kötet hozzáadása</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Kötet címe" 
                    value={newVolume.title}
                    onChange={(e) => setNewVolume({...newVolume, title: e.target.value})}
                    className="border border-blue-200 rounded-[4px] px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input 
                    type="text" 
                    placeholder="Link (URL)" 
                    value={newVolume.link}
                    onChange={(e) => setNewVolume({...newVolume, link: e.target.value})}
                    className="border border-blue-200 rounded-[4px] px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="md:col-span-2 flex items-center gap-4">
                     <label className="flex-1 cursor-pointer bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-[4px] hover:bg-blue-100 transition flex items-center justify-center gap-2">
                        <ImageIcon size={18} />
                        {volumeImage ? volumeImage.name : "Borítókép kiválasztása"}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setVolumeImage(e.target.files[0])} />
                     </label>
                     <button 
                       onClick={addVolume} 
                       disabled={uploading}
                       className={`bg-blue-600 text-white px-6 py-2 rounded-[4px] hover:bg-blue-700 transition shadow-md flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                       {uploading ? 'Feltöltés...' : 'Hozzáadás'}
                     </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="grid gap-4">
                {data.volumes.map(vol => (
                  <div key={vol.id} className="bg-white p-4 rounded-[8px] border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    
                    {/* Image */}
                    <div className="w-20 h-28 bg-gray-100 rounded-[4px] overflow-hidden flex-shrink-0">
                      {vol.image_path ? (
                        <img src={vol.image_path} alt={vol.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Book size={24}/></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow w-full">
                       {editingVolumeId === vol.id ? (
                         <div className="grid gap-2">
                           <input 
                             type="text" 
                             value={editVolumeData.title} 
                             onChange={(e) => setEditVolumeData({...editVolumeData, title: e.target.value})}
                             className="border border-primary rounded-[4px] px-3 py-1 w-full"
                           />
                           <input 
                             type="text" 
                             value={editVolumeData.link} 
                             onChange={(e) => setEditVolumeData({...editVolumeData, link: e.target.value})}
                             className="border border-gray-300 rounded-[4px] px-3 py-1 w-full text-sm"
                           />
                           <div className="flex gap-2 mt-2">
                             <button onClick={() => updateVolume(vol.id)} className="bg-green-50 text-green-600 px-3 py-1 rounded-[4px] text-sm hover:bg-green-100 flex items-center gap-1"><Check size={14}/> Mentés</button>
                             <button onClick={() => setEditingVolumeId(null)} className="bg-gray-50 text-gray-500 px-3 py-1 rounded-[4px] text-sm hover:bg-gray-100 flex items-center gap-1"><X size={14}/> Mégse</button>
                           </div>
                         </div>
                       ) : (
                         <div>
                           <h4 className="font-bold text-dark text-lg">{vol.title}</h4>
                           {vol.link && (
                             <a href={vol.link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center gap-1 mt-1">
                               <LinkIcon size={12} /> {vol.link}
                             </a>
                           )}
                         </div>
                       )}
                    </div>

                    {/* Operations */}
                    <div className="flex gap-2 self-end md:self-center">
                      {editingVolumeId !== vol.id && (
                        <>
                          <button onClick={() => startEditingVolume(vol)} className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-[4px] transition"><Edit2 size={18} /></button>
                          <button onClick={() => deleteItem('volumes', vol.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-[4px] transition"><Trash2 size={18}/></button>
                        </>
                      )}
                    </div>

                  </div>
                ))}
                {data.volumes.length === 0 && <p className="text-center text-gray-500 py-8">Még nincs feltöltött kötet.</p>}
              </div>
            </div>
          )}

          {/* TEAM MANAGEMENT */}
          {activeTab === 'team' && (
            <div className="space-y-8">
              {/* Add New Team Member */}
              <div className="bg-blue-50 p-6 rounded-[8px] border border-blue-100">
                <h4 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2"><Plus size={20} /> Új munkatárs hozzáadása</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Név" 
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="border border-blue-200 rounded-[4px] px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                  />
                  <div className="md:col-span-2">
                    <textarea 
                      placeholder="Bemutatkozás" 
                      value={newMember.bio}
                      onChange={(e) => setNewMember({...newMember, bio: e.target.value})}
                      className="border border-blue-200 rounded-[4px] px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full min-h-[100px]"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-4">
                     <label className="flex-1 cursor-pointer bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-[4px] hover:bg-blue-100 transition flex items-center justify-center gap-2">
                        <ImageIcon size={18} />
                        {memberImage ? memberImage.name : "Fénykép kiválasztása"}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setMemberImage(e.target.files[0])} />
                     </label>
                     <button 
                       onClick={addMember} 
                       disabled={uploading}
                       className={`bg-blue-600 text-white px-6 py-2 rounded-[4px] hover:bg-blue-700 transition shadow-md flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                       {uploading ? 'Feltöltés...' : 'Hozzáadás'}
                     </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="grid gap-4">
                {data.team.map(member => (
                  <div key={member.id} className="bg-white p-4 rounded-[8px] border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-start">
                    
                    {/* Image */}
                    <div className="w-20 h-28 bg-gray-100 rounded-[4px] overflow-hidden flex-shrink-0">
                      {member.image_path ? (
                        <img src={member.image_path} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={24}/></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow w-full">
                       {editingMemberId === member.id ? (
                         <div className="grid gap-2">
                           <input 
                             type="text" 
                             value={editMemberData.name} 
                             onChange={(e) => setEditMemberData({...editMemberData, name: e.target.value})}
                             className="border border-primary rounded-[4px] px-3 py-1 w-full"
                           />
                           <textarea 
                             value={editMemberData.bio} 
                             onChange={(e) => setEditMemberData({...editMemberData, bio: e.target.value})}
                             className="border border-gray-300 rounded-[4px] px-3 py-1 w-full text-sm min-h-[80px]"
                           />
                           <div className="flex gap-2 mt-2">
                             <button onClick={() => updateMember(member.id)} className="bg-green-50 text-green-600 px-3 py-1 rounded-[4px] text-sm hover:bg-green-100 flex items-center gap-1"><Check size={14}/> Mentés</button>
                             <button onClick={() => setEditingMemberId(null)} className="bg-gray-50 text-gray-500 px-3 py-1 rounded-[4px] text-sm hover:bg-gray-100 flex items-center gap-1"><X size={14}/> Mégse</button>
                           </div>
                         </div>
                       ) : (
                         <div>
                           <h4 className="font-bold text-dark text-lg">{member.name}</h4>
                           <p className="text-gray-600 text-sm whitespace-pre-wrap mt-1">{member.bio}</p>
                         </div>
                       )}
                    </div>

                    {/* Operations */}
                    <div className="flex gap-2 self-end md:self-start">
                      {editingMemberId !== member.id && (
                        <>
                          <button onClick={() => startEditingMember(member)} className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-[4px] transition"><Edit2 size={18} /></button>
                          <button onClick={() => deleteItem('team_members', member.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-[4px] transition"><Trash2 size={18}/></button>
                        </>
                      )}
                    </div>

                  </div>
                ))}
                {data.team.length === 0 && <p className="text-center text-gray-500 py-8">Még nincs feltöltött munkatárs.</p>}
              </div>
            </div>
          )}

          {/* GALLERY */}
          {activeTab === 'trainings' && (
            <div>
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-center bg-blue-50 p-6 rounded-[8px] border border-blue-100 gap-4">
                <div className="text-center sm:text-left">
                  <h4 className="font-bold text-blue-900 text-lg">Galéria kezelése</h4>
                  <p className="text-sm text-blue-700">Itt tölthetsz fel képeket a Főoldali Tréningek szekcióba.</p>
                </div>
                <label className={`cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-[6px] hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg font-medium w-full sm:w-auto justify-center active:scale-95 ${uploading ? 'opacity-70' : ''}`}>
                  <Upload size={18} />
                  {uploading ? 'Feltöltés...' : 'Új kép feltöltése'}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleUpload} 
                    disabled={uploading} 
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {data.trainings.map(t => (
                  <div key={t.id} className="relative group rounded-[8px] overflow-hidden aspect-square bg-gray-100 shadow-sm hover:shadow-lg transition-all hover:scale-[1.02]">
                    <img src={t.image_path} className="w-full h-full object-cover" alt="Training" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                    <button onClick={() => deleteItem('trainings', t.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-[4px] shadow opacity-100 md:opacity-0 group-hover:opacity-100 transition hover:bg-red-600 active:scale-90"><Trash2 size={16}/></button>
                  </div>
                ))}
                {data.trainings.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">Még nincs feltöltött kép a galériában.</p>}
              </div>
            </div>
          )}

          {/* REVIEWS (ÜGYFÉLVÉLEMÉNYEK) */}
          {activeTab === 'reviews' && (
            <div>
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-center bg-indigo-50 p-6 rounded-[8px] border border-indigo-100 gap-4">
                <div className="text-center sm:text-left">
                  <h4 className="font-bold text-indigo-900 text-lg">Ügyfélvélemények (Képek)</h4>
                  <p className="text-sm text-indigo-700">Tölts fel képernyőfotókat az elégedett ügyfelek véleményeiről, amelyek a <b className="font-bold">/jelentkezes</b> oldalon jelennek meg.</p>
                </div>
                <label className={`cursor-pointer bg-indigo-600 text-white px-6 py-3 rounded-[6px] hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg font-medium w-full sm:w-auto justify-center active:scale-95 ${uploading ? 'opacity-70' : ''}`}>
                  <Upload size={18} />
                  {uploading ? 'Feltöltés...' : 'Új vélemény feltöltése'}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleReviewUpload} 
                    disabled={uploading} 
                  />
                </label>
              </div>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {data.reviews.map(rev => (
                  <div key={rev.id} className="relative group rounded-[8px] overflow-hidden bg-gray-100 shadow-sm border border-gray-200 hover:shadow-lg transition-all break-inside-avoid">
                    <img src={rev.image_path} className="w-full h-auto object-contain" alt="Ügyfélvélemény" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                    <button onClick={() => deleteItem('reviews', rev.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-[4px] shadow opacity-100 md:opacity-0 group-hover:opacity-100 transition hover:bg-red-600 active:scale-90"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              {data.reviews.length === 0 && <p className="text-center text-gray-500 py-8">Még nincsenek feltöltött ügyfélvélemény képek.</p>}
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-dark">Vezetői Konzultációs Foglalások</h2>
                
                <div className="flex bg-gray-200 rounded-[8px] p-1 w-full sm:w-auto">
                  <button 
                    onClick={() => setBookingSort('status')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-[6px] text-sm font-medium transition-all ${bookingSort === 'status' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Státusz szerint
                  </button>
                  <button 
                    onClick={() => setBookingSort('time')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-[6px] text-sm font-medium transition-all ${bookingSort === 'time' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Időpont szerint
                  </button>
                </div>
              </div>

              <div className="grid gap-6">
                {(() => {
                  if (data.bookings.length === 0) return <p className="text-center py-8 text-gray-500">Nincs még beérkezett foglalás.</p>;

                  // Helper function to render a single booking card
                  const renderBookingCard = (b) => {
                    const bookingDateObj = new Date(b.booking_datetime);
                    const formattedDate = bookingDateObj.toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
                    const startHour = bookingDateObj.getHours();
                    const startMin = bookingDateObj.getMinutes().toString().padStart(2, '0');
                    const nextHourStr = `${(startHour + 1).toString().padStart(2, '0')}:${startMin}`;
                    const formattedTimeRange = `${startHour.toString().padStart(2, '0')}:${startMin} - ${nextHourStr}`;

                    return (
                      <div key={b.id} className="bg-white border border-gray-200 rounded-[8px] p-4 shadow-sm hover:shadow-md transition">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          
                          <div className="flex-1 cursor-pointer" onClick={() => setExpandedBookingId(expandedBookingId === b.id ? null : b.id)}>
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-lg">{b.first_name} {b.last_name}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                b.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {b.status === 'pending' ? 'Függőben' : b.status === 'approved' ? 'Elfogadva' : 'Elutasítva'}
                              </span>
                            </div>
                            <div className="text-primary font-medium mt-1 flex items-center gap-2">
                              <CalendarIcon size={16} />
                              {formattedDate}, {formattedTimeRange}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {b.status === 'pending' && (
                              <>
                                <button onClick={() => updateBookingStatus(b.id, 'approved', b.email, b.first_name)} className="bg-green-500 text-white px-4 py-2 rounded-[4px] hover:bg-green-600 transition flex items-center gap-1 font-medium text-sm"><Check size={16}/> Elfogad</button>
                                <button onClick={() => updateBookingStatus(b.id, 'rejected', b.email, b.first_name)} className="bg-red-500 text-white px-4 py-2 rounded-[4px] hover:bg-red-600 transition flex items-center gap-1 font-medium text-sm"><X size={16}/> Elutasít</button>
                              </>
                            )}
                            <button onClick={() => deleteItem('consultation_bookings', b.id)} className="bg-gray-100 text-gray-600 p-2 rounded-[4px] hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={18}/></button>
                          </div>
                        </div>

                        {expandedBookingId === b.id && (
                          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-[6px] animate-fade-in">
                            <div>
                              <p className="text-sm text-gray-500">Kapcsolat:</p>
                              <p className="font-medium"><a href={`mailto:${b.email}`} className="text-primary hover:underline">{b.email}</a></p>
                              <p className="font-medium"><a href={`tel:${b.phone}`} className="text-primary hover:underline">{b.phone}</a></p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Cégtípus:</p>
                              <p className="font-medium">{b.company_type}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">Legnagyobb kihívás:</p>
                              <p className="font-medium whitespace-pre-wrap mt-1">{b.biggest_challenge}</p>
                            </div>
                            {b.admin_notes && (
                              <div className="md:col-span-2 mt-2 pt-2 border-t border-gray-200">
                                <p className="text-sm text-gray-500">Belső megjegyzés:</p>
                                <p className="font-medium text-blue-800">{b.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  };

                  if (bookingSort === 'time') {
                    // Csak a függőben lévő és elfogadott foglalások kellenek
                    const activeBookings = data.bookings
                      .filter(b => b.status !== 'rejected')
                      .sort((a, b) => new Date(a.booking_datetime) - new Date(b.booking_datetime)); // Növekvő sorrend (legközelebbi legelöl)

                    if (activeBookings.length === 0) return <p className="text-gray-500">Nincs aktív foglalás.</p>;
                    
                    return <div className="space-y-3">{activeBookings.map(b => renderBookingCard(b))}</div>;
                  } 
                  
                  if (bookingSort === 'status') {
                    const pending = data.bookings.filter(b => b.status === 'pending').sort((a,b) => new Date(a.booking_datetime) - new Date(b.booking_datetime));
                    const approved = data.bookings.filter(b => b.status === 'approved').sort((a,b) => new Date(a.booking_datetime) - new Date(b.booking_datetime));
                    const rejected = data.bookings.filter(b => b.status === 'rejected').sort((a,b) => new Date(b.booking_datetime) - new Date(a.booking_datetime)); // Elutasítottaknál a legutóbbi felül

                    return (
                      <div className="space-y-8">
                        {/* PENDING SECTION */}
                        <div>
                          <h3 className="text-lg font-bold text-yellow-800 border-b border-yellow-200 pb-2 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            Függőben lévő foglalások ({pending.length})
                          </h3>
                          {pending.length > 0 ? (
                            <div className="space-y-3">{pending.map(b => renderBookingCard(b))}</div>
                          ) : (
                            <p className="text-gray-500 italic text-sm">Nincsenek elbírálásra váró jelentkezések.</p>
                          )}
                        </div>

                        {/* APPROVED SECTION */}
                        <div>
                          <h3 className="text-lg font-bold text-green-800 border-b border-green-200 pb-2 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Elfogadott konzultációk ({approved.length})
                          </h3>
                          {approved.length > 0 ? (
                            <div className="space-y-3">{approved.map(b => renderBookingCard(b))}</div>
                          ) : (
                            <p className="text-gray-500 italic text-sm">Nincsenek elfogadott időpontok.</p>
                          )}
                        </div>

                        {/* REJECTED SECTION */}
                        {rejected.length > 0 && (
                          <div className="border border-gray-200 rounded-[8px] overflow-hidden bg-gray-50">
                            <button 
                              onClick={() => setShowRejected(!showRejected)}
                              className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200 transition font-medium text-gray-700"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                Elutasított foglalások ({rejected.length})
                              </div>
                              {showRejected ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                            </button>
                            {showRejected && (
                              <div className="p-4 space-y-3 bg-white">
                                {rejected.map(b => renderBookingCard(b))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}

          {/* WORKING HOURS (BEOSZTÁS) MANAGEMENT */}
          {activeTab === 'working_hours' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-dark mb-4 border-b pb-2">Heti Alap Beosztás (Mikor lehet foglalni)</h2>
              <div className="bg-white p-6 rounded-[8px] border border-gray-200 shadow-sm grid gap-4">
                {data.workingHours.length === 0 && <p className="text-gray-500">Nincs még feltöltött beosztás az adatbázisban.</p>}
                {data.workingHours.map((wh) => {
                  const daysMap = {1: 'Hétfő', 2: 'Kedd', 3: 'Szerda', 4: 'Csütörtök', 5: 'Péntek', 6: 'Szombat', 0: 'Vasárnap'};
                  return (
                    <div key={wh.id} className={`p-4 rounded-[6px] border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${wh.is_active ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={wh.is_active} 
                            onChange={(e) => updateWorkingHour(wh.id, { is_active: e.target.checked })}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                          />
                          <span className={`ml-3 font-bold text-lg ${wh.is_active ? 'text-blue-900' : 'text-gray-500'}`}>{daysMap[wh.day_of_week]}</span>
                        </label>
                      </div>

                      {wh.is_active ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 w-14">Mettől:</span>
                            <input 
                              type="number" 
                              min="0"
                              max="23"
                              step="1"
                              placeholder="08"
                              value={wh.start_time ? parseInt(wh.start_time.split(':')[0], 10) : ''} 
                              onChange={(e) => {
                                const val = e.target.value;
                                if(val === '') return updateWorkingHour(wh.id, { start_time: null });
                                updateWorkingHour(wh.id, { start_time: `${val.toString().padStart(2, '0')}:00` });
                              }}
                              className="border border-gray-300 rounded px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 w-20 text-center font-mono"
                            />
                            <span className="text-sm text-gray-500">:00</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 w-14 sm:w-auto">Meddig:</span>
                            <input 
                              type="number" 
                              min="0"
                              max="24"
                              step="1"
                              placeholder="16"
                              value={wh.end_time ? parseInt(wh.end_time.split(':')[0], 10) : ''} 
                              onChange={(e) => {
                                const val = e.target.value;
                                if(val === '') return updateWorkingHour(wh.id, { end_time: null });
                                updateWorkingHour(wh.id, { end_time: `${val.toString().padStart(2, '0')}:00` });
                              }}
                              className="border border-gray-300 rounded px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 w-20 text-center font-mono"
                            />
                            <span className="text-sm text-gray-500">:00</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic mt-2 sm:mt-0">Ezen a napon nincs rendelés.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BLOCKED TIMES (INTERACTIVE CALENDAR) */}
          {activeTab === 'blocked' && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* CALENDAR VIEW */}
                <div className="bg-white p-6 rounded-[8px] border border-gray-200 shadow-sm flex flex-col items-center">
                  <h4 className="font-bold text-dark text-lg mb-4 self-start w-full border-b pb-2 flex items-center gap-2"><CalendarIcon size={20} /> Válassz napot</h4>
                  <Calendar 
                    onChange={handleAdminDateChange} 
                    value={selectedBlockDate}
                    locale="hu-HU"
                    tileContent={adminTileContent}
                    tileDisabled={adminTileDisabled}
                    className="border-none shadow-sm rounded-lg p-2 w-full admin-calendar"
                  />
                  <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-600 justify-center w-full">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Letiltott</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Foglalt</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-200"></div> Inaktív / Múltbeli</span>
                  </div>
                </div>

                {/* DAY DETAILS & TIMESLOTS */}
                <div className="bg-gray-50 p-6 rounded-[8px] border border-gray-200 flex flex-col h-full">
                  <h4 className="font-bold text-dark text-lg mb-4 flex items-center justify-between border-b border-gray-300 pb-2">
                    <span>A kiválasztott nap: <span className="text-primary">{format(selectedBlockDate, 'yyyy. MM. dd.', { locale: hu })}</span></span>
                  </h4>
                  
                  {(() => {
                    const { dayBlocks, dayBookings, daySchedule, isActiveDay } = getDayAvailability(selectedBlockDate);
                    
                    if (!isActiveDay || !daySchedule) {
                      return <div className="p-4 bg-gray-100 text-gray-500 rounded border border-gray-200 text-center mt-4">Ezen a napon alapértelmezetten nincs rendelés a Beosztás alapján.</div>;
                    }

                    const isFullDayBlocked = dayBlocks.find(b => b.is_full_day);

                    // Idősávok generálása a schedule alapján
                    let possibleTimes = [];
                    if (daySchedule.start_time && daySchedule.end_time) {
                      const startHour = parseInt(daySchedule.start_time.split(':')[0], 10);
                      const endHour = parseInt(daySchedule.end_time.split(':')[0], 10); 
                      for (let i = startHour; i < endHour; i++) {
                        possibleTimes.push(`${i.toString().padStart(2, '0')}:00`);
                      }
                    }

                    return (
                      <div className="flex flex-col gap-4 flex-grow">
                        {/* Egész napos letiltás gomb */}
                        {isFullDayBlocked ? (
                          <div className="bg-red-100 border border-red-300 p-4 rounded text-center">
                            <p className="text-red-800 font-bold mb-2">A nap jelenleg teljesen le van tiltva.</p>
                            <button onClick={() => deleteItem('blocked_times', isFullDayBlocked.id)} className="bg-white text-red-600 border border-red-600 px-4 py-2 rounded hover:bg-red-50 transition text-sm font-bold">
                              Letiltás feloldása
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => initiateBlock(true)} className="w-full bg-red-100 text-red-700 hover:bg-red-200 py-3 rounded-[6px] transition font-bold border border-red-200 flex justify-center items-center gap-2">
                            <Ban size={18} /> A teljes nap letiltása
                          </button>
                        )}

                        <div className="mt-2 text-gray-500 text-sm border-b pb-1 font-medium">Elérhető idősávok a beosztás szerint:</div>
                        
                        <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[350px] pr-2">
                          {isFullDayBlocked ? (
                            <p className="col-span-full text-gray-400 italic text-sm text-center py-4">Mivel az egész nap le van tiltva, az idősávok nem kattinthatók.</p>
                          ) : (
                            possibleTimes.map(timeStr => {
                              const hour = parseInt(timeStr.split(':')[0], 10);
                              const nextHour = `${(hour + 1).toString().padStart(2, '0')}:00`;
                              const timeRange = `${timeStr} - ${nextHour}`;
                              
                              // Megnézzük van-e foglalás (itt most akár több is lehet ugyanarra az idősávra ha nem jól van kezelve az elérhetőség, de alapból 1)
                              const bookingsInSlot = dayBookings.filter(b => format(new Date(b.booking_datetime), 'HH:mm') === timeStr);
                              
                              // Megnézzük le van-e tiltva külön
                              const block = dayBlocks.find(b => !b.is_full_day && b.start_time?.substring(0,5) === timeStr);

                              // Ha van foglalás, zöldként jelenik meg
                              if (bookingsInSlot.length > 0) {
                                return (
                                  <div key={timeStr} className="bg-green-100 border border-green-300 rounded p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-green-200 transition shadow-sm" onClick={() => initiateBlock(false, timeStr, nextHour, "Automatikus ütközés")}>
                                    <div>
                                      <span className="font-bold text-green-900 text-lg mr-4">{timeRange}</span>
                                      <div className="flex flex-col mt-1">
                                        {bookingsInSlot.map((booking, idx) => (
                                          <span key={idx} className="text-green-800 font-medium flex items-center gap-1">
                                            <User size={14} /> {booking.first_name} {booking.last_name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <button className="mt-3 md:mt-0 text-sm bg-white text-green-800 border border-green-300 px-3 py-1.5 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition shadow-sm self-start md:self-auto flex items-center gap-1 font-bold">
                                      <Ban size={14} /> Letiltás
                                    </button>
                                  </div>
                                );
                              }

                              if (block) {
                                return (
                                  <div key={timeStr} className="bg-gray-100 border border-gray-300 rounded p-4 flex flex-row items-center justify-between cursor-pointer hover:bg-gray-200 transition shadow-sm relative overflow-hidden" onClick={() => deleteItem('blocked_times', block.id)}>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 text-red-500">
                                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="6" /></svg>
                                    </div>
                                    <span className="font-bold text-gray-500 text-lg line-through">{timeRange}</span>
                                    <span className="text-sm bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded font-bold shadow-sm flex items-center gap-1">Feloldás</span>
                                  </div>
                                );
                              }

                              // Ha szabad
                              return (
                                <div key={timeStr} className="bg-white border border-gray-300 rounded p-4 flex flex-row items-center justify-between cursor-pointer hover:border-red-500 hover:bg-red-50 transition shadow-sm group" onClick={() => initiateBlock(false, timeStr, nextHour)}>
                                  <span className="font-bold text-dark text-lg group-hover:text-red-700 transition">{timeRange}</span>
                                  <span className="text-sm text-gray-500 group-hover:text-red-600 font-medium flex items-center gap-1 transition"><Ban size={14}/> Letiltás</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* CONFLICT MODAL ONLY FOR BLOCKING ACTIVE TIMES */}
              {conflictModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                   <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
                     <div className="flex items-center gap-3 text-red-600 mb-4 border-b border-red-100 pb-4">
                       <AlertTriangle size={28} />
                       <h2 className="text-xl font-bold text-gray-900">Figyelem! Ütköző foglalások</h2>
                     </div>
                     <p className="text-gray-600 mb-4">
                       A letiltani kívánt időpontban / napon a következő <b>aktív foglalások</b> találhatók. Ha megerősíted a letiltást, a rendszer ezeket a foglalásokat automatikusan <strong className="text-red-600">Elutasított</strong> státuszra állítja.
                     </p>
                     
                     <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6 max-h-60 overflow-y-auto">
                       {conflictingBookings.map(b => (
                         <div key={b.id} className="border-b last:border-0 border-gray-200 py-2">
                           <p className="font-bold text-dark flex items-center gap-2"><User size={16} /> {b.first_name} {b.last_name}</p>
                           <p className="text-sm text-gray-500 mt-1">Időpont: {new Date(b.booking_datetime).toLocaleString('hu-HU')}</p>
                           <p className="text-sm text-gray-500">Email: {b.email}</p>
                         </div>
                       ))}
                     </div>

                     <div className="flex gap-4">
                       <button onClick={() => setConflictModalOpen(false)} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition">
                         Mégsem
                       </button>
                       <button onClick={confirmBlockWithConflicts} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-md flex justify-center items-center gap-2">
                         <Ban size={18} /> Biztosan letiltom
                       </button>
                     </div>
                   </div>
                </div>
              )}

              {/* GENERAL ALERT MODAL */}
              {generalAlertMsg && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 animate-fade-in text-center">
                    <p className="text-gray-800 text-lg font-medium mb-6">{generalAlertMsg}</p>
                    <button onClick={() => setGeneralAlertMsg(null)} className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition w-full">
                      Rendben
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Admin;

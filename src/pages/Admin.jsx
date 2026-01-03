import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trash2, Plus, Upload, Image as ImageIcon, FileText, Users, Edit2, Check, X, Phone, Mail, MessageSquare, Book, Link as LinkIcon, LogOut, User, DollarSign } from 'lucide-react';
import ContactLink from '../components/ContactLink';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState('responses');
  const [data, setData] = useState({ sections: [], items: [], trainings: [], responses: [], volumes: [], team: [], prices: [] });
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


  useEffect(() => {
    const load = async () => {
      const [s, i, t, r, v, tm, p] = await Promise.all([
        supabase.from('sections').select('*').order('id', { ascending: true }),
        supabase.from('section_items').select('*').order('id', { ascending: true }),
        supabase.from('trainings').select('*').order('created_at', { ascending: false }),
        supabase.from('questionnaire').select('*').order('created_at', { ascending: false }),
        supabase.from('volumes').select('*').order('id'),
        supabase.from('team_members').select('*').order('id'),
        supabase.from('prices').select('*').order('sort_order', { ascending: true })
      ]);
      setData({ 
        sections: s.data || [], 
        items: i.data || [], 
        trainings: t.data || [], 
        responses: r.data || [],
        volumes: v.data || [],
        team: tm.data || [],
        prices: p.data || []
      });
    };
    load();
  }, [refresh]);

  const triggerRefresh = () => setRefresh(p => p + 1);

  // --- CRUD Operations ---
  const addItem = async (secId) => {
    if(!newItem.trim()) return;
    await supabase.from('section_items').insert({ section_id: secId, content: newItem });
    setNewItem(''); setTargetSec(null); triggerRefresh();
  };

  const deleteItem = async (table, id) => {
    if(confirm('Biztosan törlöd?')) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        console.error("Delete error:", error);
        alert("Hiba történt a törléskor.");
      } else {
        triggerRefresh();
      }
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
      alert('Hiba a mentés során!');
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
      alert('Hiba a létrehozáskor: ' + error.message);
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
      alert('Hiba a frissítéskor');
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
      alert('Hiba történt a feltöltéskor.');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  // --- PRICES CRUD ---
  const addPrice = async () => {
    if (!newPrice.name.trim() || !newPrice.price.trim()) return alert("Minden mező kitöltése kötelező!");
    
    const { error } = await supabase.from('prices').insert({
      name: newPrice.name,
      price: newPrice.price
    });

    if (error) {
       console.error("Hiba:", error);
       alert("Hiba történt mentéskor.");
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
       alert("Hiba történt frissítéskor.");
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
    if (!newVolume.title.trim()) return alert("A cím megadása kötelező!");
    
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
      alert("Hiba történt mentéskor.");
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
       alert("Hiba történt frissítéskor.");
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
    if (!newMember.name.trim()) return alert("A név megadása kötelező!");
    
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
      alert("Hiba történt mentéskor.");
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
       alert("Hiba történt frissítéskor.");
    }
  };

  const sortedSections = [...data.sections].sort((a, b) => {
    const priority = ['Főoldal Kérdések', 'Főoldal CTA'];
    const indexA = priority.indexOf(a.name);
    const indexB = priority.indexOf(b.name);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return a.id - b.id;
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
          <TabButton id="responses" label="Jelentkezők" icon={Users} />
          
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
            <div className="grid gap-8">
              
              {/* Create New Section */}
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

              {sortedSections.filter(s => s.name !== 'Tréningek' && s.name !== 'A témákhoz kapcsolódó kötetek').map(sec => (
                <div key={sec.id} className="bg-gray-50 p-4 md:p-6 rounded-[8px] border border-gray-200 transition-all hover:shadow-md">
                  
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                    {editingSectionId === sec.id ? (
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
                      <h3 className="text-xl font-bold text-dark flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {sec.name}
                      </h3>
                    )}
                    
                    {editingSectionId !== sec.id && (
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
                  <p className="text-sm text-blue-700">Itt tölthetsz fel képeket a Tréningek szekcióba.</p>
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
              </div>
            </div>
          )}

          {/* RESPONSES */}
          {activeTab === 'responses' && (
            <div>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto rounded-[8px] border border-gray-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                      <th className="p-4 min-w-[150px]">Név</th>
                      <th className="p-4 min-w-[200px]">Email</th>
                      <th className="p-4 min-w-[120px]">Telefon</th>
                      <th className="p-4 w-full">Üzenet</th>
                      <th className="p-4 text-right min-w-[100px]">Művelet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {data.responses.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-dark align-top whitespace-normal break-words">{r.full_name}</td>
                        <td className="p-4 text-gray-600 align-top whitespace-normal break-all">
                          <ContactLink value={r.email} type="email" className="hover:text-primary hover:underline" />
                        </td>
                        <td className="p-4 text-gray-600 font-mono text-sm align-top whitespace-nowrap">
                          <ContactLink value={r.phone} type="phone" className="hover:text-primary hover:underline" />
                        </td>
                        <td className="p-4 text-gray-600 align-top whitespace-pre-wrap break-words">{r.interests}</td>
                        <td className="p-4 text-right align-top">
                          <button onClick={() => deleteItem('questionnaire', r.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-[4px] transition"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden flex flex-col gap-4">
                {data.responses.map(r => (
                  <div key={r.id} className="bg-white border border-gray-200 rounded-[8px] p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-dark text-lg break-words">{r.full_name}</h3>
                      <button onClick={() => deleteItem('questionnaire', r.id)} className="text-red-500 p-1 bg-red-50 rounded-[4px] active:bg-red-100"><Trash2 size={16}/></button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2 break-all">
                        <Mail size={14} className="text-primary shrink-0"/> 
                        <ContactLink value={r.email} type="email" className="hover:underline hover:text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-primary shrink-0"/> 
                        <ContactLink value={r.phone} type="phone" className="hover:underline hover:text-primary" />
                      </div>
                      <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-[6px] mt-2 border border-gray-100">
                        <MessageSquare size={14} className="text-primary mt-1 shrink-0"/> 
                        <span className="italic whitespace-pre-wrap break-words">{r.interests || "Nincs üzenet"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {data.responses.length === 0 && (
                <div className="text-center py-12 text-gray-400 animate-pulse">
                  <Users size={48} className="mx-auto mb-2 opacity-20" />
                  <p>Még nem érkezett jelentkezés.</p>
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

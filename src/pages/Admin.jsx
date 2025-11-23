import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trash2, Plus, Upload, Image as ImageIcon, FileText, Users, Edit2, Check, X, Phone, Mail, MessageSquare } from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('sections');
  const [data, setData] = useState({ sections: [], items: [], trainings: [], responses: [] });
  const [refresh, setRefresh] = useState(0);
  
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [targetSec, setTargetSec] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const load = async () => {
      const [s, i, t, r] = await Promise.all([
        supabase.from('sections').select('*').order('id'),
        supabase.from('section_items').select('*').order('id'),
        supabase.from('trainings').select('*').order('created_at', { ascending: false }),
        supabase.from('questionnaire').select('*').order('created_at', { ascending: false })
      ]);
      setData({ sections: s.data || [], items: i.data || [], trainings: t.data || [], responses: r.data || [] });
    };
    load();
  }, [refresh]);

  const triggerRefresh = () => setRefresh(p => p + 1);

  // --- CRUD Műveletek ---
  const addItem = async (secId) => {
    if(!newItem.trim()) return;
    await supabase.from('section_items').insert({ section_id: secId, content: newItem });
    setNewItem(''); setTargetSec(null); triggerRefresh();
  };

  const deleteItem = async (table, id) => {
    if(confirm('Biztosan törlöd?')) {
      await supabase.from(table).delete().eq('id', id);
      triggerRefresh();
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditValue(item.content);
  };

  const updateItem = async (id) => {
    if (!editValue.trim()) return;
    const { error } = await supabase.from('section_items').update({ content: editValue }).eq('id', id);
    if (error) {
      alert('Hiba a mentés során!');
    } else {
      setEditingId(null); setEditValue(''); triggerRefresh();
    }
  };

  const cancelEditing = () => {
    setEditingId(null); setEditValue('');
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

  // FIX KEREKÍTÉS: rounded-t-[10px] a rounded-t-lg helyett
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
      {/* FIX KEREKÍTÉS: rounded-[12px] */}
      <div className="max-w-7xl mx-auto bg-white rounded-[12px] shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
        
        {/* FIX KEREKÍTÉS: rounded-t-[12px] */}
        <div className="flex w-full border-b border-gray-200 px-1 md:px-6 pt-4 gap-1 bg-gray-50/50 rounded-t-[12px]">
          <TabButton id="sections" label="Tartalom" icon={FileText} />
          <TabButton id="trainings" label="Galéria" icon={ImageIcon} />
          <TabButton id="responses" label="Jelentkezők" icon={Users} />
        </div>

        <div key={activeTab} className="p-4 md:p-8 flex-grow animate-fade-in">
          
          {/* TARTALOM SZERKESZTŐ */}
          {activeTab === 'sections' && (
            <div className="grid gap-8">
              {data.sections.filter(s => s.name !== 'Tréningek').map(sec => (
                // FIX KEREKÍTÉS: rounded-[8px]
                <div key={sec.id} className="bg-gray-50 p-4 md:p-6 rounded-[8px] border border-gray-200 transition-all hover:shadow-md">
                  <h3 className="text-xl font-bold text-dark mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    {sec.name}
                  </h3>
                  <ul className="space-y-3 mb-4">
                    {data.items.filter(i => i.section_id === sec.id).map(item => (
                      // FIX KEREKÍTÉS: rounded-[6px]
                      <li key={item.id} className="bg-white p-3 rounded-[6px] border border-gray-100 shadow-sm">
                        {editingId === item.id ? (
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full animate-fade-in">
                            <input 
                              type="text" 
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full px-3 py-2 border border-primary rounded-[4px] outline-none focus:ring-2 focus:ring-primary/50 text-dark"
                              autoFocus
                            />
                            <div className="flex gap-2 w-full md:w-auto justify-end">
                              <button onClick={() => updateItem(item.id)} className="bg-green-50 text-green-600 p-2 rounded-[4px] hover:bg-green-100 flex items-center gap-1"><Check size={18} /> Mentés</button>
                              <button onClick={cancelEditing} className="bg-gray-50 text-gray-500 p-2 rounded-[4px] hover:bg-gray-100 flex items-center gap-1"><X size={18} /> Mégse</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-2 md:gap-4">
                            <span className="text-gray-700 flex-1">{item.content}</span>
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

          {/* GALÉRIA */}
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

          {/* JELENTKEZÉSEK - TÁBLÁZAT JAVÍTÁS */}
          {activeTab === 'responses' && (
            <div>
              {/* Desktop Nézet */}
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
                        <td className="p-4 text-gray-600 align-top whitespace-normal break-all">{r.email}</td>
                        <td className="p-4 text-gray-600 font-mono text-sm align-top whitespace-nowrap">{r.phone}</td>
                        <td className="p-4 text-gray-600 align-top whitespace-pre-wrap break-words">{r.interests}</td>
                        <td className="p-4 text-right align-top">
                          <button onClick={() => deleteItem('questionnaire', r.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-[4px] transition"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobil Nézet */}
              <div className="md:hidden flex flex-col gap-4">
                {data.responses.map(r => (
                  <div key={r.id} className="bg-white border border-gray-200 rounded-[8px] p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-dark text-lg break-words">{r.full_name}</h3>
                      <button onClick={() => deleteItem('questionnaire', r.id)} className="text-red-500 p-1 bg-red-50 rounded-[4px] active:bg-red-100"><Trash2 size={16}/></button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2 break-all"><Mail size={14} className="text-primary shrink-0"/> {r.email}</div>
                      <div className="flex items-center gap-2"><Phone size={14} className="text-primary shrink-0"/> {r.phone}</div>
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
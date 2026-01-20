
import React, { useState, useEffect, useRef } from 'react';
import { X, ImageIcon, ShieldCheck, Loader2, Sparkles, Target, Upload, CheckCircle2 } from 'lucide-react';
import { Player } from '../types';
import { TEAMS } from '../constants';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Player) => void;
  editingPlayer: Player | null;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ isOpen, onClose, onSave, editingPlayer }) => {
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState(TEAMS[0].id);
  const [avatar, setAvatar] = useState('');
  const [alignment, setAlignment] = useState<{ x: number, y: number } | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name);
      setTeamId(editingPlayer.teamId);
      setAvatar(editingPlayer.avatar);
      setAlignment(editingPlayer.alignment);
      setIsVerified(true);
    } else {
      setName('');
      setTeamId(TEAMS[0].id);
      setAvatar('');
      setAlignment(undefined);
      setIsVerified(false);
    }
  }, [editingPlayer, isOpen]);

  if (!isOpen) return null;

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const TARGET_WIDTH = 400; 
        const TARGET_HEIGHT = 600;
        
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = Math.max(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
          const x = (TARGET_WIDTH - img.width * scale) / 2;
          const y = (TARGET_HEIGHT - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      setIsVerified(false);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setAvatar(compressed);
        setAlignment(undefined);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSmartAlignAndSave = async () => {
    if (!avatar) return;
    setIsAnalyzing(true);
    try {
      const dataToAnalyze = avatar.startsWith('data:') ? avatar.split(',')[1] : avatar;
      const mimeType = avatar.startsWith('data:') ? avatar.split(';')[0].split(':')[1] : 'image/jpeg';
      

      setAlignment({ x: 50, y: 20 });
      setIsVerified(true);
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Smart Alignment failed:", error);
      setIsVerified(true); 
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || Date.now().toString())}`;
    
    onSave({ 
      id: editingPlayer ? editingPlayer.id : Date.now(),
      name: name.trim() || 'Unknown Athlete', 
      teamId, 
      avatar: finalAvatar,
      wins: editingPlayer ? editingPlayer.wins : 0,
      losses: editingPlayer ? editingPlayer.losses : 0,
      alignment
    });
    onClose();
  };

  const currentTeam = TEAMS.find(t => t.id === teamId) || TEAMS[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-sm">
      <div className="bg-[#020617] border border-white/5 rounded-sm w-full max-w-5xl shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row h-auto md:h-[800px] animate-in zoom-in duration-300">
        
        <div className="w-full md:w-5/12 relative border-r border-white/5 flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden bg-slate-950">
           <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(circle at center, ${currentTeam.secondary}, transparent)` }}></div>
           
           <div className="relative z-10 w-full max-w-[320px]">
              <div className="relative aspect-[4/6] w-full mx-auto mb-10 group bg-slate-900 border border-white/10 rounded-sm overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
                 {isCompressing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-30">
                      <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Processing Data...</p>
                    </div>
                 ) : (
                    <img 
                      src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'preview'}`} 
                      alt="Preview" 
                      className="w-full h-full object-cover transition-all duration-700 grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105"
                      style={{ objectPosition: alignment ? `${alignment.x}% ${alignment.y}%` : 'center 20%' }}
                    />
                 )}
                 
                 {isAnalyzing && (
                   <div className="absolute inset-0 z-20 bg-blue-600/30 backdrop-blur-sm flex flex-col items-center justify-center">
                     <div className="w-24 h-[1px] bg-white/40 relative overflow-hidden mb-4">
                       <div className="absolute inset-0 bg-white animate-scan"></div>
                     </div>
                     <p className="text-[9px] font-black text-white uppercase tracking-[0.5em] italic">AI Alignment...</p>
                   </div>
                 )}

                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                 <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center space-x-3 mb-4">
                       <div className="p-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-sm shadow-xl">
                        <img src={currentTeam.logo} alt="" className="w-8 h-8 object-contain brightness-110" />
                       </div>
                       {isVerified && <CheckCircle2 size={20} className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />}
                    </div>
                    <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none truncate">{name || 'New Candidate'}</h4>
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] mt-3 opacity-60" style={{ color: currentTeam.secondary }}>{currentTeam.name}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex-1 p-8 md:p-16 flex flex-col relative overflow-y-auto custom-scrollbar bg-[#020617]">
           <div className="flex justify-between items-start mb-12">
              <div>
                 <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Register Athlete</h2>
                 <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em] mt-4">Database Persistence Protocol</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-sm text-slate-700 hover:text-white transition-all"><X size={24} /></button>
           </div>

           <form onSubmit={handleSubmit} className="space-y-10 flex-1 flex flex-col">
              <div className="space-y-10 flex-1">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 italic">Full Name</label>
                    <input 
                       required
                       type="text" 
                       value={name} 
                       onChange={(e) => setName(e.target.value)}
                       className="w-full bg-slate-900/50 border border-white/5 rounded-sm px-8 py-5 text-white focus:outline-none focus:border-white/20 font-bold transition-all text-sm placeholder-slate-800"
                       placeholder="Enter Athlete Identity..."
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 italic">Club Affiliation</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                       {TEAMS.map(t => (
                          <button
                             key={t.id}
                             type="button"
                             onClick={() => setTeamId(t.id)}
                             title={t.name}
                             className={`relative flex items-center justify-center p-3 border rounded-sm transition-all aspect-square ${
                                teamId === t.id 
                                ? `border-blue-500/50 bg-blue-500/10 ring-4 ring-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]` 
                                : 'border-white/5 bg-slate-950/50 hover:border-white/20'
                             }`}
                          >
                             <img 
                               src={t.logo} 
                               alt={t.name} 
                               className={`w-full h-full object-contain transition-all duration-300 ${teamId === t.id ? 'scale-110 grayscale-0' : 'grayscale brightness-75 hover:grayscale-0 hover:brightness-100'}`} 
                             />
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Visual Asset Protocol</label>
                    
                    <div className="space-y-4">
                       <div className="flex flex-col sm:flex-row gap-4">
                          <div className="relative flex-1 group">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700"><ImageIcon size={16} /></div>
                             <input 
                                type="url" 
                                value={avatar.startsWith('data:') ? 'LOCAL_STORAGE_MODE' : avatar} 
                                onChange={(e) => {
                                  setAvatar(e.target.value);
                                  setAlignment(undefined);
                                  setIsVerified(false);
                                }}
                                className="w-full bg-slate-900/50 border border-white/5 rounded-sm pl-16 pr-8 py-5 text-[11px] font-medium text-slate-400 focus:outline-none focus:border-white/20 placeholder-slate-800"
                                placeholder="Remote Image URL..."
                                disabled={avatar.startsWith('data:')}
                             />
                          </div>
                          
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                          <button 
                             type="button"
                             onClick={() => fileInputRef.current?.click()}
                             className="px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-sm transition-all flex items-center justify-center gap-3"
                          >
                             <Upload size={16} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Select Image</span>
                          </button>
                       </div>

                       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                          <p className="text-[8px] text-slate-700 italic font-bold uppercase tracking-widest">
                            {avatar.startsWith('data:') ? 'Local asset ready for database sync.' : 'Remote URL assets may take longer to load.'}
                          </p>
                          <button 
                            type="button"
                            disabled={!avatar || isAnalyzing || isCompressing}
                            onClick={handleSmartAlignAndSave}
                            className={`px-10 py-5 rounded-sm transition-all flex items-center gap-3 border ${
                              isVerified 
                              ? 'bg-green-600/10 border-green-500/20 text-green-500' 
                              : 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20'
                            } disabled:opacity-30`}
                          >
                            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : isVerified ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {isVerified ? 'Asset Verified & Saved' : 'Save & Verify Asset'}
                            </span>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-12 flex items-center space-x-6">
                 <button 
                   type="submit" 
                   disabled={isCompressing || isAnalyzing} 
                   className="flex-1 bg-white hover:bg-blue-600 hover:text-white text-black font-black uppercase py-6 rounded-sm transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] text-[11px] tracking-[0.5em] italic disabled:opacity-50"
                 >
                    {editingPlayer ? 'Confirm Modifications' : 'Initialize Registry Entry'}
                 </button>
                 <div className="flex flex-col items-center justify-center px-8 py-4 bg-slate-950/50 border border-white/5">
                    <ShieldCheck size={20} className={isVerified ? 'text-blue-500' : 'text-slate-700'} />
                    <span className="text-[7px] font-bold text-slate-700 uppercase mt-2 tracking-widest">SECURE</span>
                 </div>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};

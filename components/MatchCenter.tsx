
import React, { useState } from 'react';
import { Player, Fixture } from '../types';
import { TEAMS } from '../constants';
import { 
  Swords, Trophy, Calendar, Plus, 
  Trash2, Check, X, UserPlus, 
  Zap, ChevronLeft, ShieldCheck, Play,
  Edit3, Info, AlertTriangle, ChevronUp, ChevronDown,
  Monitor, Terminal, AlertCircle, RefreshCw, Layers
} from 'lucide-react';

interface MatchCenterProps {
  players: Player[];
  fixtures: Fixture[];
  onUpdateFixtures: (fixtures: Fixture[]) => void;
  onUpdatePlayer: (player: Player) => void;
  onBack: () => void;
  isAuthorized?: boolean;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({ 
  players, fixtures, onUpdateFixtures, onUpdatePlayer, onBack, isAuthorized = false
}) => {
  const [p1Id, setP1Id] = useState<number>(0);
  const [p2Id, setP2Id] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);

  const addFixture = () => {
    if (!p1Id || !p2Id || p1Id === p2Id) return;
    
    const newFixture: Fixture = {
      id: Math.random().toString(36).substring(2, 11),
      p1Id: p1Id,
      p2Id: p2Id,
      status: 'scheduled',
      timestamp: Date.now(),
    };
    
    onUpdateFixtures([newFixture, ...fixtures]);
    setP1Id(0);
    setP2Id(0);
    setIsAdding(false);
  };

  const finalizeMatch = (fixtureId: string, s1: number, s2: number) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    const player1 = players.find(p => p.id === fixture.p1Id);
    const player2 = players.find(p => p.id === fixture.p2Id);

    if (player1 && player2) {
      if (s1 > s2) {
        onUpdatePlayer({ ...player1, wins: (player1.wins || 0) + 1 });
        onUpdatePlayer({ ...player2, losses: (player2.losses || 0) + 1 });
      } else if (s2 > s1) {
        onUpdatePlayer({ ...player2, wins: (player2.wins || 0) + 1 });
        onUpdatePlayer({ ...player1, losses: (player1.losses || 0) + 1 });
      }
    }

    onUpdateFixtures(fixtures.map(f => 
      f.id === fixtureId ? { ...f, score1: s1, score2: s2, status: 'finished' } : f
    ));
  };

  const deleteFixture = (id: string) => {
    onUpdateFixtures(fixtures.filter(f => f.id !== id));
  };

  const groupedFixtures = fixtures.reduce((acc, f) => {
    const date = new Date(f.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(f);
    return acc;
  }, {} as Record<string, Fixture[]>);

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-40">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-12">
        <div className="flex items-center space-x-6">
          <button 
            onClick={onBack}
            className="group p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-white transition-all shadow-xl"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
             <div className="flex items-center space-x-2 text-indigo-400">
               <Zap size={12} className="fill-indigo-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em]">Arena Command Center</span>
             </div>
             <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">Match Registry</h2>
          </div>
        </div>

        {isAuthorized && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`px-10 py-5 rounded-sm border transition-all flex items-center gap-3 ${
              isAdding 
              ? 'bg-red-600/10 border-red-500/30 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)]' 
              : 'bg-white text-black hover:bg-indigo-600 hover:text-white border-transparent shadow-[0_20px_40px_rgba(0,0,0,0.5)]'
            }`}
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">
              {isAdding ? 'CANCEL SCHEDULING' : 'CREATE FIXTURE'}
            </span>
          </button>
        )}
      </div>

      {isAdding && isAuthorized && (
        <div className="bg-slate-900/40 border border-indigo-500/20 rounded-sm p-10 animate-in zoom-in duration-300 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-[1px] bg-indigo-500 animate-pulse"></div>
           <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-12 items-center">
              <div className="space-y-4">
                 <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Home Contender</label>
                 <select 
                    value={p1Id || ""} 
                    onChange={e => setP1Id(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest focus:border-indigo-500 outline-none transition-all"
                 >
                    <option value="">Select Athlete</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>
              <div className="flex flex-col items-center">
                 <Swords size={32} className="text-indigo-600/30" />
                 <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mt-3 italic">Versus</span>
              </div>
              <div className="space-y-4">
                 <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Away Contender</label>
                 <select 
                    value={p2Id || ""} 
                    onChange={e => setP2Id(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest focus:border-indigo-500 outline-none transition-all"
                 >
                    <option value="">Select Athlete</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>
           </div>
           <div className="mt-10 pt-10 border-t border-white/5 flex justify-center">
              <button 
                onClick={addFixture}
                disabled={!p1Id || !p2Id || p1Id === p2Id}
                className="px-16 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white font-black uppercase tracking-[0.5em] text-[10px] rounded-sm transition-all"
              >
                DEPLOY FIXTURE
              </button>
           </div>
        </div>
      )}

      <div className="space-y-24">
        {Object.keys(groupedFixtures).length === 0 ? (
          <div className="py-48 flex flex-col items-center justify-center space-y-6 opacity-20 border border-dashed border-white/10 rounded-sm">
            <Swords size={48} className="text-slate-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.6em]">Registry Clear: No Pending Matches</p>
          </div>
        ) : (
          (Object.entries(groupedFixtures) as [string, Fixture[]][]).map(([date, dailyFixtures]) => (
            <div key={date} className="space-y-12">
              <div className="flex items-center gap-6">
                 <Calendar size={16} className="text-indigo-500" />
                 <h3 className="text-xl font-black text-white italic uppercase tracking-[0.4em]">{date}</h3>
                 <div className="flex-1 h-px bg-white/5"></div>
              </div>
              <div className="grid grid-cols-1 gap-12">
                {dailyFixtures.map(fixture => (
                  <MatchBanner 
                    key={fixture.id} 
                    fixture={fixture} 
                    players={players} 
                    onFinalize={finalizeMatch} 
                    onDelete={deleteFixture} 
                    isAuthorized={isAuthorized}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface MatchBannerProps {
  fixture: Fixture;
  players: Player[];
  onFinalize: (id: string, s1: number, s2: number) => void;
  onDelete: (id: string) => void;
  isAuthorized?: boolean;
}

const MatchBanner: React.FC<MatchBannerProps> = ({ fixture, players, onFinalize, onDelete, isAuthorized = false }) => {
  const p1 = players.find(p => p.id === fixture.p1Id);
  const p2 = players.find(p => p.id === fixture.p2Id);
  const t1 = TEAMS.find(t => t.id === p1?.teamId);
  const t2 = TEAMS.find(t => t.id === p2?.teamId);

  const [s1, setS1] = useState<number>(fixture.score1 ?? 0);
  const [s2, setS2] = useState<number>(fixture.score2 ?? 0);
  const [isScoringMode, setIsScoringMode] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!p1 || !p2) return null;

  const isFinished = fixture.status === 'finished';

  return (
    <div className="group relative w-full min-h-[400px] md:min-h-[480px] rounded-sm overflow-hidden border border-white/5 bg-[#010409] transition-all duration-700 hover:border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
      <div className="absolute inset-0 flex">
        <div className="relative w-1/2 h-full overflow-hidden">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#010409] via-transparent to-transparent"></div>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#010409] via-transparent to-transparent"></div>
          <img src={p1.avatar} className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 opacity-30 group-hover:opacity-60" style={{ objectPosition: p1.alignment ? `${p1.alignment.x}% ${p1.alignment.y}%` : 'center 20%' }} alt="" />
          {/* Increased overlay opacity from 0.3 to 0.45 */}
          <div className="absolute inset-0 mix-blend-color opacity-[0.45]" style={{ backgroundColor: t1?.secondary }}></div>
        </div>
        <div className="relative w-1/2 h-full overflow-hidden">
          <div className="absolute inset-0 z-10 bg-gradient-to-l from-[#010409] via-transparent to-transparent"></div>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#010409] via-transparent to-transparent"></div>
          <img src={p2.avatar} className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 opacity-30 group-hover:opacity-60" style={{ objectPosition: p2.alignment ? `${p2.alignment.x}% ${p2.alignment.y}%` : 'center 20%' }} alt="" />
          {/* Increased overlay opacity from 0.3 to 0.45 */}
          <div className="absolute inset-0 mix-blend-color opacity-[0.45]" style={{ backgroundColor: t2?.secondary }}></div>
        </div>
      </div>

      {isAuthorized && (
        <div className="absolute top-0 right-0 z-[120] pointer-events-auto">
          {showConfirmDelete ? (
            <div className="flex animate-in slide-in-from-right-4 duration-300">
              <button onClick={(e) => { e.stopPropagation(); onDelete(fixture.id); }} className="bg-red-600 text-white px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] italic flex items-center gap-3 hover:bg-red-500 transition-all border-b border-l border-white/20"><AlertCircle size={16} /> CONFIRM PURGE</button>
              <button onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(false); }} className="bg-slate-900 text-slate-500 px-6 py-6 text-[10px] font-black uppercase tracking-[0.4em] italic hover:text-white transition-all border-b border-white/10">CANCEL</button>
            </div>
          ) : (
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(true); }} className="p-8 bg-red-600/5 hover:bg-red-600 border-l border-b border-white/5 text-red-500/20 hover:text-white rounded-bl-sm transition-all shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer group/delbtn" title="Delete Match"><Trash2 size={24} strokeWidth={2.5} className="group-hover/delbtn:scale-110 transition-transform" /></button>
          )}
        </div>
      )}

      <div className="relative z-40 h-full flex flex-col justify-between py-12 px-8 md:px-20 pointer-events-none">
        <div className="w-full flex justify-between items-start">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-sm shadow-xl min-w-[70px] min-h-[70px] flex items-center justify-center">
                <img src={t1?.logo} className="h-14 w-auto object-contain" alt="" />
              </div>
              <div className="hidden sm:block">
                 <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">{p1.name}</h4>
                 <p className="text-[11px] font-bold uppercase tracking-[0.5em] mt-3 opacity-60 italic" style={{ color: t1?.secondary }}>{t1?.name}</p>
              </div>
           </div>

           <div className="flex flex-col items-center gap-3">
              <div className="bg-black/95 px-8 py-3 border border-white/5 rounded-full flex items-center gap-4 backdrop-blur-3xl shadow-xl">
                <div className={`w-2 h-2 rounded-full ${isFinished ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)]' : 'bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`}></div>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.6em] italic">{isFinished ? 'STAMPED' : 'AWAITING'}</span>
              </div>
              {p1.group === p2.group && (
                <div className="flex items-center gap-2 mt-2 px-4 py-1 bg-white/5 border border-white/10 rounded-full">
                  <Layers size={10} className="text-indigo-400" />
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">GROUP {p1.group} BATTLE</span>
                </div>
              )}
           </div>

           <div className="flex flex-row-reverse items-center gap-6 text-right">
              <div className="p-4 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-sm shadow-xl min-w-[70px] min-h-[70px] flex items-center justify-center">
                <img src={t2?.logo} className="h-14 w-auto object-contain" alt="" />
              </div>
              <div className="hidden sm:block">
                 <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">{p2.name}</h4>
                 <p className="text-[11px] font-bold uppercase tracking-[0.5em] mt-3 opacity-60 italic" style={{ color: t2?.secondary }}>{t2?.name}</p>
              </div>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto">
          {isFinished ? (
             <div className="flex flex-col items-center animate-in zoom-in duration-1000">
                <div className="flex items-center gap-16 md:gap-32">
                   <div className="flex flex-col items-center">
                      <span className="text-9xl md:text-[180px] font-black text-white italic tracking-tighter text-glow drop-shadow-[0_20px_60px_rgba(255,255,255,0.2)] leading-none">{fixture.score1}</span>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mt-6 italic">FINAL SCORE</span>
                   </div>
                   <div className="flex flex-col items-center opacity-20">
                      <div className="w-px h-32 bg-gradient-to-b from-transparent via-white to-transparent"></div>
                      <span className="text-2xl font-black text-white italic tracking-[0.6em] py-8">VS</span>
                      <div className="w-px h-32 bg-gradient-to-b from-transparent via-white to-transparent"></div>
                   </div>
                   <div className="flex flex-col items-center">
                      <span className="text-9xl md:text-[180px] font-black text-slate-900 italic tracking-tighter leading-none">{fixture.score2}</span>
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] mt-6 italic">AWAY RECORD</span>
                   </div>
                </div>
             </div>
          ) : isScoringMode && isAuthorized ? (
             <div className="flex flex-col items-center animate-in zoom-in duration-500 bg-[#020617]/95 backdrop-blur-3xl p-12 rounded-sm border border-indigo-500/30 shadow-[0_0_150px_rgba(0,0,0,1)] ring-1 ring-white/10 relative overflow-hidden group/hud">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-indigo-600 to-transparent"></div>
                <div className="flex items-center gap-12 md:gap-24">
                   <div className="flex flex-col items-center space-y-6">
                      <button onClick={() => setS1(s => s + 1)} className="p-5 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-transparent rounded-sm text-indigo-400 hover:text-white transition-all transform active:scale-95"><ChevronUp size={32} /></button>
                      <div className="w-40 h-40 bg-black border-2 border-indigo-500/30 rounded-sm flex items-center justify-center relative shadow-[inset_0_0_40px_rgba(79,70,229,0.1)]">
                         <span className="text-9xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{s1}</span>
                         <div className="absolute -top-3 left-4 px-4 bg-indigo-600 text-[9px] font-black text-white uppercase tracking-[0.3em] italic">HOME_STK</div>
                      </div>
                      <button onClick={() => setS1(s => Math.max(0, s - 1))} className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-slate-700 hover:text-white transition-all transform active:scale-95"><ChevronDown size={32} /></button>
                   </div>
                   <div className="flex flex-col items-center gap-10">
                      <div className="flex flex-col items-center">
                         <RefreshCw size={24} className="text-indigo-400 mb-4 animate-spin-slow opacity-50" />
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4">PROCESSING</span>
                      </div>
                      <button onClick={() => { onFinalize(fixture.id, s1, s2); setIsScoringMode(false); }} className="w-28 h-28 bg-white text-black rounded-sm flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-[0_30px_60px_rgba(0,0,0,0.8)] group/finalize ring-4 ring-white/10 hover:ring-indigo-500/20"><Check size={56} strokeWidth={4} className="group-hover/finalize:scale-125 transition-transform duration-500" /></button>
                      <button onClick={() => setIsScoringMode(false)} className="px-10 py-4 bg-slate-900 border border-white/5 text-slate-600 hover:text-red-500 hover:bg-red-950/30 transition-all text-[10px] font-black uppercase tracking-[0.5em] italic">DISCONNECT</button>
                   </div>
                   <div className="flex flex-col items-center space-y-6">
                      <button onClick={() => setS2(s => s + 1)} className="p-5 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-transparent rounded-sm text-indigo-400 hover:text-white transition-all transform active:scale-95"><ChevronUp size={32} /></button>
                      <div className="w-40 h-40 bg-black border-2 border-indigo-500/30 rounded-sm flex items-center justify-center relative shadow-[inset_0_0_40px_rgba(79,70,229,0.1)]">
                         <span className="text-9xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{s2}</span>
                         <div className="absolute -top-3 right-4 px-4 bg-indigo-600 text-[9px] font-black text-white uppercase tracking-[0.3em] italic">AWAY_STK</div>
                      </div>
                      <button onClick={() => setS2(s => Math.max(0, s - 1))} className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-slate-700 hover:text-white transition-all transform active:scale-95"><ChevronDown size={32} /></button>
                   </div>
                </div>
             </div>
          ) : (
             <div className="flex flex-col items-center">
                <div className="relative group/vs flex items-center justify-center">
                   <div className="absolute inset-0 bg-indigo-600/10 blur-[100px] opacity-0 group-hover/vs:opacity-100 transition-opacity duration-1000"></div>
                   <span className="text-9xl md:text-[220px] font-black text-white/10 italic tracking-tighter select-none uppercase">Arena</span>
                   <div className="absolute flex items-center justify-center">
                      <div className="h-2 w-64 bg-gradient-to-r from-transparent via-indigo-600 to-transparent absolute blur-2xl opacity-40"></div>
                      <Swords size={72} className="text-white drop-shadow-[0_0_40px_rgba(99,102,241,1)] animate-in zoom-in duration-1000" />
                   </div>
                </div>
                {isAuthorized ? (
                  <button onClick={() => setIsScoringMode(true)} className="mt-16 px-20 py-6 bg-white text-black text-[12px] font-black uppercase tracking-[0.6em] italic hover:bg-indigo-600 hover:text-white transition-all rounded-sm shadow-2xl relative overflow-hidden group/entrybtn"><span className="relative z-10">ENTER OUTCOME</span><div className="absolute inset-0 bg-indigo-500 translate-x-[-100%] group-hover/entrybtn:translate-x-0 transition-transform duration-500 -z-0"></div></button>
                ) : (
                   <div className="mt-12 flex items-center gap-4 opacity-30">
                      <Terminal size={14} className="text-slate-700" />
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] italic">Waiting for official confirmation</p>
                   </div>
                )}
             </div>
          )}
        </div>

        <div className="w-full flex justify-between items-end pointer-events-auto">
           <div className="flex items-center gap-5 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
              <Calendar size={18} className="text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] leading-none mb-2">ENGAGEMENT LOG</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">{new Date(fixture.timestamp).toLocaleString()}</span>
              </div>
           </div>
           <div className="flex items-center gap-8 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
              <div className="text-right">
                <span className="block text-[9px] font-black text-slate-800 group-hover:text-indigo-900 uppercase tracking-widest mb-1 transition-colors">SECTOR IDENTIFIER</span>
                <span className="text-[12px] font-bold text-slate-700 group-hover:text-slate-500 uppercase tracking-[0.5em] transition-colors">ALPHA-R7 / STABLE</span>
              </div>
              <Monitor size={20} className="text-slate-800 group-hover:text-indigo-900 transition-colors" />
           </div>
        </div>
      </div>
    </div>
  );
};

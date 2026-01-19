
import React, { useState } from 'react';
import { Player, Fixture } from '../types';
import { TEAMS } from '../constants';
import { 
  Swords, Calendar, Plus, 
  Trash2, Check, X, 
  Zap, ChevronLeft, ChevronUp, ChevronDown,
  Monitor, LayoutGrid, Maximize2, AlertCircle, Layers
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
  const [isGridView, setIsGridView] = useState(true);

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
    setP1Id(0); setP2Id(0); setIsAdding(false);
  };

  const finalizeMatch = (fixtureId: string, s1: number, s2: number) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;
    const p1 = players.find(p => p.id === fixture.p1Id);
    const p2 = players.find(p => p.id === fixture.p2Id);
    if (p1 && p2) {
      if (s1 > s2) {
        onUpdatePlayer({ ...p1, wins: (p1.wins || 0) + 1 });
        onUpdatePlayer({ ...p2, losses: (p2.losses || 0) + 1 });
      } else if (s2 > s1) {
        onUpdatePlayer({ ...p2, wins: (p2.wins || 0) + 1 });
        onUpdatePlayer({ ...p1, losses: (p1.losses || 0) + 1 });
      }
    }
    onUpdateFixtures(fixtures.map(f => f.id === fixtureId ? { ...f, score1: s1, score2: s2, status: 'finished' } : f));
  };

  const deleteFixture = (id: string) => {
    if (window.confirm("PURGE MATCH: Remove this record from history?")) {
      onUpdateFixtures(fixtures.filter(f => f.id !== id));
    }
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
          <button onClick={onBack} className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-white transition-all shadow-xl">
            <ChevronLeft size={24} />
          </button>
          <div>
             <div className="flex items-center space-x-2 text-indigo-400">
               <Zap size={12} className="fill-indigo-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em]">Arena Command Center</span>
             </div>
             <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mt-1">Match Registry</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900/50 p-1 rounded-sm border border-white/5">
            <button onClick={() => setIsGridView(true)} className={`p-3 rounded-sm transition-all ${isGridView ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setIsGridView(false)} className={`p-3 rounded-sm transition-all ${!isGridView ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>
              <Maximize2 size={16} />
            </button>
          </div>
          {isAuthorized && (
            <button onClick={() => setIsAdding(!isAdding)} className={`px-8 py-4 rounded-sm border transition-all flex items-center gap-3 ${isAdding ? 'bg-red-600/10 border-red-500/30 text-red-500' : 'bg-white text-black hover:bg-indigo-600 hover:text-white'}`}>
              {isAdding ? <X size={16} /> : <Plus size={16} />}
              <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">FIXTURE</span>
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="bg-slate-900/40 border border-indigo-500/20 rounded-sm p-8 animate-in zoom-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
              <select value={p1Id || ""} onChange={e => setP1Id(Number(e.target.value))} className="w-full bg-slate-950 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest focus:border-indigo-500 outline-none">
                 <option value="">Home Athlete</option>
                 {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Swords size={24} className="text-slate-700" />
              <select value={p2Id || ""} onChange={e => setP2Id(Number(e.target.value))} className="w-full bg-slate-950 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest focus:border-indigo-500 outline-none">
                 <option value="">Away Athlete</option>
                 {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
           </div>
           <button onClick={addFixture} disabled={!p1Id || !p2Id || p1Id === p2Id} className="w-full mt-6 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white font-black uppercase tracking-[0.5em] text-[10px] rounded-sm transition-all">DEPLOY MATCH</button>
        </div>
      )}

      <div className="space-y-16">
        {Object.entries(groupedFixtures).map(([date, dailyFixtures]) => (
          <div key={date} className="space-y-8">
            <div className="flex items-center gap-4">
               <Calendar size={14} className="text-indigo-500" />
               <h3 className="text-sm font-black text-white italic uppercase tracking-[0.4em]">{date}</h3>
               <div className="flex-1 h-[1px] bg-white/5"></div>
            </div>
            <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-10"}>
              {dailyFixtures.map(fixture => (
                isGridView ? (
                  <CompactMatchCard key={fixture.id} fixture={fixture} players={players} onFinalize={finalizeMatch} onDelete={deleteFixture} isAuthorized={isAuthorized} />
                ) : (
                  <MatchBanner key={fixture.id} fixture={fixture} players={players} onFinalize={finalizeMatch} onDelete={deleteFixture} isAuthorized={isAuthorized} />
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CompactMatchCard: React.FC<{fixture: Fixture, players: Player[], onFinalize: any, onDelete: any, isAuthorized: boolean}> = ({ fixture, players, onFinalize, onDelete, isAuthorized }) => {
  const p1 = players.find(p => p.id === fixture.p1Id);
  const p2 = players.find(p => p.id === fixture.p2Id);
  const t1 = TEAMS.find(t => t.id === p1?.teamId);
  const t2 = TEAMS.find(t => t.id === p2?.teamId);
  const [s1, setS1] = useState(fixture.score1 ?? 0);
  const [s2, setS2] = useState(fixture.score2 ?? 0);
  const [isEditing, setIsEditing] = useState(false);

  if (!p1 || !p2) return null;
  const isFinished = fixture.status === 'finished';

  return (
    <div className={`group relative p-6 rounded-sm border bg-slate-900/40 transition-all duration-300 ${isFinished ? 'border-white/5' : 'border-white/10 hover:border-indigo-500/30 hover:bg-slate-900/60'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Layers size={10} className="text-indigo-400" />
          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">GROUP {p1.group}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-black/40">
              <img 
                src={p1.avatar} 
                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" 
                style={{ objectPosition: p1.alignment ? `${p1.alignment.x}% ${p1.alignment.y}%` : 'center 20%' }}
                alt="" 
              />
            </div>
            <img src={t1?.logo} className="absolute -bottom-1 -right-1 w-6 h-6 object-contain bg-slate-900 rounded-full p-1 border border-white/20" alt="" />
          </div>
          <p className="text-[10px] font-black text-white uppercase italic truncate w-full text-center">{p1.name}</p>
        </div>
        
        <div className="flex flex-col items-center">
          {isFinished ? (
            <div className="text-2xl font-black text-white italic flex items-center gap-3">
              <span className={fixture.score1! > fixture.score2! ? 'text-blue-500' : 'text-white'}>{fixture.score1}</span>
              <span className="text-slate-800">-</span>
              <span className={fixture.score2! > fixture.score1! ? 'text-blue-500' : 'text-white'}>{fixture.score2}</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center">
               <span className="text-[9px] font-black text-slate-700 italic">VS</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-black/40">
              <img 
                src={p2.avatar} 
                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" 
                style={{ objectPosition: p2.alignment ? `${p2.alignment.x}% ${p2.alignment.y}%` : 'center 20%' }}
                alt="" 
              />
            </div>
            <img src={t2?.logo} className="absolute -bottom-1 -right-1 w-6 h-6 object-contain bg-slate-900 rounded-full p-1 border border-white/20" alt="" />
          </div>
          <p className="text-[10px] font-black text-white uppercase italic truncate w-full text-center">{p2.name}</p>
        </div>
      </div>

      {isAuthorized && !isFinished && (
        <div className="mt-6 pt-6 border-t border-white/5">
          {isEditing ? (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-center gap-4">
                <input type="number" value={s1} onChange={e => setS1(Number(e.target.value))} className="w-14 bg-black border border-white/10 rounded-sm p-2 text-center text-white font-black" />
                <input type="number" value={s2} onChange={e => setS2(Number(e.target.value))} className="w-14 bg-black border border-white/10 rounded-sm p-2 text-center text-white font-black" />
              </div>
              <button onClick={() => onFinalize(fixture.id, s1, s2)} className="w-full bg-blue-600 text-white text-[9px] font-black py-2 rounded-sm uppercase tracking-widest">COMMIT</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(true)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-sm text-[8px] font-black text-white uppercase tracking-widest">LOG RESULT</button>
              <button onClick={() => onDelete(fixture.id)} className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-sm"><Trash2 size={12} /></button>
            </div>
          )}
        </div>
      )}
      {isFinished && isAuthorized && (
        <button onClick={() => onDelete(fixture.id)} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><Trash2 size={10} /></button>
      )}
    </div>
  );
};

const MatchBanner: React.FC<{fixture: Fixture, players: Player[], onFinalize: any, onDelete: any, isAuthorized: boolean}> = ({ fixture, players, onFinalize, onDelete, isAuthorized }) => {
  const p1 = players.find(p => p.id === fixture.p1Id);
  const p2 = players.find(p => p.id === fixture.p2Id);
  const t1 = TEAMS.find(t => t.id === p1?.teamId);
  const t2 = TEAMS.find(t => t.id === p2?.teamId);
  const [s1, setS1] = useState(fixture.score1 ?? 0);
  const [s2, setS2] = useState(fixture.score2 ?? 0);
  const [isScoring, setIsScoring] = useState(false);

  if (!p1 || !p2) return null;
  const isFinished = fixture.status === 'finished';

  return (
    <div className="group relative w-full aspect-[21/9] md:aspect-[24/10] rounded-sm overflow-hidden border border-white/5 bg-[#010409] shadow-2xl">
      {/* Background Portraits Layer */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 relative overflow-hidden">
          <img 
            src={p1.avatar} 
            className="w-full h-full object-cover opacity-90 transition-all duration-1000 group-hover:scale-105" 
            style={{ objectPosition: p1.alignment ? `${p1.alignment.x}% ${p1.alignment.y}%` : 'center 10%' }} 
            alt={p1.name} 
          />
          {/* Vignette focused on bottom for names */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#010409] via-[#010409]/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#010409] via-transparent to-transparent"></div>
        </div>
        <div className="w-1/2 relative overflow-hidden border-l border-white/5">
          <img 
            src={p2.avatar} 
            className="w-full h-full object-cover opacity-90 transition-all duration-1000 group-hover:scale-105" 
            style={{ objectPosition: p2.alignment ? `${p2.alignment.x}% ${p2.alignment.y}%` : 'center 10%' }} 
            alt={p2.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010409] via-[#010409]/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-[#010409] via-transparent to-transparent"></div>
        </div>
      </div>
      
      {/* Broadcast Content Layer */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-12">
        <div className="flex items-end justify-between px-20 w-full h-full">
          
          {/* P1 Identity: Bottom Centered */}
          <div className="flex-1 flex flex-col items-center justify-center pb-2">
            <div className="mb-4 flex items-center justify-center p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20 w-14 h-14 shadow-2xl transition-transform duration-500 group-hover:scale-110">
              <img src={t1?.logo} className="w-9 h-9 object-contain" alt={t1?.name} />
            </div>
            <h4 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter text-glow drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] leading-none text-center">
              {p1.name}
            </h4>
          </div>

          {/* Central Control Panel */}
          <div className="px-10 h-full flex flex-col items-center justify-center">
            {isFinished ? (
              <div className="flex flex-col items-center gap-4">
                 <div className="flex items-center gap-6 bg-white text-black px-12 py-5 rounded-sm italic font-black text-6xl md:text-8xl shadow-[0_0_50px_rgba(255,255,255,0.15)] transform -translate-y-8">
                   <span>{fixture.score1}</span>
                   <div className="w-[3px] h-12 bg-black/10"></div>
                   <span>{fixture.score2}</span>
                 </div>
                 <div className="px-4 py-1 bg-indigo-600 rounded-full animate-in fade-in slide-in-from-top-4">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Final Result</span>
                 </div>
              </div>
            ) : isScoring ? (
              <div className="flex items-center gap-6 bg-black/90 p-8 rounded-sm border border-indigo-500/40 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in-95 -translate-y-16">
                 <input type="number" value={s1} onChange={e => setS1(Number(e.target.value))} className="w-24 bg-slate-900 border border-white/10 rounded-sm text-center text-6xl font-black text-white outline-none" />
                 <button onClick={() => onFinalize(fixture.id, s1, s2)} className="p-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm transition-all shadow-xl"><Check size={40} /></button>
                 <input type="number" value={s2} onChange={e => setS2(Number(e.target.value))} className="w-24 bg-slate-900 border border-white/10 rounded-sm text-center text-6xl font-black text-white outline-none" />
              </div>
            ) : (
              <div className="relative flex flex-col items-center group/swords cursor-pointer -translate-y-12" onClick={() => isAuthorized && setIsScoring(true)}>
                 <div className="w-28 h-28 rounded-full border border-white/5 flex items-center justify-center bg-black/30 backdrop-blur-sm group-hover/swords:border-indigo-500/50 group-hover/swords:bg-black/50 transition-all duration-700">
                    <Swords size={48} className="text-white opacity-10 group-hover/swords:opacity-100 group-hover/swords:text-indigo-500 transition-all duration-500" />
                 </div>
                 <div className="absolute -bottom-8 whitespace-nowrap">
                    <span className="text-sm font-black text-indigo-500/60 italic tracking-[0.8em] animate-pulse">ARENA LIVE</span>
                 </div>
              </div>
            )}
          </div>

          {/* P2 Identity: Bottom Centered */}
          <div className="flex-1 flex flex-col items-center justify-center pb-2">
            <div className="mb-4 flex items-center justify-center p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20 w-14 h-14 shadow-2xl transition-transform duration-500 group-hover:scale-110">
              <img src={t2?.logo} className="w-9 h-9 object-contain" alt={t2?.name} />
            </div>
            <h4 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter text-glow drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] leading-none text-center">
              {p2.name}
            </h4>
          </div>

        </div>
      </div>

      {/* Persistent Info Overlays */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#010409]/80 backdrop-blur-md border border-white/10 pl-3 pr-4 py-1.5 rounded-full">
          <Layers size={12} className="text-indigo-500" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic leading-none">GROUP {p1.group}</span>
        </div>
      </div>

      {/* Decorative Scanline Effect on Hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-1000 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_3px)]"></div>

      {isAuthorized && (
        <button onClick={() => onDelete(fixture.id)} className="absolute top-8 right-8 p-4 text-white/20 hover:text-red-500 transition-all z-20"><Trash2 size={24} /></button>
      )}
    </div>
  );
};

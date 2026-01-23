
import React, { useState, useMemo } from 'react';
import { Player, Fixture } from '../types';
import { TEAMS } from '../constants';
import { 
  Swords, Calendar, Plus, 
  Trash2, Check, X, 
  Zap, ChevronLeft, LayoutGrid, Maximize2, Layers, Save, Edit3
} from 'lucide-react';
import { updateScore } from '../services/fixtures.service'

await updateScore(match.id, scoreA, scoreB)


interface MatchCenterProps {
  players: Player[];
  fixtures: Fixture[];
  onUpdateFixtures: (fixtures: Fixture[]) => void;
  onUpdatePlayer: (player: Player) => void;
  onBack: () => void;
  onDeleteFixture?: (id: string) => void;
  isAuthorized?: boolean;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({ 
  players, fixtures, onUpdateFixtures, onUpdatePlayer, onBack, onDeleteFixture, isAuthorized = false
}) => {
  const [p1Id, setP1Id] = useState<number>(0);
  const [p2Id, setP2Id] = useState<number>(0);
  const [dayLabel, setDayLabel] = useState("");
  const [matchNumber, setMatchNumber] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  const addFixture = () => {
    if (!p1Id || !p2Id || p1Id === p2Id || !dayLabel) return;
    const newFixture: Fixture = {
      id: `manual-${Math.random().toString(36).substring(2, 7)}`,
      p1Id: p1Id,
      p2Id: p2Id,
      status: 'scheduled',
      timestamp: Date.now(),
      dayLabel: dayLabel,
      matchNumber: matchNumber
    };
    onUpdateFixtures([...fixtures, newFixture]);
    setP1Id(0); setP2Id(0); setIsAdding(false);
  };

  /**
   * AUTHORITATIVE SCORE SAVE LOGIC
   * 1. Validates input
   * 2. Maps fixtures to update specifically the target ID
   * 3. Pushes to Firestore via onUpdateFixtures
   * 4. Logs to console as requested
   */
  const handleScoreUpdate = async (fixtureId: string, s1: number, s2: number) => {
    try {
      if (!Number.isInteger(s1) || !Number.isInteger(s2) || s1 < 0 || s2 < 0) {
        throw new Error("Scores must be non-negative integers.");
      }

      const updatedFixtures = fixtures.map(f => 
        f.id === fixtureId 
          ? { ...f, score1: s1, score2: s2, status: 'finished' as const } 
          : f
      );
      
      await onUpdateFixtures(updatedFixtures);
      console.log("SCORE SAVED", fixtureId, s1, s2);
    } catch (error: any) {
      console.error("Score Update Failed:", error);
      alert(error.code ? `${error.code}: ${error.message}` : error.message);
    }
  };

  const groupedFixtures = useMemo(() => {
    const days: Record<string, Fixture[]> = {};
    const order: string[] = [];
    fixtures.forEach(f => {
      const label = f.dayLabel || new Date(f.timestamp).toLocaleDateString();
      if (!days[label]) {
        days[label] = [];
        order.push(label);
      }
      days[label].push(f);
    });
    order.forEach(day => {
      days[day].sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
    });
    return { days, order };
  }, [fixtures]);

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
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <input type="text" placeholder="Day (e.g. Monday 19)" value={dayLabel} onChange={e => setDayLabel(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest focus:border-indigo-500 outline-none" />
              <input type="number" placeholder="Match #" value={matchNumber} onChange={e => setMatchNumber(parseInt(e.target.value))} className="w-full bg-slate-950 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest focus:border-indigo-500 outline-none" />
              <select value={p1Id || ""} onChange={e => setP1Id(Number(e.target.value))} className="w-full bg-slate-950 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest focus:border-indigo-500 outline-none">
                 <option value="">Home Athlete</option>
                 {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={p2Id || ""} onChange={e => setP2Id(Number(e.target.value))} className="w-full bg-slate-950 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest focus:border-indigo-500 outline-none">
                 <option value="">Away Athlete</option>
                 {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
           </div>
           <button onClick={addFixture} disabled={!p1Id || !p2Id || p1Id === p2Id || !dayLabel} className="w-full mt-2 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white font-black uppercase tracking-[0.5em] text-[10px] rounded-sm transition-all">DEPLOY MATCH</button>
        </div>
      )}

      <div className="space-y-16">
        {groupedFixtures.order.map(day => (
          <div key={day} className="space-y-8">
            <div className="flex items-center gap-4">
               <Calendar size={14} className="text-indigo-500" />
               <h3 className="text-sm font-black text-white italic uppercase tracking-[0.4em]">{day}</h3>
               <div className="flex-1 h-[1px] bg-white/5"></div>
            </div>
            <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
              {groupedFixtures.days[day].map(fixture => (
                <CompactMatchCard 
                  key={fixture.id} 
                  fixture={fixture} 
                  players={players} 
                  onFinalize={handleScoreUpdate} 
                  onDelete={onDeleteFixture} 
                  isAuthorized={isAuthorized} 
                  isGridView={isGridView}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CompactMatchCard: React.FC<{fixture: Fixture, players: Player[], onFinalize: (id: string, s1: number, s2: number) => void, onDelete: any, isAuthorized: boolean, isGridView: boolean}> = ({ fixture, players, onFinalize, onDelete, isAuthorized, isGridView }) => {
  const p1 = players.find(p => p.id === fixture.p1Id);
  const p2 = players.find(p => p.id === fixture.p2Id);
  const t1 = TEAMS.find(t => t.id === p1?.teamId);
  const t2 = TEAMS.find(t => t.id === p2?.teamId);
  const [s1, setS1] = useState(fixture.score1 ?? 0);
  const [s2, setS2] = useState(fixture.score2 ?? 0);
  const [isEditing, setIsEditing] = useState(false);

  if (!p1 || !p2) return null;
  const isFinished = fixture.status === 'finished';

  const renderPlayer = (p: Player, t: any) => (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className={`w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-black/40 ${isFinished && fixture.score1 !== fixture.score2 ? ((p.id === p1.id && fixture.score1! > fixture.score2!) || (p.id === p2.id && fixture.score2! > fixture.score1!) ? 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'opacity-40 grayscale') : ''}`}>
          <img 
            src={p.avatar} 
            className="w-full h-full object-cover" 
            style={{ objectPosition: p.alignment ? `${p.alignment.x}% ${p.alignment.y}%` : 'center 20%' }}
            alt="" 
          />
        </div>
        <img src={t?.logo} className="absolute -bottom-1 -right-1 w-6 h-6 object-contain bg-slate-900 rounded-full p-1 border border-white/20" alt="" />
      </div>
      <p className="text-[10px] font-black text-white uppercase italic truncate w-full text-center">{p.name}</p>
    </div>
  );

  return (
    <div className={`group relative p-6 rounded-sm border bg-slate-900/40 transition-all duration-300 ${isFinished ? 'border-white/5' : 'border-white/10'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Layers size={10} className="text-indigo-400" />
          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest italic">MATCH {fixture.matchNumber}</span>
        </div>
        {isFinished && (
           <div className="px-2 py-0.5 bg-blue-600/10 border border-blue-600/20 rounded-full">
              <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic">Official Result</span>
           </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {renderPlayer(p1, t1)}
        
        <div className="flex flex-col items-center">
          {isFinished && !isEditing ? (
            <div className="flex flex-col items-center">
              <div className="text-3xl font-black text-white italic flex items-center gap-3">
                <span className={fixture.score1! > fixture.score2! ? 'text-blue-500' : 'text-white'}>{fixture.score1}</span>
                <span className="text-slate-800 text-lg">-</span>
                <span className={fixture.score2! > fixture.score1! ? 'text-blue-500' : 'text-white'}>{fixture.score2}</span>
              </div>
              {isAuthorized && (
                <button 
                  onClick={() => { setIsEditing(true); setS1(fixture.score1!); setS2(fixture.score2!); }}
                  className="mt-3 p-1.5 text-slate-700 hover:text-white transition-colors"
                >
                  <Edit3 size={12} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {(!isFinished || isEditing) && isAuthorized ? (
                 <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <input type="number" value={s1} onChange={e => setS1(Math.max(0, parseInt(e.target.value) || 0))} className="w-12 bg-black/60 border border-white/10 rounded-sm py-2 text-center text-lg font-black text-white focus:border-blue-500 outline-none" />
                      <span className="text-slate-700">:</span>
                      <input type="number" value={s2} onChange={e => setS2(Math.max(0, parseInt(e.target.value) || 0))} className="w-12 bg-black/60 border border-white/10 rounded-sm py-2 text-center text-lg font-black text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { onFinalize(fixture.id, s1, s2); setIsEditing(false); }} className="p-2 bg-blue-600 text-white rounded-sm hover:bg-blue-500"><Save size={12} /></button>
                      {isEditing && <button onClick={() => setIsEditing(false)} className="p-2 bg-white/5 text-slate-400 rounded-sm"><X size={12} /></button>}
                    </div>
                 </div>
              ) : (
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center bg-black/20">
                   <span className="text-[9px] font-black text-slate-700 italic">VS</span>
                </div>
              )}
            </div>
          )}
        </div>

        {renderPlayer(p2, t2)}
      </div>

      {isAuthorized && isFinished && !isEditing && (
        <button 
          onClick={() => onDelete(fixture.id)} 
          className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-500 transition-all"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};

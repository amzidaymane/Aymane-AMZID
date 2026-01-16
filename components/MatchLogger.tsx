
import React, { useState } from 'react';
import { Player, Team, Match } from '../types';
import { TEAMS } from '../constants';
import { Trophy, Check, Zap } from 'lucide-react';

interface MatchLoggerProps {
  players: Player[];
  onLogMatch: (match: Match) => void;
}

export const MatchLogger: React.FC<MatchLoggerProps> = ({ players, onLogMatch }) => {
  const [p1Id, setP1Id] = useState<number | ''>('');
  const [p2Id, setP2Id] = useState<number | ''>('');
  const [s1, setS1] = useState<number>(0);
  const [s2, setS2] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (p1Id === '' || p2Id === '' || p1Id === p2Id) return;

    onLogMatch({
      id: Math.random().toString(36).substr(2, 9),
      player1Id: p1Id as number,
      player2Id: p2Id as number,
      score1: s1,
      score2: s2,
      timestamp: Date.now(),
    });

    setP1Id('');
    setP2Id('');
    setS1(0);
    setS2(0);
  };

  const getTeamLogo = (playerId: number) => {
    const p = players.find(x => x.id === playerId);
    if (!p) return null;
    return TEAMS.find(t => t.id === p.teamId)?.logo;
  };

  return (
    <div className="max-w-4xl mx-auto glass-panel border-white/10 rounded-sm p-12 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Zap size={120} className="text-white" strokeWidth={0.5} />
      </div>

      <div className="flex items-center space-x-6 mb-12 relative z-10">
        <div className="h-10 w-1.5 bg-blue-600"></div>
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Record Outcome</h2>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em] mt-2">Official match validation module</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
          
          <div className="space-y-6">
            <div className="h-40 flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-sm p-4 transition-all">
              {p1Id ? (
                <div className="text-center animate-in zoom-in duration-300">
                  <div className="relative mb-4 group/logo">
                    <div className="absolute inset-0 bg-white/5 blur-xl rounded-full opacity-50"></div>
                    <img src={getTeamLogo(p1Id as number) || ''} className="w-16 h-16 object-contain drop-shadow-2xl relative z-10" alt="" />
                  </div>
                  <p className="text-[14px] font-black text-white uppercase tracking-widest truncate max-w-[200px] italic">
                    {players.find(p => p.id === p1Id)?.name}
                  </p>
                </div>
              ) : (
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">Initialize Side A</span>
              )}
            </div>
            <select 
              value={p1Id} 
              onChange={e => setP1Id(Number(e.target.value))}
              className="w-full bg-slate-900 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Home Participant</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input 
              type="number" 
              min="0"
              value={s1}
              onChange={e => setS1(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/5 rounded-sm px-6 py-6 text-center text-5xl font-black text-white focus:outline-none focus:border-white/10 transition-all placeholder-slate-900"
              placeholder="0"
            />
          </div>

          <div className="flex flex-col items-center justify-center pt-24">
            <span className="text-5xl font-black text-slate-900 italic opacity-40">VS</span>
          </div>

          <div className="space-y-6">
            <div className="h-40 flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-sm p-4 transition-all">
              {p2Id ? (
                <div className="text-center animate-in zoom-in duration-300">
                  <div className="relative mb-4 group/logo">
                    <div className="absolute inset-0 bg-white/5 blur-xl rounded-full opacity-50"></div>
                    <img src={getTeamLogo(p2Id as number) || ''} className="w-16 h-16 object-contain drop-shadow-2xl relative z-10" alt="" />
                  </div>
                  <p className="text-[14px] font-black text-white uppercase tracking-widest truncate max-w-[200px] italic">
                    {players.find(p => p.id === p2Id)?.name}
                  </p>
                </div>
              ) : (
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">Initialize Side B</span>
              )}
            </div>
            <select 
              value={p2Id} 
              onChange={e => setP2Id(Number(e.target.value))}
              className="w-full bg-slate-900 border border-white/10 rounded-sm px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Away Participant</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input 
              type="number" 
              min="0"
              value={s2}
              onChange={e => setS2(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/5 rounded-sm px-6 py-6 text-center text-5xl font-black text-white focus:outline-none focus:border-white/10 transition-all placeholder-slate-900"
              placeholder="0"
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-white hover:bg-blue-600 hover:text-white text-black font-black uppercase tracking-[0.5em] text-[11px] py-6 rounded-sm shadow-2xl transition-all flex items-center justify-center space-x-4 group"
        >
          <Check size={18} strokeWidth={4} className="group-hover:scale-125 transition-transform" />
          <span>Authorize Log Entry</span>
        </button>
      </form>
    </div>
  );
};

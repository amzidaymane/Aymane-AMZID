
import React, { useMemo, useState } from 'react';
import { Player } from '../types';
import { TEAMS } from '../constants';
import { Trophy, ChevronLeft, Award, ShieldCheck, Zap, Activity, Edit3, Save, Minus, Plus } from 'lucide-react';

interface GroupStageProps {
  players: Player[];
  onUpdatePlayer: (player: Player) => void;
  onBack: () => void;
  isAuthorized?: boolean;
}

export const GroupStage: React.FC<GroupStageProps> = ({ players, onUpdatePlayer, onBack, isAuthorized = false }) => {
  const [isManagementMode, setIsManagementMode] = useState(false);

  const groups = useMemo(() => {
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    return groupNames.map(g => {
      const groupPlayers = players.filter(p => p.group === g || (!p.group && g === 'A'))
        .sort((a, b) => {
          if (isManagementMode) return a.name.localeCompare(b.name);
          return (b.wins * 3) - (a.wins * 3) || a.losses - b.losses || a.name.localeCompare(b.name);
        });
        
      return { name: `GROUP ${g}`, players: groupPlayers };
    });
  }, [players, isManagementMode]);

  const toggleAdvance = (player: Player) => {
    onUpdatePlayer({ ...player, isQualified: !player.isQualified });
  };

  const adjustStat = (player: Player, stat: 'wins' | 'losses', amount: number) => {
    const currentVal = Number(player[stat]) || 0;
    const newValue = Math.max(0, currentVal + amount);
    onUpdatePlayer({ ...player, [stat]: newValue });
  };

  const changeGroup = (player: Player, newGroup: string) => {
    onUpdatePlayer({ ...player, group: newGroup });
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/10 pb-12">
        <div className="flex items-center space-x-6">
          <button 
            onClick={onBack}
            className="group p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-white transition-all shadow-xl"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-2">
             <div className="flex items-center space-x-2">
               <Zap size={12} className="text-blue-400 fill-blue-400" />
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Tournament Controller</span>
             </div>
             <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none text-glow">Standings</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {isAuthorized && (
             <button 
               onClick={() => setIsManagementMode(!isManagementMode)}
               className={`px-8 py-4 rounded-sm border transition-all flex items-center gap-3 ${
                 isManagementMode 
                 ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                 : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
               }`}
             >
               {isManagementMode ? <Save size={16} /> : <Edit3 size={16} />}
               <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">
                 {isManagementMode ? 'Lock Changes' : 'Manage Stats'}
               </span>
             </button>
           )}
           
           <div className="bg-slate-900 border border-white/10 px-6 py-4 rounded-sm hidden sm:flex items-center space-x-3">
              <Activity size={16} className="text-blue-500" />
              <div>
                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest italic leading-tight">Athletes</span>
                <span className="text-lg font-black text-white italic">{players.length} TOTAL</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {groups.map((group, idx) => (
          <div 
            key={idx} 
            className="relative rounded-sm overflow-hidden border border-white/10 transition-all duration-500 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="px-8 py-6 flex items-center justify-between border-b border-white/10 bg-slate-900/40">
               <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 rounded-sm flex items-center justify-center border bg-blue-600 text-white border-blue-500">
                    <Trophy size={20} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{group.name}</h3>
                   <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5 italic">Live Analysis</span>
                 </div>
               </div>
            </div>
            
            <div className="p-3 space-y-3 min-h-[100px]">
              {group.players.length === 0 ? (
                <div className="py-12 text-center opacity-20">
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Sector Unassigned</p>
                </div>
              ) : (
                group.players.map((p, pIdx) => {
                  const team = TEAMS.find(t => t.id === p.teamId);
                  
                  return (
                    <div 
                      key={p.id} 
                      className={`relative flex flex-col md:flex-row items-center justify-between p-4 rounded-sm border transition-all duration-300 gap-4 ${
                        p.isQualified 
                        ? 'bg-blue-600/10 border-blue-600/40 shadow-[0_0_30px_rgba(37,99,235,0.05)]' 
                        : 'bg-transparent border-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0 w-full">
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm font-black italic rounded-sm border ${
                          p.isQualified 
                          ? 'bg-blue-600 text-white border-blue-500' 
                          : 'bg-slate-900 text-slate-600 border-white/10'
                        }`}>
                          {pIdx + 1}
                        </div>
                        
                        <div className="relative flex-shrink-0">
                          <div className={`w-14 h-14 bg-slate-950 rounded-sm border-2 overflow-hidden ${
                            p.isQualified ? 'border-blue-600' : 'border-white/10'
                          }`}>
                             <img src={p.avatar} alt="" className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" />
                          </div>
                          <img src={team?.logo} className="absolute -bottom-1 -right-1 w-6 h-6 object-contain bg-slate-950 rounded-sm p-0.5 border border-white/20" alt="" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-lg font-black text-white uppercase italic tracking-tight leading-none truncate max-w-[120px] md:max-w-none">
                              {p.name}
                            </p>
                            {p.isQualified && (
                              <div className="px-2 py-0.5 bg-blue-600 rounded-sm flex items-center space-x-1">
                                <ShieldCheck size={8} className="text-white" />
                                <span className="text-[7px] font-black text-white uppercase tracking-widest">ADVANCED</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic mt-1">{team?.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto md:pl-6 md:border-l border-white/5">
                         <div className="flex items-center gap-4 flex-1 md:flex-initial justify-center md:justify-end">
                            {isManagementMode && isAuthorized ? (
                              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-sm border border-white/10 shadow-inner">
                                <div className="flex flex-col gap-1 pr-2 border-r border-white/10">
                                  <label className="text-[6px] font-black text-slate-600 uppercase italic text-center">Group</label>
                                  <select 
                                    value={p.group} 
                                    onChange={(e) => changeGroup(p, e.target.value)}
                                    className="bg-slate-900 text-[10px] font-black text-white border border-white/10 rounded-sm outline-none px-1 py-0.5"
                                  >
                                    {['A', 'B', 'C', 'D', 'E', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                                  </select>
                                </div>

                                <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                                  <div className="text-center">
                                    <span className="block text-[6px] font-black text-slate-600 uppercase italic leading-none mb-1">Wins</span>
                                    <span className="text-xl font-black text-white italic min-w-[20px] inline-block">{p.wins}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <button onClick={() => adjustStat(p, 'wins', 1)} className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-[2px] transition-colors"><Plus size={10} /></button>
                                    <button onClick={() => adjustStat(p, 'wins', -1)} className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-[2px] transition-colors"><Minus size={10} /></button>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                                  <div className="text-center">
                                    <span className="block text-[6px] font-black text-slate-600 uppercase italic leading-none mb-1">Loss</span>
                                    <span className="text-xl font-black text-white italic min-w-[20px] inline-block">{p.losses}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <button onClick={() => adjustStat(p, 'losses', 1)} className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-[2px] transition-colors"><Plus size={10} /></button>
                                    <button onClick={() => adjustStat(p, 'losses', -1)} className="w-6 h-6 flex items-center justify-center bg-red-950 hover:bg-red-800 text-white rounded-[2px] transition-colors"><Minus size={10} /></button>
                                  </div>
                                </div>

                                <div className="pl-1">
                                   <button 
                                     onClick={() => toggleAdvance(p)}
                                     className={`w-10 h-10 flex items-center justify-center rounded-sm border text-[7px] font-black uppercase transition-all ${
                                       p.isQualified 
                                       ? 'bg-blue-600 border-blue-500 text-white' 
                                       : 'bg-transparent border-white/10 text-slate-600 hover:text-white hover:border-white/20'
                                     }`}
                                   >
                                     {p.isQualified ? 'DONE' : 'ADV'}
                                   </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-6 pr-2">
                                <div className="text-center">
                                   <span className="block text-[7px] font-black text-slate-600 uppercase italic mb-0.5">Wins</span>
                                   <span className="text-lg font-black text-white italic">{p.wins}</span>
                                </div>
                                <div className="text-center">
                                   <span className="block text-[7px] font-black text-slate-600 uppercase italic mb-0.5">Loss</span>
                                   <span className="text-lg font-black text-slate-800 italic">{p.losses}</span>
                                </div>
                              </div>
                            )}
                         </div>
                         
                         <div className={`flex flex-col items-center justify-center w-16 h-14 rounded-sm border-2 transition-all flex-shrink-0 ${
                           isManagementMode ? 'opacity-40 grayscale blur-[1px]' : 'shadow-lg border-blue-600 bg-blue-600'
                         } border-blue-600 bg-blue-600`}>
                            <span className="text-[7px] font-black uppercase italic text-white/60 leading-none mb-0.5">PTS</span>
                            <span className="text-xl font-black italic text-white leading-none">{p.wins * 3}</span>
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="glass-panel p-8 flex flex-wrap items-center justify-center gap-10 border border-white/10 rounded-sm">
         <div className="flex items-center space-x-3">
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic leading-none">Qualified Athlete</span>
         </div>
         <div className="flex items-center space-x-3">
            <Award size={14} className="text-blue-500" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic leading-none">Official Standings</span>
         </div>
         {isAuthorized && (
           <div className="flex items-center space-x-3">
              <Edit3 size={14} className="text-blue-400" />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic leading-none">Manual Registry Access</span>
           </div>
         )}
      </div>
    </div>
  );
};

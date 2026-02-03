import React, { useMemo } from 'react';
import { Player, Fixture } from '../types';
import { TEAMS } from '../constants';
import { Trophy, ChevronLeft, Award, ShieldCheck, Zap, Activity } from 'lucide-react';

interface GroupStageProps {
  players: Player[];
  fixtures: Fixture[];
  onBack: () => void;
}

type Row = Player & {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export const GroupStage: React.FC<GroupStageProps> = ({ players, fixtures, onBack }) => {
  const groupStats = useMemo(() => {
    const groupNames = ['A', 'B', 'C', 'D', 'E', 'F'];

    return groupNames.map((gName) => {
      const groupPlayers = players.filter((p) => p.group === gName);

      const stats: Row[] = groupPlayers
        .map((player) => {
          let played = 0;
          let wins = 0;
          let draws = 0;
          let losses = 0;
          let gf = 0; // goals for
          let ga = 0; // goals against

          fixtures
            .filter((f) => f.status === 'finished')
            .forEach((f) => {
              const p1 = players.find((p) => p.id === f.p1Id);
              const p2 = players.find((p) => p.id === f.p2Id);

              if (!p1 || !p2) return;
              if (p1.group !== gName || p2.group !== gName) return;

              const s1 = f.score1 ?? 0;
              const s2 = f.score2 ?? 0;

              if (p1.id === player.id) {
                played++;
                gf += s1;
                ga += s2;

                if (s1 > s2) wins++;
                else if (s1 < s2) losses++;
                else draws++;
              } else if (p2.id === player.id) {
                played++;
                gf += s2;
                ga += s1;

                if (s2 > s1) wins++;
                else if (s2 < s1) losses++;
                else draws++;
              }
            });

          return {
            ...player,
            played,
            wins,
            draws,
            losses,
            gf,
            ga,
            gd: gf - ga,
            points: wins * 3 + draws,
          };
        })
        .sort((a, b) => {
          return (
            b.points - a.points ||
            b.gd - a.gd ||
            b.gf - a.gf ||
            b.wins - a.wins ||
            a.name.localeCompare(b.name)
          );
        });

      return { name: `GROUP ${gName}`, players: stats };
    });
  }, [players, fixtures]);

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
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">
                Live Standings Protocol
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none text-glow">
              Standings
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-white/10 px-6 py-4 rounded-sm hidden sm:flex items-center space-x-3">
            <Activity size={16} className="text-blue-500" />
            <div>
              <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest italic leading-tight">
                Sync Status
              </span>
              <span className="text-lg font-black text-white italic">RECALCULATING...</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {groupStats.map((group, idx) => (
          <div
            key={idx}
            className="relative rounded-sm overflow-hidden border border-white/10 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="px-8 py-6 flex items-center justify-between border-b border-white/10 bg-slate-900/40">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-sm flex items-center justify-center border bg-blue-600 text-white border-blue-500">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{group.name}</h3>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5 italic">
                    Group Stage Analysis
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2">
              <div className="grid grid-cols-[1fr_repeat(8,40px)] gap-2 px-4 py-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                <span>Athlete</span>
                <span className="text-center">P</span>
                <span className="text-center">W</span>
                <span className="text-center">D</span>
                <span className="text-center">L</span>
                <span className="text-center">GF</span>
                <span className="text-center">GA</span>
                <span className="text-center">GD</span>
                <span className="text-center">PTS</span>
              </div>

              {group.players.map((p, pIdx) => {
                const team = TEAMS.find((t) => t.id === p.teamId);
                const isQualifying = pIdx <= 1; // Top 2 qualify
                const isEliminated = pIdx >= 4; // Bottom positions
                const totalPlayers = group.players.length;
                const isDanger = pIdx === 2 || pIdx === 3; // Middle positions - in contention

                return (
                  <div
                    key={p.id}
                    className={`relative grid grid-cols-[1fr_repeat(8,40px)] gap-2 items-center p-4 rounded-sm border transition-all duration-300 hover:scale-[1.01] ${isQualifying
                        ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent hover:from-emerald-500/15'
                        : isEliminated
                          ? 'border-rose-500/20 bg-gradient-to-r from-rose-500/5 to-transparent hover:from-rose-500/10'
                          : 'border-white/5 bg-slate-900/20 hover:bg-slate-900/40'
                      }`}
                  >
                    {/* Qualification Zone Indicator */}
                    {isQualifying && (
                      <div className="absolute -left-0.5 top-2 bottom-2 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    )}
                    {isEliminated && (
                      <div className="absolute -left-0.5 top-2 bottom-2 w-1 bg-gradient-to-b from-rose-500 to-rose-600 rounded-full" />
                    )}

                    <div className="flex items-center space-x-4 min-w-0">
                      <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center text-[10px] font-black italic rounded-sm border ${isQualifying
                          ? 'bg-emerald-500 text-black border-emerald-400'
                          : isEliminated
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-slate-900 text-slate-600 border-white/10'
                        }`}>
                        {pIdx + 1}
                      </div>
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 bg-slate-950 rounded-sm border overflow-hidden ${isQualifying ? 'border-emerald-500/30' : 'border-white/10'
                          }`}>
                          <img src={p.avatar} alt="" className={`w-full h-full object-cover ${isEliminated ? 'grayscale opacity-60' : 'grayscale-[30%]'}`} />
                        </div>
                        {isQualifying && pIdx === 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                            <Trophy size={10} className="text-black" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black uppercase italic tracking-tight leading-none truncate ${isEliminated ? 'text-slate-500' : 'text-white'
                          }`}>
                          {p.name}
                        </p>
                        <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest italic mt-1">
                          {team?.name}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-black text-slate-500 italic text-center">{p.played}</span>
                    <span className="text-sm font-black text-slate-400 italic text-center">{p.wins}</span>
                    <span className="text-sm font-black text-slate-400 italic text-center">{p.draws}</span>
                    <span className="text-sm font-black text-slate-800 italic text-center">{p.losses}</span>
                    <span className="text-sm font-black text-slate-500 italic text-center">{p.gf}</span>
                    <span className="text-sm font-black text-slate-500 italic text-center">{p.ga}</span>
                    <span className={`text-sm font-black italic text-center ${p.gd > 0 ? 'text-emerald-400' : p.gd < 0 ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                      {p.gd > 0 ? `+${p.gd}` : p.gd}
                    </span>

                    <div className="flex items-center justify-center">
                      <div className={`w-full py-1 rounded-sm text-center font-black italic text-sm ${isQualifying
                          ? 'bg-emerald-500 text-black'
                          : isEliminated
                            ? 'bg-rose-500/30 text-rose-400'
                            : 'bg-blue-600 text-white'
                        }`}>
                        {p.points}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="glass-panel p-6 flex flex-wrap items-center justify-center gap-8 border border-white/10 rounded-sm">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] italic">
            Qualification Zone
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-rose-500/50 rounded-full" />
          <span className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] italic">
            Elimination Zone
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Award size={14} className="text-blue-500" />
          <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic leading-none">
            Auto-Calculated
          </span>
        </div>
      </div>
    </div>
  );
};

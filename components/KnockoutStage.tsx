import React, { useMemo } from "react";
import { Player, Fixture } from "../types";
import { ChevronLeft } from "lucide-react";

interface KnockoutStageProps {
  players: Player[];
  fixtures: Fixture[];
  onBack: () => void;
}

type StatLine = Player & {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export const KnockoutStage: React.FC<KnockoutStageProps> = ({ players, fixtures, onBack }) => {
  const { top2, thirdRanked, bestThirds } = useMemo(() => {
    const groupNames = ["A", "B", "C", "D", "E", "F"];

    // ... all your computation logic here ...

    console.log(
      "TOP2",
      top2.map(p => ({ name: p.name, group: p.group, pts: p.points, gd: p.gd, gf: p.gf }))
    );
    console.log(
      "THIRDS",
      thirdRanked.map(p => ({ name: p.name, group: p.group, pts: p.points, gd: p.gd, gf: p.gf }))
    );
    console.log(
      "BEST_THIRDS",
      bestThirds.map(p => ({ name: p.name, group: p.group, pts: p.points, gd: p.gd, gf: p.gf }))
    );

    return { top2, thirdRanked, bestThirds };
  }, [players, fixtures]);


    const computeGroupStats = (gName: string): StatLine[] => {
      const groupPlayers = players.filter((p) => p.group === gName);

      const stats = groupPlayers
        .map((player) => {
          let played = 0;
          let wins = 0;
          let draws = 0;
          let losses = 0;
          let gf = 0;
          let ga = 0;

          fixtures
            .filter((f) => f.status === "finished")
            .forEach((f) => {
              const p1 = players.find((p) => p.id === f.p1Id);
              const p2 = players.find((p) => p.id === f.p2Id);
              if (!p1 || !p2) return;
              if (p1.group !== gName || p2.group !== gName) return;

              const s1 = f.score1 ?? 0;
              const s2 = f.score2 ?? 0;

              if (player.id === p1.id) {
                played++;
                gf += s1;
                ga += s2;
                if (s1 > s2) wins++;
                else if (s1 < s2) losses++;
                else draws++;
              }

              if (player.id === p2.id) {
                played++;
                gf += s2;
                ga += s1;
                if (s2 > s1) wins++;
                else if (s2 < s1) losses++;
                else draws++;
              }
            });

          const gd = gf - ga;
          const points = wins * 3 + draws;

          return { ...player, played, wins, draws, losses, gf, ga, gd, points };
        })
        .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || b.wins - a.wins || a.name.localeCompare(b.name));

      return stats;
    };

    const groups = groupNames.map((g) => ({ g, stats: computeGroupStats(g) }));

    const top2 = groups.flatMap(({ g, stats }) => stats.slice(0, 2).map((p) => ({ group: g, ...p })));

    const thirdRanked = groups
      .map(({ g, stats }) => ({ group: g, third: stats[2] }))
      .filter((x) => !!x.third)
      .map(({ group, third }) => ({ group, ...(third as StatLine) }));

    const bestThirds = [...thirdRanked]
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || b.wins - a.wins || a.name.localeCompare(b.name))
      .slice(0, 4);

    return { top2, thirdRanked, bestThirds };
  }, [players, fixtures]);

  return (
    <div className="space-y-10 pb-32">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-white transition-all"
        >
          <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Knockout Qualification</h2>
          <p className="text-xs text-slate-500 mt-1">Top 2 of each group + best 4 third-placed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-white/10 bg-slate-950/60 rounded-sm p-6">
          <h3 className="text-lg font-black text-white uppercase italic mb-4">Qualified (Top 2)</h3>
          <div className="space-y-2">
            {top2.map((p) => (
              <div key={`top2-${p.id}-${p.group}`} className="flex items-center justify-between bg-slate-900/30 border border-white/5 p-3 rounded-sm">
                <span className="text-white font-black uppercase italic truncate">{p.name}</span>
                <span className="text-xs text-slate-500">Group {p.group} • {p.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/10 bg-slate-950/60 rounded-sm p-6">
          <h3 className="text-lg font-black text-white uppercase italic mb-4">Best 3rd (Top 4 qualify)</h3>
          <div className="space-y-2">
            {bestThirds.map((p, i) => (
              <div key={`best3-${p.id}-${p.group}`} className="flex items-center justify-between bg-slate-900/30 border border-white/5 p-3 rounded-sm">
                <span className="text-white font-black uppercase italic truncate">
                  #{i + 1} {p.name}
                </span>
                <span className="text-xs text-slate-500">Group {p.group} • {p.points} pts • GD {p.gd}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 opacity-60">
            <p className="text-xs text-slate-500">
              (Next step will be generating the actual bracket + matches.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

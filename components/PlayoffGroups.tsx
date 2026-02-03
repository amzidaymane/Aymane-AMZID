import React, { useMemo, useState } from 'react';
import { Player, PlayoffFixture } from '../types';
import { TEAMS } from '../constants';
import { Trophy, ChevronLeft, Zap, Users, Save, Medal } from 'lucide-react';

interface PlayoffGroupsProps {
    players: Player[];
    playoffFixtures: PlayoffFixture[];
    onUpdatePlayoffFixtures: (fixtures: PlayoffFixture[]) => void;
    onBack: () => void;
    isAuthorized: boolean;
}

// Playoff group definitions
const PLAYOFF_GROUPS = [
    {
        id: 1,
        name: 'PLAYOFF GROUP A',
        playerNames: ['Yanis Saidi', 'Youssef Fadlaoui', 'Mohamed Amine Chaabani'],
        dayLabel: 'Monday 2nd'
    },
    {
        id: 2,
        name: 'PLAYOFF GROUP B',
        playerNames: ['Younes Jebbar', 'Hatim Essafi', 'Nabil Lamkadem'],
        dayLabel: 'Tuesday 3rd'
    }
];

// Generate initial fixtures for a playoff group
const generateGroupFixtures = (groupId: 1 | 2, playerIds: number[]): PlayoffFixture[] => {
    if (playerIds.length !== 3) return [];

    // Round robin: 3 matches for 3 players
    return [
        { id: `PO${groupId}-1`, playoffGroup: groupId, p1Id: playerIds[0], p2Id: playerIds[1], status: 'scheduled' },
        { id: `PO${groupId}-2`, playoffGroup: groupId, p1Id: playerIds[1], p2Id: playerIds[2], status: 'scheduled' },
        { id: `PO${groupId}-3`, playoffGroup: groupId, p1Id: playerIds[0], p2Id: playerIds[2], status: 'scheduled' },
    ];
};

// Pre-seeded Group 1 results (played Monday 2nd)
const GROUP1_RESULTS: { [key: string]: { score1: number; score2: number } } = {
    'PO1-1': { score1: 2, score2: 3 }, // Yanis 2-3 Chaabani (order in fixture is Yanis vs Mohamed - need to check)
};

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

export const PlayoffGroups: React.FC<PlayoffGroupsProps> = ({
    players,
    playoffFixtures,
    onUpdatePlayoffFixtures,
    onBack,
    isAuthorized
}) => {
    const [localFixtures, setLocalFixtures] = useState<PlayoffFixture[]>(playoffFixtures);
    const [hasChanges, setHasChanges] = useState(false);

    // Get player IDs for each group
    const getPlayerIdsForGroup = (playerNames: string[]) => {
        return playerNames.map(name => {
            const player = players.find(p => p.name.toLowerCase() === name.toLowerCase());
            return player?.id || 0;
        }).filter(id => id !== 0);
    };

    // Initialize fixtures if empty
    const initializeFixtures = () => {
        const allFixtures: PlayoffFixture[] = [];

        PLAYOFF_GROUPS.forEach(group => {
            const playerIds = getPlayerIdsForGroup(group.playerNames);
            if (playerIds.length === 3) {
                const groupFixtures = generateGroupFixtures(group.id as 1 | 2, playerIds);
                allFixtures.push(...groupFixtures);
            }
        });

        // Pre-seed Group 1 results
        const seededFixtures = allFixtures.map(f => {
            if (f.playoffGroup === 1) {
                // Match fixtures to results
                const p1 = players.find(p => p.id === f.p1Id);
                const p2 = players.find(p => p.id === f.p2Id);

                // Chaabani vs Yanis: 3-2
                if ((p1?.name.includes('Chaabani') && p2?.name.includes('Yanis')) ||
                    (p1?.name.includes('Yanis') && p2?.name.includes('Chaabani'))) {
                    const chaabaniFirst = p1?.name.includes('Chaabani');
                    return { ...f, score1: chaabaniFirst ? 3 : 2, score2: chaabaniFirst ? 2 : 3, status: 'finished' as const };
                }
                // Yanis vs Youssef: 2-1
                if ((p1?.name.includes('Yanis') && p2?.name.includes('Youssef')) ||
                    (p1?.name.includes('Youssef') && p2?.name.includes('Yanis'))) {
                    const yanisFirst = p1?.name.includes('Yanis');
                    return { ...f, score1: yanisFirst ? 2 : 1, score2: yanisFirst ? 1 : 2, status: 'finished' as const };
                }
                // Chaabani vs Youssef: 4-3
                if ((p1?.name.includes('Chaabani') && p2?.name.includes('Youssef')) ||
                    (p1?.name.includes('Youssef') && p2?.name.includes('Chaabani'))) {
                    const chaabaniFirst = p1?.name.includes('Chaabani');
                    return { ...f, score1: chaabaniFirst ? 4 : 3, score2: chaabaniFirst ? 3 : 4, status: 'finished' as const };
                }
            }
            return f;
        });

        return seededFixtures;
    };

    // Use initialized fixtures if local is empty
    const effectiveFixtures = useMemo(() => {
        if (localFixtures.length === 0) {
            const initialized = initializeFixtures();
            return initialized;
        }
        return localFixtures;
    }, [localFixtures, players]);

    // Calculate standings for each group
    const groupStandings = useMemo(() => {
        return PLAYOFF_GROUPS.map(group => {
            const playerIds = getPlayerIdsForGroup(group.playerNames);
            const groupPlayers = players.filter(p => playerIds.includes(p.id));
            const groupFixtures = effectiveFixtures.filter(f => f.playoffGroup === group.id);

            const stats: Row[] = groupPlayers.map(player => {
                let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;

                groupFixtures.forEach(f => {
                    if (f.status !== 'finished' || f.score1 == null || f.score2 == null) return;

                    if (f.p1Id === player.id) {
                        played++;
                        gf += f.score1;
                        ga += f.score2;
                        if (f.score1 > f.score2) wins++;
                        else if (f.score1 < f.score2) losses++;
                        else draws++;
                    } else if (f.p2Id === player.id) {
                        played++;
                        gf += f.score2;
                        ga += f.score1;
                        if (f.score2 > f.score1) wins++;
                        else if (f.score2 < f.score1) losses++;
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
                    points: wins * 3 + draws
                };
            }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

            return { ...group, players: stats, fixtures: groupFixtures };
        });
    }, [players, effectiveFixtures]);

    const handleScoreChange = (fixtureId: string, slot: 'score1' | 'score2', value: string) => {
        const score = value === '' ? null : parseInt(value);
        setLocalFixtures(prev => {
            const updated = prev.length > 0 ? prev : initializeFixtures();
            return updated.map(f => {
                if (f.id !== fixtureId) return f;
                const newFixture = { ...f, [slot]: score };
                if (newFixture.score1 != null && newFixture.score2 != null) {
                    newFixture.status = 'finished';
                } else {
                    newFixture.status = 'scheduled';
                }
                return newFixture;
            });
        });
        setHasChanges(true);
    };

    const handleSave = () => {
        const fixtureToSave = localFixtures.length > 0 ? localFixtures : initializeFixtures();
        onUpdatePlayoffFixtures(fixtureToSave);
        setHasChanges(false);
    };

    return (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700 pb-32">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-amber-500/20 pb-10">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={onBack}
                        className="group p-5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-sm text-amber-400 transition-all shadow-xl"
                    >
                        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Medal size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">
                                Third Place Qualification
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 italic uppercase tracking-tighter leading-none">
                            Playoff Groups
                        </h2>
                        <p className="text-sm text-slate-400 mt-2">
                            Top 2 from each group advance to the Knockout Stage
                        </p>
                    </div>
                </div>

                {isAuthorized && (
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`flex items-center gap-3 px-6 py-3 rounded-sm font-black text-sm uppercase tracking-wider transition-all ${hasChanges
                            ? 'bg-amber-500 hover:bg-amber-400 text-black'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <Save size={16} />
                        Save Results
                    </button>
                )}
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {groupStandings.map((group, groupIdx) => {
                    const isGroupA = group.id === 1;

                    return (
                        <div
                            key={group.id}
                            className="relative rounded-sm overflow-hidden border border-amber-500/20 bg-gradient-to-br from-slate-950/90 to-amber-950/20 backdrop-blur-md"
                        >
                            {/* Group Header */}
                            <div className="px-8 py-6 flex items-center justify-between border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-sm flex items-center justify-center border bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400">
                                        <Trophy size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-amber-400 italic uppercase tracking-tighter">
                                            {group.name}
                                        </h3>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5 italic">
                                            {group.dayLabel} • Round Robin
                                        </span>
                                    </div>
                                </div>
                                {isGroupA && (
                                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded text-[10px] font-black text-green-400 uppercase tracking-wider">
                                        Completed
                                    </span>
                                )}
                            </div>

                            {/* Standings Table */}
                            <div className="p-4 space-y-2">
                                <div className="grid grid-cols-[1fr_repeat(8,36px)] gap-1 px-4 py-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                    <span>Player</span>
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
                                    const team = TEAMS.find(t => t.id === p.teamId);
                                    const isQualified = pIdx <= 1; // Top 2 qualify

                                    return (
                                        <div
                                            key={p.id}
                                            className={`relative grid grid-cols-[1fr_repeat(8,36px)] gap-1 items-center p-3 rounded-sm border transition-all ${isQualified
                                                ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-transparent'
                                                : 'border-white/5 bg-slate-900/30'
                                                }`}
                                        >
                                            {isQualified && (
                                                <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                                            )}

                                            <div className="flex items-center space-x-3 min-w-0 pl-2">
                                                <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center text-[9px] font-black italic rounded-sm border ${isQualified ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-900 text-slate-600 border-white/10'
                                                    }`}>
                                                    {pIdx + 1}
                                                </div>
                                                <div className="w-8 h-8 bg-slate-950 rounded-full border border-white/10 overflow-hidden flex-shrink-0">
                                                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-white uppercase italic tracking-tight truncate">
                                                        {p.name}
                                                    </p>
                                                    <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest italic">
                                                        {team?.name}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="text-xs font-black text-slate-500 italic text-center">{p.played}</span>
                                            <span className="text-xs font-black text-slate-400 italic text-center">{p.wins}</span>
                                            <span className="text-xs font-black text-slate-400 italic text-center">{p.draws}</span>
                                            <span className="text-xs font-black text-slate-700 italic text-center">{p.losses}</span>
                                            <span className="text-xs font-black text-slate-500 italic text-center">{p.gf}</span>
                                            <span className="text-xs font-black text-slate-500 italic text-center">{p.ga}</span>
                                            <span className={`text-xs font-black italic text-center ${p.gd > 0 ? 'text-green-400' : p.gd < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                                {p.gd > 0 ? `+${p.gd}` : p.gd}
                                            </span>

                                            <div className="flex items-center justify-center">
                                                <div className={`w-full py-1 rounded-sm text-center font-black italic text-xs ${isQualified ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
                                                    }`}>
                                                    {p.points}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Fixtures Section */}
                            <div className="px-4 pb-4">
                                <div className="border-t border-white/5 pt-4">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Zap size={12} className="text-amber-400" />
                                        Match Results
                                    </h4>
                                    <div className="space-y-2">
                                        {group.fixtures.map(fixture => {
                                            const p1 = players.find(p => p.id === fixture.p1Id);
                                            const p2 = players.find(p => p.id === fixture.p2Id);

                                            return (
                                                <div
                                                    key={fixture.id}
                                                    className="flex items-center justify-between bg-slate-900/50 border border-white/5 rounded-sm p-3"
                                                >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <img src={p1?.avatar} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                                                        <span className="text-xs font-bold text-white uppercase italic truncate">
                                                            {p1?.name.split(' ').slice(-1)[0]}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 px-4">
                                                        {isAuthorized ? (
                                                            <>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={fixture.score1 ?? ''}
                                                                    onChange={(e) => handleScoreChange(fixture.id, 'score1', e.target.value)}
                                                                    className="w-10 bg-slate-950 border border-white/10 rounded-sm px-2 py-1 text-center text-sm font-black text-white focus:outline-none focus:border-amber-500"
                                                                />
                                                                <span className="text-slate-600 text-sm">-</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={fixture.score2 ?? ''}
                                                                    onChange={(e) => handleScoreChange(fixture.id, 'score2', e.target.value)}
                                                                    className="w-10 bg-slate-950 border border-white/10 rounded-sm px-2 py-1 text-center text-sm font-black text-white focus:outline-none focus:border-amber-500"
                                                                />
                                                            </>
                                                        ) : (
                                                            <span className="text-lg font-black text-white italic">
                                                                {fixture.status === 'finished'
                                                                    ? `${fixture.score1} - ${fixture.score2}`
                                                                    : 'vs'
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                                        <span className="text-xs font-bold text-white uppercase italic truncate">
                                                            {p2?.name.split(' ').slice(-1)[0]}
                                                        </span>
                                                        <img src={p2?.avatar} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="bg-slate-950/60 border border-amber-500/20 rounded-sm p-6 flex flex-wrap items-center justify-center gap-8">
                <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] italic">
                        Advances to Knockout
                    </span>
                </div>
                <div className="flex items-center space-x-3">
                    <Users size={14} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                        6 Players • 2 Groups • 4 Qualify
                    </span>
                </div>
            </div>

            {/* Manager Instructions */}
            {isAuthorized && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-4 flex items-center gap-4">
                    <Users size={20} className="text-amber-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-amber-400 uppercase tracking-wider">Manager Mode Active</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Enter scores for each match. The top 2 players from each group will automatically qualify for the Knockout Stage.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

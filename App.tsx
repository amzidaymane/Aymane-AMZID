console.log("APP START", new Date().toISOString());

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Search, LayoutGrid, Swords, Wifi, WifiOff, List, Grid3X3, AlertTriangle, Database, RefreshCw, HardDrive, ShieldCheck, Lock, Unlock
} from 'lucide-react';
import { Player, ViewMode, Fixture, KnockoutMatch } from './types';
import { INITIAL_PLAYERS, TEAMS } from './constants';
import { PlayerCard } from './components/PlayerCard';
import { PlayerModal } from './components/PlayerModal';
import { GroupStage } from './components/GroupStage';
import { MatchCenter } from './components/MatchCenter';
import { subscribeToTournament, updateRemoteState, fetchRemoteState, updateKnockoutMatches, updateSeedVersion } from './services/firebase';
import { saveLocalData, getLocalData } from './services/persistence';
import { KnockoutStage } from './components/KnockoutStage';
import { listenFixtures } from './services/fixtures.service'


// --- AUTHORITATIVE DATA LOCK ---
const SEED_VERSION = "2026-02-03_SCORE_CORRECTIONS_V10";

const RAW_SCHEDULE = `
1 | Monday 19 | 1 | Mohamed Amine Chaabani | Mohannad Briouel | 2 | 3
2 | Monday 19 | 2 | Aymane AMZID | Anas Bengamra | 4 | 0
3 | Monday 19 | 3 | Yanis Saidi | Anas Habchi | 0 | 4
4 | Monday 19 | 4 | Mohamed Taha Kebdani | Youssef Fadlaoui | 0 | 4
5 | Monday 19 | 5 | Saad Belkacemi | Elmehdi Mahassine | 2 | 0
6 | Monday 19 | 6 | Wadia Tazi | Kamal Lakhr | 2 | 5
7 | Tuesday 20 | 1 | Anas Nouimi | Youssef Lahrizi | 2 | 9
8 | Tuesday 20 | 2 | Rida Zouaki | Mohamed Karim Nachit | 6 | 2
9 | Tuesday 20 | 3 | Amine Chbihi | Karim Beniouri | 4 | 4
10 | Tuesday 20 | 4 | Anas Hilmi | Rida Zouaki | 6 | 3
11 | Tuesday 20 | 5 | Anas Nouimi | Karim Beniouri | 7 | 0
12 | Wednesday 21 | 1 | Youssef Lahrizi | Karim Beniouri | 5 | 1
13 | Wednesday 21 | 2 | Nabil Lamkadem | Rida Zouaki | 3 | 2
14 | Wednesday 21 | 3 | Younes Jebbar | Amine Chbihi | 0 | 4
15 | Wednesday 21 | 4 | Anas Hilmi | Mohamed Karim Nachit | 8 | 0
16 | Wednesday 21 | 5 | Amine Chbihi | Youssef Lahrizi | 3 | 2
17 | Wednesday 21 | 6 | Younes Jebbar | Anas Nouimi | 2 | 3
18 | Wednesday 21 | 7 | Nabil Lamkadem | Mohamed Karim Nachit | 11 | 2
19 | Wednesday 21 | 8 | Anas Hilmi | Nabil Lamkadem | 5 | 3
20 | Thursday 22 | 1 | Youssef Fadlaoui | Souhail Boukili | 2 | 6
21 | Thursday 22 | 2 | Mohamed Taha Kebdani | Kamal Lakhr | 3 | 8
22 | Thursday 22 | 3 | Aymane AMZID | Yanis Saidi | 4 | 0
23 | Thursday 22 | 4 | Wadia Tazi | Souhail Boukili | 0 | 6
24 | Thursday 22 | 5 | Hatim Essafi | Ilyass Saddik | 5 | 1
25 | Thursday 22 | 6 | Hatim Essafi | Zakaria Belbaida | 2 | 2
26 | Friday 23 | 1 | Zakaria Belbaida | Ilyass Saddik | 6 | 0
27 | Friday 23 | 2 | Souhail Boukili | Kamal Lakhr | 3 | 1
28 | Friday 23 | 3 | Mohamed Amine Chaabani | Elmehdi Mahassine | 2 | 1
29 | Friday 23 | 4 | Wadia Tazi | Youssef Fadlaoui | 1 | 5
30 | Friday 23 | 5 | Soufiane Belkasmi | Ilyass Saddik | 5 | 4
31 | Monday 26 | 1 | Nabil Lamkadem | Ilyasse Mbarki | 1 | 5
32 | Monday 26 | 2 | Younes Jebbar | Karim Beniouri | - | -
33 | Monday 26 | 3 | Ilyasse Mbarki | Rida Zouaki | 4 | 5
34 | Monday 26 | 4 | Anas Nouimi | Amine Chbihi | - | -
35 | Monday 26 | 5 | Ilyasse Mbarki | Mohamed Karim Nachit | 6 | 2
36 | Monday 26 | 6 | Younes Jebbar | Youssef Lahrizi | - | -
37 | Monday 26 | 7 | Anas Hilmi | Ilyasse Mbarki | 2 | 8
38 | Tuesday 27 | 1 | Mohamed Taha Kebdani | Souhail Boukili | 1 | 3
39 | Tuesday 27 | 2 | Youssef Fadlaoui | Kamal Lakhr | 0 | 6
40 | Tuesday 27 | 3 | Wadia Tazi | Mohamed Taha Kebdani | 1 | 5
41 | Tuesday 27 | 4 | Mohannad Briouel | Saad Belkacemi | 2 | 1
42 | Tuesday 27 | 5 | Zakaria Belbaida | Soufiane Belkasmi | 5 | 2
43 | Tuesday 27 | 6 | Yanis Saidi | Anas Bengamra | 3 | 4
44 | Wednesday 28 | 1 | Mohamed Amine Chaabani | Saad Belkacemi | 3 | 5
45 | Wednesday 28 | 2 | Aymane AMZID | Anas Habchi | 4 | 3
46 | Wednesday 28 | 3 | Mohannad Briouel | Elmehdi Mahassine | 3 | 0
47 | Wednesday 28 | 4 | Hatim Essafi | Soufiane Belkasmi | 0 | 2
48 | Wednesday 28 | 5 | Anas Bengamra | Anas Habchi | - | -
`.trim();

export default function FC26App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing' | 'error'>('syncing');
  const [lastError, setLastError] = useState<string | null>(null);
  const [remoteStats, setRemoteStats] = useState({ p: 0, f: 0 });
  const isSyncBlocked = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const local = getLocalData();
  const [players, setPlayers] = useState<Player[]>(local?.players || INITIAL_PLAYERS);
  const [fixtures, setFixtures] = useState<Fixture[]>(local?.fixtures || []);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);

  const [view, setView] = useState<ViewMode>(ViewMode.ROSTER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    saveLocalData(players, fixtures);
  }, [players, fixtures]);

  useEffect(() => {
    if (accessCode === '959525') {
      setIsAuthorized(true);
    } else if (accessCode.length > 0 && accessCode !== '959525') {
      setIsAuthorized(false);
    }
  }, [accessCode]);

  const parseLockedSchedule = (): Fixture[] => {
    return RAW_SCHEDULE.split('\n').map(line => {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length < 5) return null;

      const absoluteOrder = parseInt(parts[0]);
      const dLabel = parts[1];
      const mNum = parseInt(parts[2]);
      const p1Name = parts[3];
      const p2Name = parts[4];
      const score1Str = parts[5]?.trim();
      const score2Str = parts[6]?.trim();

      const p1 = INITIAL_PLAYERS.find(p => p.name === p1Name);
      const p2 = INITIAL_PLAYERS.find(p => p.name === p2Name);

      const hasScore = score1Str && score1Str !== '-' && score2Str && score2Str !== '-';

      return {
        id: `fxt-v9-${absoluteOrder}`,
        p1Id: p1?.id || 0,
        p2Id: p2?.id || 0,
        status: hasScore ? 'finished' : 'scheduled',
        timestamp: absoluteOrder,
        dayLabel: dLabel,
        matchNumber: mNum,
        score1: hasScore ? parseInt(score1Str) : null,
        score2: hasScore ? parseInt(score2Str) : null
      } as Fixture;
    }).filter(f => f !== null) as Fixture[];
  };

  const startSubscription = () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    unsubscribeRef.current = subscribeToTournament(
      (state) => {
        if (isSyncBlocked.current) return;
        if (state.players) setPlayers(state.players);
        if (state.fixtures) setFixtures(state.fixtures);
        if (state.knockoutMatches) setKnockoutMatches(state.knockoutMatches);
        setRemoteStats({ p: state.players?.length || 0, f: state.fixtures?.length || 0 });
        setSyncStatus('online');
        setLastError(null);
      },
      (error) => {
        setSyncStatus('offline');
        setLastError(error.code + ": " + error.message);
      }
    );
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setSyncStatus('syncing');
        let remoteData: any = null;
        try {
          remoteData = await fetchRemoteState();
        } catch (e) {
          console.warn("Remote fetch failed, falling back to local/hardcoded", e);
        }

        const hardcoded = parseLockedSchedule();
        const remoteSeedVersion = remoteData?.seedVersion;
        const needsReseed = !remoteData || !remoteData.fixtures || remoteData.fixtures.length === 0 || remoteSeedVersion !== SEED_VERSION;

        if (needsReseed) {
          console.log("RESEEDING FROM HARDCODED - Version:", SEED_VERSION, "Remote Version:", remoteSeedVersion);
          setPlayers(INITIAL_PLAYERS);
          setFixtures(hardcoded);
          // Preserve knockout matches if they exist
          const existingKnockout = remoteData?.knockoutMatches || [];
          if (existingKnockout.length > 0) setKnockoutMatches(existingKnockout);
          // Seed the DB with new version
          updateRemoteState(INITIAL_PLAYERS, hardcoded, existingKnockout.length > 0 ? existingKnockout : undefined)
            .then(() => updateSeedVersion(SEED_VERSION))
            .catch(console.error);
        } else {
          console.log("LOADED REMOTE DATA", remoteData.fixtures.length);
          setPlayers(remoteData.players || INITIAL_PLAYERS);
          setFixtures(remoteData.fixtures);
          if (remoteData.knockoutMatches) setKnockoutMatches(remoteData.knockoutMatches);
        }

        setSyncStatus('online');
        startSubscription();
      } catch (error: any) {
        console.error("Initialization failed:", error);
        setSyncStatus('offline');
      }
    };
    initialize();
    return () => unsubscribeRef.current?.();
  }, []);

  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    const newPlayers = players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    setPlayers(newPlayers);
    try { await updateRemoteState(newPlayers, fixtures); } catch (e) { setSyncStatus('offline'); }
  };

  const handleSetFixtures = async (newFixtures: Fixture[]) => {
    setFixtures(newFixtures);
    try { await updateRemoteState(players, newFixtures); } catch (e) { setSyncStatus('offline'); }
  };

  const deleteFixture = async (id: string) => {
    const newFixtures = fixtures.filter(f => f.id !== id);
    setFixtures(newFixtures);
    try { await updateRemoteState(players, newFixtures); } catch (e) { setSyncStatus('offline'); }
  };

  const handleUpdateKnockoutMatches = async (matches: KnockoutMatch[]) => {
    setKnockoutMatches(matches);
    try { await updateKnockoutMatches(matches); } catch (e) { setSyncStatus('offline'); }
  };

  const [rosterView, setRosterView] = useState<'GRID' | 'LIST'>('GRID');

  // ... (existing effects)

  const statsPlayers = useMemo(() => {
    return players.map(p => {
      let wins = 0;
      let losses = 0;
      // fixtures is defined in outer scope
      fixtures.forEach(f => {
        if (f.status === 'finished' && f.score1 != null && f.score2 != null) {
          if (f.p1Id === p.id) {
            if (f.score1 > f.score2) wins++;
            else if (f.score1 < f.score2) losses++;
          } else if (f.p2Id === p.id) {
            if (f.score2 > f.score1) wins++;
            else if (f.score2 < f.score1) losses++;
          }
        }
      });
      return { ...p, wins, losses };
    });
  }, [players, fixtures]);

  const filteredPlayers = useMemo(() => {
    return statsPlayers.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      TEAMS.find(t => t.id === p.teamId)?.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [statsPlayers, search]);

  const sortedPlayersForRanking = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  }, [filteredPlayers]);

  return (
    <div className="min-h-screen bg-[#020617] font-sans selection:bg-white selection:text-black overflow-x-hidden pb-32">
      {/* ... (keep header) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-blue-600/5 blur-[160px] rounded-full"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl sticky top-0 z-[60]">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            <div className="flex items-center space-x-10">
              <img src="https://www.greatplacetowork.in/great/api/assets/uploads/5483/logo/logo.png" alt="Logo" style={{ filter: 'brightness(0) saturate(100%) invert(84%) sepia(50%) saturate(769%) hue-rotate(357deg) brightness(105%) contrast(107%)' }} className="h-16 w-auto object-contain" />
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">PGD <span className="text-slate-600 not-italic tracking-[0.3em] font-light ml-2 text-xs">FC26 TOURNAMENT</span></h1>
            </div>
            <nav className="hidden lg:flex items-center space-x-1">
              <button onClick={() => setView(ViewMode.ROSTER)} className={`px-8 py-3 rounded-sm text-[9px] font-bold uppercase tracking-[0.3em] italic ${view === ViewMode.ROSTER ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>Athletes</button>
              <button onClick={() => setView(ViewMode.FIXTURES)} className={`px-8 py-3 rounded-sm text-[9px] font-bold uppercase tracking-[0.3em] italic ${view === ViewMode.FIXTURES ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>Arena</button>
            </nav>
            <div className="flex items-center space-x-6">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : syncStatus === 'offline' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`}></div>
                <span className={`text-[8px] font-black uppercase tracking-[0.4em] italic ${syncStatus === 'online' ? 'text-green-500' : syncStatus === 'offline' ? 'text-red-500' : 'text-blue-400'}`}>{syncStatus === 'online' ? 'STATION ONLINE' : syncStatus === 'offline' ? 'OFFLINE MODE' : 'INITIALIZING...'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
          {view === ViewMode.GROUPS ? (
            <GroupStage players={players} fixtures={fixtures} onBack={() => setView(ViewMode.ROSTER)} />
          ) : view === ViewMode.KNOCKOUT ? (
            <KnockoutStage players={players} knockoutMatches={knockoutMatches} onUpdateKnockoutMatches={handleUpdateKnockoutMatches} onBack={() => setView(ViewMode.ROSTER)} isAuthorized={isAuthorized} />
          ) : view === ViewMode.FIXTURES ? (
            <MatchCenter players={players} fixtures={fixtures} onUpdateFixtures={handleSetFixtures} onUpdatePlayer={handleUpdatePlayer} onBack={() => setView(ViewMode.ROSTER)} isAuthorized={isAuthorized} onDeleteFixture={deleteFixture} />
          ) : (

            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <button onClick={() => setView(ViewMode.GROUPS)} className="border border-white/5 bg-slate-950/40 p-12 rounded-sm flex flex-col items-center justify-center space-y-6 hover:bg-slate-900/40 transition-all">
                  <LayoutGrid size={32} className="text-slate-500" /><h3 className="text-xl font-black text-white italic uppercase tracking-tighter">VIEW STANDINGS</h3>
                </button>
                <button onClick={() => setView(ViewMode.KNOCKOUT)} className="border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-slate-950/40 p-12 rounded-sm flex flex-col items-center justify-center space-y-6 hover:from-amber-500/20 hover:to-slate-900/40 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                  <h3 className="text-xl font-black text-amber-400 italic uppercase tracking-tighter">KNOCKOUT BRACKET</h3>
                </button>
                <button onClick={() => setView(ViewMode.FIXTURES)} className="border border-white/5 bg-slate-950/40 p-12 rounded-sm flex flex-col items-center justify-center space-y-6 hover:bg-slate-900/40 transition-all">
                  <Swords size={32} className="text-slate-500" /><h3 className="text-xl font-black text-white italic uppercase tracking-tighter">ENTER ARENA</h3>
                </button>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-6">
                  <h2 className="text-xl font-black text-white italic uppercase tracking-[0.4em]">Athlete Registry</h2>
                  <div className="flex bg-slate-900/50 p-1 rounded-sm border border-white/5">
                    <button onClick={() => setRosterView('GRID')} className={`p-2 rounded-sm transition-all ${rosterView === 'GRID' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>
                      <LayoutGrid size={14} />
                    </button>
                    <button onClick={() => setRosterView('LIST')} className={`p-2 rounded-sm transition-all ${rosterView === 'LIST' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>
                      <List size={14} />
                    </button>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors"><Search size={14} /></div>
                  <input type="text" placeholder="SEARCH DATABASE..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-950 border border-white/5 rounded-sm pl-12 pr-6 py-3 text-[10px] font-black tracking-widest text-white focus:outline-none focus:border-blue-600/50 w-64 transition-all" />
                </div>
              </div>

              {rosterView === 'GRID' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} onDelete={() => { }} onEdit={(p) => { setEditingPlayer(p); setIsModalOpen(true); }} isAuthorized={isAuthorized} />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <th className="py-4 px-4">Rank</th>
                        <th className="py-4 px-4">Athlete</th>
                        <th className="py-4 px-4">Team</th>
                        <th className="py-4 px-4 text-center">Wins</th>
                        <th className="py-4 px-4 text-center">Losses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPlayersForRanking.map((player, index) => {
                        const team = TEAMS.find(t => t.id === player.teamId);
                        return (
                          <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="py-4 px-4 text-slate-500 font-bold italic">#{index + 1}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                                  <img src={player.avatar} className="w-full h-full object-cover" alt="" />
                                </div>
                                <span className="text-sm font-black text-white italic uppercase tracking-tighter">{player.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <img src={team?.logo} className="w-5 h-5 object-contain opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{team?.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-blue-500 font-black text-lg">{player.wins}</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-slate-600 font-bold">{player.losses}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="mt-auto border-t border-white/5 bg-slate-950/80 backdrop-blur-xl py-8 z-50">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-sm bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <ShieldCheck size={16} className="text-blue-500" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">PGD FC26 Authorized Tournament Platform &copy; 2026</p>
            </div>

            <div className="flex items-center gap-4">
              {isAuthorized ? (
                <div className="flex items-center gap-3 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-sm animate-in fade-in zoom-in duration-300">
                  <Unlock size={14} className="text-green-500" />
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest italic">Manager Mode Enabled</span>
                  <button onClick={() => { setAccessCode(''); setIsAuthorized(false); }} className="ml-2 text-[9px] font-black text-slate-500 hover:text-white underline uppercase tracking-widest">Logout</button>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 transition-colors group-focus-within:text-blue-500">
                    <Lock size={12} />
                  </div>
                  <input
                    type="password"
                    placeholder="MANAGER ACCESS CODE"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="bg-slate-950/50 border border-white/5 rounded-sm pl-10 pr-6 py-3 text-[10px] font-black tracking-[0.2em] text-white focus:outline-none focus:border-blue-600/50 w-64 transition-all placeholder:text-slate-800"
                  />
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
      <PlayerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleUpdatePlayer} editingPlayer={editingPlayer} />
    </div>
  );
}

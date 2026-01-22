console.log("APP START", new Date().toISOString());

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Search, LayoutGrid, Swords, Wifi, WifiOff, List, Grid3X3, AlertTriangle, Database, RefreshCw, HardDrive, ShieldCheck, Lock, Unlock
} from 'lucide-react';
import { Player, ViewMode, Fixture } from './types';
import { INITIAL_PLAYERS, TEAMS } from './constants';
import { PlayerCard } from './components/PlayerCard';
import { PlayerModal } from './components/PlayerModal';
import { GroupStage } from './components/GroupStage';
import { MatchCenter } from './components/MatchCenter';
import { subscribeToTournament, updateRemoteState, fetchRemoteState } from './services/firebase';
import { saveLocalData, getLocalData } from './services/persistence';
import { KnockoutStage } from './components/KnockoutStage';



// --- AUTHORITATIVE DATA LOCK ---
const SEED_VERSION = "2026-01-20_MANAGER_RESTORE_V9"; 

const RAW_SCHEDULE = `
1 | Monday 19 | 1 | Mohamed Amine Chaabani | Mohannad Briouel
2 | Monday 19 | 2 | Aymane AMZID | Anas Bengamra
3 | Monday 19 | 3 | Yanis Saidi | Anas Habchi
4 | Monday 19 | 4 | Mohamed Taha Kebdani | Youssef Fadlaoui
5 | Monday 19 | 5 | Saad Belkacemi | Elmehdi Mahassine
6 | Monday 19 | 6 | Wadia Tazi | Kamal Lakhr
7 | Tuesday 20 | 1 | Anas Nouimi | Youssef Lahrizi
8 | Tuesday 20 | 2 | Rida Zouaki | Mohamed Karim Nachit
9 | Tuesday 20 | 3 | Amine Chbihi | Karim Beniouri
10 | Tuesday 20 | 4 | Nabil Lamkadem | Ilyasse Mbarki
11 | Tuesday 20 | 5 | Younes Jebbar | Anas Nouimi
12 | Tuesday 20 | 6 | Anas Hilmi | Rida Zouaki
13 | Wednesday 21 | 1 | Anas Hilmi | Ilyasse Mbarki
14 | Wednesday 21 | 2 | Youssef Lahrizi | Karim Beniouri
15 | Wednesday 21 | 3 | Nabil Lamkadem | Rida Zouaki
16 | Wednesday 21 | 4 | Younes Jebbar | Amine Chbihi
17 | Wednesday 21 | 5 | Anas Hilmi | Mohamed Karim Nachit
18 | Wednesday 21 | 6 | Amine Chbihi | Youssef Lahrizi
19 | Thursday 22 | 1 | Mohamed Amine Chaabani | Saad Belkacemi
20 | Thursday 22 | 2 | Mohannad Briouel | Elmehdi Mahassine
21 | Thursday 22 | 3 | Wadia Tazi | Youssef Fadlaoui
22 | Thursday 22 | 4 | Mohamed Taha Kebdani | Kamal Lakhr
23 | Thursday 22 | 5 | Aymane AMZID | Yanis Saidi
24 | Thursday 22 | 6 | Anas Bengamra | Anas Habchi
25 | Thursday 22 | 7 | Hatim Essafi | Ilyass Saddik
26 | Thursday 22 | 8 | Soufiane Belkasmi | Ilyass Saddik
27 | Friday 23 | 1 | Hatim Essafi | Soufiane Belkasmi
28 | Friday 23 | 2 | Zakaria Belbaida | Ilyass Saddik
29 | Friday 23 | 3 | Youssef Fadlaoui | Souhail Boukili
30 | Friday 23 | 4 | Wadia Tazi | Souhail Boukili
31 | Friday 23 | 5 | Aymane AMZID | Anas Habchi
32 | Friday 23 | 6 | Mohamed Amine Chaabani | Elmehdi Mahassine
33 | Friday 23 | 7 | Souhail Boukili | Kamal Lakhr
34 | Friday 23 | 8 | Hatim Essafi | Zakaria Belbaida
35 | Monday 26 | 1 | Nabil Lamkadem | Mohamed Karim Nachit
36 | Monday 26 | 2 | Younes Jebbar | Karim Beniouri
37 | Monday 26 | 3 | Ilyasse Mbarki | Rida Zouaki
38 | Monday 26 | 4 | Anas Nouimi | Karim Beniouri
39 | Monday 26 | 5 | Anas Hilmi | Nabil Lamkadem
40 | Monday 26 | 6 | Anas Nouimi | Amine Chbihi
41 | Monday 26 | 7 | Ilyasse Mbarki | Mohamed Karim Nachit
42 | Monday 26 | 8 | Younes Jebbar | Youssef Lahrizi
43 | Tuesday 27 | 1 | Mohamed Taha Kebdani | Souhail Boukili
44 | Tuesday 27 | 2 | Youssef Fadlaoui | Kamal Lakhr
45 | Tuesday 27 | 3 | Wadia Tazi | Mohamed Taha Kebdani
46 | Tuesday 27 | 4 | Mohannad Briouel | Saad Belkacemi
47 | Tuesday 27 | 5 | Zakaria Belbaida | Soufiane Belkasmi
48 | Tuesday 27 | 6 | Yanis Saidi | Anas Bengamra
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

      const p1 = INITIAL_PLAYERS.find(p => p.name === p1Name);
      const p2 = INITIAL_PLAYERS.find(p => p.name === p2Name);

      return {
        id: `fxt-v9-${absoluteOrder}`,
        p1Id: p1?.id || 0,
        p2Id: p2?.id || 0,
        status: 'scheduled',
        timestamp: absoluteOrder, 
        dayLabel: dLabel,
        matchNumber: mNum
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
        const remoteData: any = await fetchRemoteState();
        
if (remoteData) {
  setPlayers(remoteData.players || INITIAL_PLAYERS);
  setFixtures(remoteData.fixtures || []);
} else {
  // fallback only if Firestore is empty/unreachable
  setPlayers(INITIAL_PLAYERS);
  setFixtures(parseLockedSchedule());
}
          setFixtures(newFixtures);
          setPlayers(finalPlayers);

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

  const filteredPlayers = useMemo(() => {
    return players.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      TEAMS.find(t => t.id === p.teamId)?.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [players, search]);

  return (
    <div className="min-h-screen bg-[#020617] font-sans selection:bg-white selection:text-black overflow-x-hidden pb-32">
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
  <KnockoutStage players={players} fixtures={fixtures} onBack={() => setView(ViewMode.ROSTER)} />
) : view === ViewMode.FIXTURES ? (
  <MatchCenter players={players} fixtures={fixtures} onUpdateFixtures={handleSetFixtures} onUpdatePlayer={handleUpdatePlayer} onBack={() => setView(ViewMode.ROSTER)} isAuthorized={isAuthorized} onDeleteFixture={deleteFixture} />
) : (

            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button onClick={() => setView(ViewMode.GROUPS)} className="border border-white/5 bg-slate-950/40 p-12 rounded-sm flex flex-col items-center justify-center space-y-6 hover:bg-slate-900/40 transition-all">
                  <LayoutGrid size={32} className="text-slate-500" /><h3 className="text-xl font-black text-white italic uppercase tracking-tighter">VIEW STANDINGS</h3>
                </button>
                <button onClick={() => setView(ViewMode.FIXTURES)} className="border border-white/5 bg-slate-950/40 p-12 rounded-sm flex flex-col items-center justify-center space-y-6 hover:bg-slate-900/40 transition-all">
                  <Swords size={32} className="text-slate-500" /><h3 className="text-xl font-black text-white italic uppercase tracking-tighter">ENTER ARENA</h3>
                </button>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <h2 className="text-xl font-black text-white italic uppercase tracking-[0.4em]">Athlete Registry</h2>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors"><Search size={14} /></div>
                   <input type="text" placeholder="SEARCH DATABASE..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-950 border border-white/5 rounded-sm pl-12 pr-6 py-3 text-[10px] font-black tracking-widest text-white focus:outline-none focus:border-blue-600/50 w-64 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredPlayers.map(player => (
                  <PlayerCard key={player.id} player={player} onDelete={() => {}} onEdit={(p) => { setEditingPlayer(p); setIsModalOpen(true); }} isAuthorized={isAuthorized} />
                ))}
              </div>
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

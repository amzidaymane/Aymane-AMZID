
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Trophy, Users, Search, 
  RefreshCcw, 
  LayoutGrid, Swords, Activity, 
  Wifi, WifiOff, AlertTriangle, List, Grid3X3
} from 'lucide-react';
import { Player, ViewMode, Fixture } from './types';
import { INITIAL_PLAYERS, TEAMS, PRE_SEEDED_FIXTURES } from './constants';
import { PlayerCard } from './components/PlayerCard';
import { PlayerModal } from './components/PlayerModal';
import { GroupStage } from './components/GroupStage';
import { MatchCenter } from './components/MatchCenter';
import { githubStorage, SyncStatus, AppData } from './services/storage';

export default function FC26App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isListView, setIsListView] = useState(false);
  
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem('fc26_players');
      return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
    } catch (e) {
      return INITIAL_PLAYERS;
    }
  });
  
  const [fixtures, setFixtures] = useState<Fixture[]>(() => {
    try {
      const saved = localStorage.getItem('fc26_fixtures');
      return saved ? JSON.parse(saved) : PRE_SEEDED_FIXTURES;
    } catch (e) {
      return PRE_SEEDED_FIXTURES;
    }
  });
  
  const [view, setView] = useState<ViewMode>(ViewMode.ROSTER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [search, setSearch] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const lastRemoteVersion = useRef<number>(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (accessCode === '959525') {
      setIsAuthorized(true);
    }
  }, [accessCode]);

  const hydrateFromRemote = useCallback(async (isSilent = false) => {
    if (!isSilent) setSyncStatus('syncing');
    const remoteData = await githubStorage.loadData();
    if (remoteData) {
      if (remoteData.version > lastRemoteVersion.current) {
        setPlayers(remoteData.players);
        setFixtures(remoteData.fixtures || []);
        lastRemoteVersion.current = remoteData.version;
        localStorage.setItem('fc26_players', JSON.stringify(remoteData.players));
        localStorage.setItem('fc26_fixtures', JSON.stringify(remoteData.fixtures || []));
      }
      setSyncStatus('synced');
    } else {
      if (!isSilent) setSyncStatus('idle');
    }
  }, []);

  useEffect(() => {
    hydrateFromRemote();
    const pollInterval = isAuthorized ? 15000 : 45000;
    const interval = setInterval(() => hydrateFromRemote(true), pollInterval);
    return () => clearInterval(interval);
  }, [hydrateFromRemote, isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      const timeoutId = setTimeout(async () => {
        setSyncStatus('syncing');
        const newVersion = Date.now();
        const data: AppData = { players, matches: [], fixtures, version: newVersion };
        const status = await githubStorage.saveData(data);
        if (status === 'synced') {
          lastRemoteVersion.current = newVersion;
          localStorage.setItem('fc26_players', JSON.stringify(players));
          localStorage.setItem('fc26_fixtures', JSON.stringify(fixtures));
        }
        setSyncStatus(status);
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [players, fixtures, isAuthorized]);

  const handleSavePlayer = (player: Player) => {
    if (editingPlayer) {
      setPlayers(prev => prev.map(p => p.id === player.id ? player : p));
    } else {
      setPlayers(prev => [player, ...prev]);
    }
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };

  const deletePlayer = (id: number) => {
    if (window.confirm("ATHLETE DELETION: Wipe this record?")) {
      setPlayers(prev => prev.filter(p => p.id !== id));
    }
  };

  const resetSystem = () => {
    if (window.confirm("FACTORY RESET: Restore default configuration?")) {
      localStorage.clear();
      setPlayers(INITIAL_PLAYERS);
      setFixtures(PRE_SEEDED_FIXTURES);
      window.location.reload();
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      TEAMS.find(t => t.id === p.teamId)?.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [players, search]);

  return (
    <div className="min-h-screen bg-[#020617] font-sans selection:bg-white selection:text-black">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-blue-600/5 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vh] bg-indigo-600/5 blur-[160px] rounded-full"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            <div className="flex items-center space-x-10">
              <img 
                src="https://www.greatplacetowork.in/great/api/assets/uploads/5483/logo/logo.png" 
                alt="Partner Logo" 
                style={{ filter: 'brightness(0) saturate(100%) invert(84%) sepia(50%) saturate(769%) hue-rotate(357deg) brightness(105%) contrast(107%)' }}
                className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(254,190,16,0.2)] hover:scale-105 transition-transform duration-500 cursor-pointer"
              />
              <div className="hidden sm:block">
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                  PGD <span className="text-slate-600 not-italic tracking-[0.3em] font-light ml-2 text-xs">FC26 TOURNAMENT</span>
                </h1>
              </div>
            </div>

            <nav className="hidden lg:flex items-center space-x-1">
              {[
                { id: ViewMode.ROSTER, icon: Users, label: 'Athletes' },
                { id: ViewMode.FIXTURES, icon: Swords, label: 'Arena' },
              ].map(nav => (
                <button
                  key={nav.id}
                  onClick={() => setView(nav.id)}
                  className={`flex items-center space-x-4 px-8 py-3 rounded-sm text-[9px] font-bold uppercase tracking-[0.3em] italic transition-all duration-300 ${
                    view === nav.id ? 'bg-white text-black' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <nav.icon size={12} strokeWidth={2.5} />
                  <span>{nav.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex flex-col items-end">
                 <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-green-500' : syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] italic">LIVE FEED</span>
                 </div>
                 <span className="text-[10px] font-bold text-white uppercase tracking-wider">{syncStatus === 'syncing' ? 'PUSHING DATA...' : 'CLOUD STABLE'}</span>
              </div>
              <button onClick={() => hydrateFromRemote()} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-all text-slate-400 hover:text-blue-400">
                <RefreshCcw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
          {view === ViewMode.GROUPS ? (
            <GroupStage players={players} onUpdatePlayer={handleUpdatePlayer} onBack={() => setView(ViewMode.ROSTER)} isAuthorized={isAuthorized} />
          ) : view === ViewMode.FIXTURES ? (
            <MatchCenter players={players} fixtures={fixtures} onUpdateFixtures={setFixtures} onUpdatePlayer={handleUpdatePlayer} onBack={() => setView(ViewMode.ROSTER)} isAuthorized={isAuthorized} />
          ) : (
            <div className="space-y-12">
              <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => setView(ViewMode.GROUPS)} className="bg-slate-950/40 border border-white/5 hover:border-white/20 transition-all rounded-sm p-8 flex flex-col items-center justify-center space-y-4">
                  <LayoutGrid size={24} className="text-slate-500" />
                  <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">VIEW STANDINGS</h3>
                </button>
                <button onClick={() => setView(ViewMode.FIXTURES)} className="bg-slate-950/40 border border-white/5 hover:border-white/20 transition-all rounded-sm p-8 flex flex-col items-center justify-center space-y-4">
                  <Swords size={24} className="text-slate-500" />
                  <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">ENTER ARENA</h3>
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center space-x-6">
                   <div className="h-[2px] w-12 bg-blue-600"></div>
                   <h2 className="text-xl font-black text-white italic uppercase tracking-[0.4em]">Athlete Registry</h2>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-900/50 p-1 rounded-sm border border-white/5">
                    <button 
                      onClick={() => setIsListView(false)}
                      className={`p-2 rounded-sm transition-all ${!isListView ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button 
                      onClick={() => setIsListView(true)}
                      className={`p-2 rounded-sm transition-all ${isListView ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                  {isAuthorized && (
                    <button 
                      onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }}
                      className="px-8 py-3 bg-white text-black text-[9px] font-black uppercase tracking-[0.3em] italic hover:bg-blue-600 hover:text-white transition-all rounded-sm shadow-xl"
                    >
                      NEW ENTRY
                    </button>
                  )}
                </div>
              </div>

              {isListView ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 italic border-b border-white/5">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-5">Athlete Name</div>
                    <div className="col-span-3">Affiliation</div>
                    <div className="col-span-1 text-center">W</div>
                    <div className="col-span-1 text-center">L</div>
                    <div className="col-span-1 text-right">Grp</div>
                  </div>
                  {filteredPlayers.map((player, idx) => {
                    const team = TEAMS.find(t => t.id === player.teamId);
                    return (
                      <div 
                        key={player.id}
                        className="grid grid-cols-12 items-center px-6 py-4 bg-slate-950/50 border border-white/5 hover:border-blue-600/30 hover:bg-blue-600/5 transition-all group"
                      >
                        <div className="col-span-1 text-xs font-black text-slate-800 italic">{idx + 1}</div>
                        <div className="col-span-5 flex items-center gap-4">
                          <img src={player.avatar} className="w-8 h-8 rounded-sm object-cover border border-white/10" />
                          <span className="text-sm font-black text-white uppercase italic tracking-tight">{player.name}</span>
                        </div>
                        <div className="col-span-3 flex items-center gap-3">
                          <img src={team?.logo} className="w-5 h-5 object-contain grayscale group-hover:grayscale-0 transition-all" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{team?.name}</span>
                        </div>
                        <div className="col-span-1 text-center font-black text-white italic">{player.wins}</div>
                        <div className="col-span-1 text-center font-black text-slate-700 italic">{player.losses}</div>
                        <div className="col-span-1 text-right font-black text-blue-500 italic">{player.group || 'A'}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredPlayers.map(player => (
                    <PlayerCard 
                      key={player.id}
                      player={player} 
                      onDelete={deletePlayer}
                      onEdit={(p) => { setEditingPlayer(p); setIsModalOpen(true); }}
                      isAuthorized={isAuthorized}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="border-t border-white/5 py-12 bg-slate-950/30 backdrop-blur-xl mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
             <div className="flex items-center space-x-12">
                <div className="flex items-center space-x-4">
                  {syncStatus === 'synced' ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-slate-700" />}
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">{syncStatus === 'synced' ? 'GLOBAL CLOUD SYNC: ACTIVE' : 'LOCAL CACHE ONLY'}</p>
                </div>
                {!isAuthorized ? (
                  <input 
                    type="password"
                    placeholder="MANAGER ACCESS"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="bg-slate-950 border border-white/5 rounded-sm px-4 py-2 text-[10px] font-black tracking-widest text-slate-400 focus:outline-none focus:border-blue-600/50 w-40 placeholder-slate-800"
                  />
                ) : (
                  <button onClick={resetSystem} className="text-[9px] font-black text-red-950 hover:text-red-500 uppercase tracking-widest">SYSTEM RESET</button>
                )}
             </div>
             <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.3em] italic">TERMINAL v26.04 • {isAuthorized ? 'MANAGER' : 'VIEWER'}</p>
          </div>
        </footer>
      </div>

      <PlayerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePlayer} editingPlayer={editingPlayer} />
    </div>
  );
}

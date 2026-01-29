import React, { useState, useMemo } from "react";
import { Player, KnockoutMatch, KnockoutRound } from "../types";
import { ChevronLeft, Trophy, Save, Users, ChevronDown, X, Crown, Medal } from "lucide-react";
import { TEAMS } from "../constants";

interface KnockoutStageProps {
  players: Player[];
  knockoutMatches: KnockoutMatch[];
  onUpdateKnockoutMatches: (matches: KnockoutMatch[]) => void;
  onBack: () => void;
  isAuthorized: boolean;
}

// Initial empty bracket structure
const createEmptyBracket = (): KnockoutMatch[] => {
  const matches: KnockoutMatch[] = [];

  // Round of 16 - 8 matches
  for (let i = 1; i <= 8; i++) {
    matches.push({
      id: `R16-${i}`,
      round: 'R16',
      order: i,
      p1Id: null,
      p2Id: null,
      score1: null,
      score2: null,
      winnerId: null,
      status: 'scheduled'
    });
  }

  // Quarter Finals - 4 matches
  for (let i = 1; i <= 4; i++) {
    matches.push({
      id: `QF-${i}`,
      round: 'QF',
      order: i,
      p1Id: null,
      p2Id: null,
      score1: null,
      score2: null,
      winnerId: null,
      status: 'scheduled'
    });
  }

  // Semi Finals - 2 matches
  for (let i = 1; i <= 2; i++) {
    matches.push({
      id: `SF-${i}`,
      round: 'SF',
      order: i,
      p1Id: null,
      p2Id: null,
      score1: null,
      score2: null,
      winnerId: null,
      status: 'scheduled'
    });
  }

  // Third Place Playoff
  matches.push({
    id: 'THIRD_PLAYOFF-1',
    round: 'THIRD_PLAYOFF',
    order: 1,
    p1Id: null,
    p2Id: null,
    score1: null,
    score2: null,
    winnerId: null,
    status: 'scheduled'
  });

  // Final
  matches.push({
    id: 'F-1',
    round: 'F',
    order: 1,
    p1Id: null,
    p2Id: null,
    score1: null,
    score2: null,
    winnerId: null,
    status: 'scheduled'
  });

  return matches;
};

interface PlayerDropdownProps {
  players: Player[];
  selectedPlayerId: number | null;
  onSelect: (playerId: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PlayerDropdown: React.FC<PlayerDropdownProps> = ({
  players,
  selectedPlayerId,
  onSelect,
  placeholder = "Select Player",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (disabled) {
    return (
      <div className="bg-slate-900/60 border border-white/10 rounded-sm px-3 py-2 text-sm text-slate-400 italic">
        {selectedPlayer ? selectedPlayer.name : placeholder}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900/80 border border-white/10 hover:border-blue-500/50 rounded-sm px-3 py-2 text-left flex items-center justify-between transition-all group"
      >
        <span className={`text-sm font-bold uppercase italic tracking-tight truncate ${selectedPlayer ? 'text-white' : 'text-slate-500'}`}>
          {selectedPlayer ? selectedPlayer.name : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-slate-950 border border-white/20 rounded-sm shadow-2xl z-50 min-w-[280px] w-max max-w-[320px] overflow-hidden">
            <div className="p-2 border-b border-white/10 sticky top-0 bg-slate-950">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="max-h-80 overflow-y-auto">
              <button
                onClick={() => { onSelect(null); setIsOpen(false); setSearchTerm(""); }}
                className="w-full px-4 py-3 text-left text-sm text-slate-500 hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5"
              >
                <X size={14} /> Clear Selection
              </button>
              {filteredPlayers.map(player => {
                const team = TEAMS.find(t => t.id === player.teamId);
                return (
                  <button
                    key={player.id}
                    onClick={() => { onSelect(player.id); setIsOpen(false); setSearchTerm(""); }}
                    className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 ${selectedPlayerId === player.id ? 'bg-blue-600/20' : ''}`}
                  >
                    <img src={player.avatar} alt="" className="w-8 h-8 rounded-full border border-white/10" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-white uppercase italic truncate block">{player.name}</span>
                      <span className="text-xs text-slate-500">{team?.name} • Group {player.group}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface MatchCardProps {
  match: KnockoutMatch;
  players: Player[];
  isAuthorized: boolean;
  onUpdateMatch: (match: KnockoutMatch) => void;
  isCompact?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, players, isAuthorized, onUpdateMatch, isCompact = false }) => {
  const p1 = players.find(p => p.id === match.p1Id);
  const p2 = players.find(p => p.id === match.p2Id);
  const team1 = TEAMS.find(t => t.id === p1?.teamId);
  const team2 = TEAMS.find(t => t.id === p2?.teamId);

  const handlePlayerSelect = (slot: 'p1' | 'p2', playerId: number | null) => {
    onUpdateMatch({
      ...match,
      [slot === 'p1' ? 'p1Id' : 'p2Id']: playerId
    });
  };

  const handleScoreChange = (slot: 'score1' | 'score2', value: string) => {
    const score = value === '' ? null : parseInt(value);
    const newMatch = { ...match, [slot]: score };

    // Auto-determine winner if both scores are set
    if (newMatch.score1 !== null && newMatch.score2 !== null && newMatch.p1Id && newMatch.p2Id) {
      if (newMatch.score1 > newMatch.score2) {
        newMatch.winnerId = newMatch.p1Id;
        newMatch.status = 'finished';
      } else if (newMatch.score2 > newMatch.score1) {
        newMatch.winnerId = newMatch.p2Id;
        newMatch.status = 'finished';
      } else {
        newMatch.winnerId = null;
        newMatch.status = 'scheduled';
      }
    } else {
      newMatch.status = 'scheduled';
    }

    onUpdateMatch(newMatch);
  };

  const showScores = match.p1Id !== null && match.p2Id !== null;

  return (
    <div className={`bg-slate-950/80 border border-white/10 rounded-sm overflow-hidden ${isCompact ? 'p-2' : 'p-3'}`}>
      {/* Player 1 */}
      <div className={`flex items-center gap-2 ${isCompact ? 'mb-1' : 'mb-2'}`}>
        {isAuthorized ? (
          <div className="flex-1">
            <PlayerDropdown
              players={players}
              selectedPlayerId={match.p1Id}
              onSelect={(id) => handlePlayerSelect('p1', id)}
              placeholder="Select Player 1"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            {p1 ? (
              <>
                <img src={p1.avatar} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                <span className="text-xs font-bold text-white uppercase italic truncate">{p1.name}</span>
              </>
            ) : (
              <span className="text-xs text-slate-600 italic">TBD</span>
            )}
          </div>
        )}
        {showScores && (
          isAuthorized ? (
            <input
              type="number"
              min="0"
              value={match.score1 ?? ''}
              onChange={(e) => handleScoreChange('score1', e.target.value)}
              className="w-10 bg-slate-900 border border-white/10 rounded-sm px-2 py-1 text-center text-sm font-black text-white focus:outline-none focus:border-blue-500"
            />
          ) : (
            <span className={`w-8 text-center text-sm font-black ${match.winnerId === match.p1Id ? 'text-blue-400' : 'text-slate-400'}`}>
              {match.score1 ?? '-'}
            </span>
          )
        )}
      </div>

      {/* VS Divider */}
      <div className={`border-t border-white/5 ${isCompact ? 'my-1' : 'my-2'}`} />

      {/* Player 2 */}
      <div className="flex items-center gap-2">
        {isAuthorized ? (
          <div className="flex-1">
            <PlayerDropdown
              players={players}
              selectedPlayerId={match.p2Id}
              onSelect={(id) => handlePlayerSelect('p2', id)}
              placeholder="Select Player 2"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            {p2 ? (
              <>
                <img src={p2.avatar} alt="" className="w-6 h-6 rounded-full border border-white/10" />
                <span className="text-xs font-bold text-white uppercase italic truncate">{p2.name}</span>
              </>
            ) : (
              <span className="text-xs text-slate-600 italic">TBD</span>
            )}
          </div>
        )}
        {showScores && (
          isAuthorized ? (
            <input
              type="number"
              min="0"
              value={match.score2 ?? ''}
              onChange={(e) => handleScoreChange('score2', e.target.value)}
              className="w-10 bg-slate-900 border border-white/10 rounded-sm px-2 py-1 text-center text-sm font-black text-white focus:outline-none focus:border-blue-500"
            />
          ) : (
            <span className={`w-8 text-center text-sm font-black ${match.winnerId === match.p2Id ? 'text-blue-400' : 'text-slate-400'}`}>
              {match.score2 ?? '-'}
            </span>
          )
        )}
      </div>
    </div>
  );
};

export const KnockoutStage: React.FC<KnockoutStageProps> = ({
  players,
  knockoutMatches,
  onUpdateKnockoutMatches,
  onBack,
  isAuthorized,
}) => {
  // Use provided matches or create empty bracket
  const [localMatches, setLocalMatches] = useState<KnockoutMatch[]>(() => {
    if (knockoutMatches && knockoutMatches.length > 0) {
      return knockoutMatches;
    }
    return createEmptyBracket();
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleUpdateMatch = (updatedMatch: KnockoutMatch) => {
    setLocalMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateKnockoutMatches(localMatches);
    setHasChanges(false);
  };

  const getMatchesByRound = (round: KnockoutRound) =>
    localMatches.filter(m => m.round === round).sort((a, b) => a.order - b.order);

  const r16Matches = getMatchesByRound('R16');
  const qfMatches = getMatchesByRound('QF');
  const sfMatches = getMatchesByRound('SF');
  const finalMatch = getMatchesByRound('F')[0];
  const thirdPlaceMatch = getMatchesByRound('THIRD_PLAYOFF')[0];

  // Get winner for final celebrations
  const champion = finalMatch?.winnerId ? players.find(p => p.id === finalMatch.winnerId) : null;
  const thirdPlace = thirdPlaceMatch?.winnerId ? players.find(p => p.id === thirdPlaceMatch.winnerId) : null;

  return (
    <div className="space-y-8 pb-32 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div className="flex items-center space-x-6">
          <button
            onClick={onBack}
            className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-white transition-all shadow-xl"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Trophy size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">
                Knockout Stage
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
              Tournament Bracket
            </h2>
          </div>
        </div>

        {isAuthorized && (
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-3 px-6 py-3 rounded-sm font-black text-sm uppercase tracking-wider transition-all ${hasChanges
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
          >
            <Save size={16} />
            Save Bracket
          </button>
        )}
      </div>

      {/* Champion Display */}
      {champion && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/30 rounded-sm p-6 text-center">
          <Crown size={32} className="text-amber-400 mx-auto mb-2" />
          <h3 className="text-2xl font-black text-amber-400 uppercase italic">Champion</h3>
          <p className="text-xl font-bold text-white mt-2">{champion.name}</p>
        </div>
      )}

      {/* Bracket Layout */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Round Labels */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Round of 16</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quarter Finals</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Semi Finals</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Final</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">3rd Place</span>
            </div>
          </div>

          {/* Bracket Grid */}
          <div className="grid grid-cols-5 gap-4">
            {/* Round of 16 */}
            <div className="space-y-2">
              {r16Matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  players={players}
                  isAuthorized={isAuthorized}
                  onUpdateMatch={handleUpdateMatch}
                  isCompact
                />
              ))}
            </div>

            {/* Quarter Finals */}
            <div className="space-y-4 flex flex-col justify-around py-8">
              {qfMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  players={players}
                  isAuthorized={isAuthorized}
                  onUpdateMatch={handleUpdateMatch}
                />
              ))}
            </div>

            {/* Semi Finals */}
            <div className="space-y-8 flex flex-col justify-around py-16">
              {sfMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  players={players}
                  isAuthorized={isAuthorized}
                  onUpdateMatch={handleUpdateMatch}
                />
              ))}
            </div>

            {/* Final */}
            <div className="flex flex-col justify-center">
              {finalMatch && (
                <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Trophy size={24} className="text-amber-400" />
                  </div>
                  <MatchCard
                    match={finalMatch}
                    players={players}
                    isAuthorized={isAuthorized}
                    onUpdateMatch={handleUpdateMatch}
                  />
                </div>
              )}
            </div>

            {/* Third Place */}
            <div className="flex flex-col justify-center">
              {thirdPlaceMatch && (
                <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Medal size={20} className="text-amber-700" />
                  </div>
                  <MatchCard
                    match={thirdPlaceMatch}
                    players={players}
                    isAuthorized={isAuthorized}
                    onUpdateMatch={handleUpdateMatch}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manager Instructions */}
      {isAuthorized && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-sm p-4 flex items-center gap-4">
          <Users size={20} className="text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">Manager Mode Active</p>
            <p className="text-xs text-slate-400 mt-1">
              Click on any slot to assign a player. Enter scores for completed matches. Don't forget to save your changes!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

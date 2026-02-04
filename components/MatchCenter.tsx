
import React, { useState, useMemo } from 'react';
import { Player, Fixture } from '../types';
import { TEAMS, FIXTURE_DAYS } from '../constants';
import {
  Swords, Calendar, Plus,
  Trash2, Check, X,
  Zap, ChevronLeft, LayoutGrid, Maximize2, Layers, Save, Edit3, GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

    // Sort days based on FIXTURE_DAYS order
    order.sort((a, b) => {
      const indexA = FIXTURE_DAYS.indexOf(a);
      const indexB = FIXTURE_DAYS.indexOf(b);
      // If both are known, sort by index
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If only A is known, it comes first
      if (indexA !== -1) return -1;
      // If only B is known, it comes first
      if (indexB !== -1) return 1;
      // Otherwise stable/alphabetical
      return a.localeCompare(b);
    });

    order.forEach(day => {
      days[day].sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
    });
    return { days, order };
  }, [fixtures]);

  const handleDragStart = (event: DragStartEvent) => {
    if (!isAuthorized) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isAuthorized) return;
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the source fixture
    const activeFixture = fixtures.find(f => f.id === activeId);
    if (!activeFixture) return;

    const sourceDayLabel = activeFixture.dayLabel;

    // Determine target container (dayLabel)
    let overDayLabel = "";
    if (Object.keys(groupedFixtures.days).includes(overId)) {
      overDayLabel = overId;
    } else {
      const overFixture = fixtures.find(f => f.id === overId);
      if (overFixture) {
        overDayLabel = overFixture.dayLabel;
      }
    }

    if (!overDayLabel) {
      setActiveId(null);
      return;
    }

    // IMMUTABLE UPDATE LOGIC
    let newFixtures = [...fixtures];

    // Case 1: Reordering within the same day
    if (sourceDayLabel === overDayLabel) {
      if (activeId !== overId) {
        const dayItems = fixtures.filter(f => f.dayLabel === sourceDayLabel).sort((a, b) => a.matchNumber - b.matchNumber);
        const oldIndex = dayItems.findIndex(f => f.id === activeId);
        const newIndex = dayItems.findIndex(f => f.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Reorder only the items in this day
          const reorderedDayItems = arrayMove(dayItems, oldIndex, newIndex);

          // Update matchNumbers
          const updatedDayItems = reorderedDayItems.map((f, idx) => ({ ...f, matchNumber: idx + 1 }));

          // Replace in main list: Remove old day items, add new ones
          const otherItems = fixtures.filter(f => f.dayLabel !== sourceDayLabel);
          newFixtures = [...otherItems, ...updatedDayItems];
        }
      }
    }
    // Case 2: Moving to a different day
    else {
      // 1. Remove from source day
      const sourceItems = fixtures.filter(f => f.dayLabel === sourceDayLabel && f.id !== activeId).sort((a, b) => a.matchNumber - b.matchNumber);
      // Re-index source items
      const updatedSourceItems = sourceItems.map((f, idx) => ({ ...f, matchNumber: idx + 1 }));

      // 2. Add to dest day
      const destItems = fixtures.filter(f => f.dayLabel === overDayLabel).sort((a, b) => a.matchNumber - b.matchNumber);

      // Calculate insertion index
      let insertIndex = destItems.length; // Default to end
      // If dropped on a specific item, find its index
      if (overId !== overDayLabel) {
        const overItemIndex = destItems.findIndex(f => f.id === overId);
        if (overItemIndex !== -1) insertIndex = overItemIndex;
      }

      // Create new fixture object with updated dayLabel
      const newActiveFixture = { ...activeFixture, dayLabel: overDayLabel };

      // Insert into dest array
      destItems.splice(insertIndex, 0, newActiveFixture);

      // Re-index dest items
      const updatedDestItems = destItems.map((f, idx) => ({ ...f, matchNumber: idx + 1 }));

      // 3. Rebuild complete list
      const otherItems = fixtures.filter(f => f.dayLabel !== sourceDayLabel && f.dayLabel !== overDayLabel);
      newFixtures = [...otherItems, ...updatedSourceItems, ...updatedDestItems];
    }

    onUpdateFixtures(newFixtures);
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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

              <SortableContext
                items={groupedFixtures.days[day].map(f => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={isGridView ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : "space-y-6"}>
                  {groupedFixtures.days[day].map(fixture => (
                    <SortableFixtureItem
                      key={fixture.id}
                      fixture={fixture}
                      players={players}
                      onFinalize={handleScoreUpdate}
                      onDelete={onDeleteFixture}
                      isAuthorized={isAuthorized}
                      isGridView={isGridView}
                      isOverlay={false}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <SortableFixtureItem
              fixture={fixtures.find(f => f.id === activeId)!}
              players={players}
              onFinalize={() => { }}
              onDelete={() => { }}
              isAuthorized={isAuthorized}
              isGridView={isGridView}
              isOverlay={true}
            />
          ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
};

// Wrapper for Sortable item
const SortableFixtureItem = (props: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.fixture.id, disabled: !props.isAuthorized });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging || props.isOverlay ? 999 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <CompactMatchCard {...props} dragHandleProps={props.isAuthorized ? listeners : undefined} />
    </div>
  );
};

const CompactMatchCard: React.FC<{ fixture: Fixture, players: Player[], onFinalize: (id: string, s1: number, s2: number) => void, onDelete: any, isAuthorized: boolean, isGridView: boolean, isOverlay?: boolean, dragHandleProps?: any }> = ({ fixture, players, onFinalize, onDelete, isAuthorized, isGridView, isOverlay, dragHandleProps }) => {
  const p1 = players.find(p => p.id === fixture.p1Id);
  const p2 = players.find(p => p.id === fixture.p2Id);
  const t1 = TEAMS.find(t => t.id === p1?.teamId);
  const t2 = TEAMS.find(t => t.id === p2?.teamId);
  const [s1, setS1] = useState(fixture.score1 ?? 0);
  const [s2, setS2] = useState(fixture.score2 ?? 0);
  const [isEditing, setIsEditing] = useState(false);

  if (!p1 || !p2) return null;
  const isFinished = fixture.status === 'finished';

  return (
    <div className={`group relative overflow-hidden rounded-md border transition-all duration-300 ${isFinished ? 'border-white/10 bg-[#0B1120] hover:bg-[#121c33]' : 'border-white/5 bg-[#0B1120]/60 hover:bg-[#0B1120]'} ${isOverlay ? 'shadow-2xl scale-105 z-50' : 'hover:shadow-xl'}`}>

      {/* Subtle Top Highlight */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>

      {/* Match Label + Category + Status Badge */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {/* Category Badge */}
        {fixture.category === 'playoff' && (
          <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded text-[7px] font-black text-orange-400 uppercase tracking-wider">
            Playoff
          </span>
        )}
        {fixture.category === 'knockout' && (
          <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[7px] font-black text-amber-400 uppercase tracking-wider">
            Knockout
          </span>
        )}
        <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] italic">MATCH {fixture.matchNumber}</span>
        {isFinished ? (
          <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[7px] font-black text-emerald-400 uppercase tracking-wider">
            ✓ Final
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-[7px] font-black text-slate-400 uppercase tracking-wider">
            Scheduled
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative p-6 px-4 pt-10 flex items-center justify-between gap-2 md:gap-4 z-10 w-full h-full min-h-[150px]">

        {/* Player 1 (Left) */}
        <div className="flex-1 w-0 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border border-white/10 overflow-hidden bg-black/20 ${isFinished && fixture.score1! > fixture.score2! ? 'ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'grayscale-[30%] group-hover:grayscale-0 transition-all'}`}>
              <img
                src={p1.avatar}
                className="w-full h-full object-cover"
                style={{ objectPosition: p1.alignment ? `${p1.alignment.x}% ${p1.alignment.y}%` : 'center 20%' }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#0B1120] p-1 border border-white/10 flex items-center justify-center shadow-md">
              <img src={t1?.logo} className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-xs md:text-sm font-bold uppercase tracking-tight leading-tight line-clamp-2 ${isFinished && fixture.score1! > fixture.score2! ? 'text-white' : 'text-slate-400'}`}>{p1.name}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 truncate">{t1?.name}</span>
          </div>
        </div>

        {/* Center (Scores / VS) */}
        <div className="flex flex-col items-center justify-center shrink-0 w-28 md:w-36 relative h-16">
          {(!isFinished || isEditing) && isAuthorized ? (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 bg-slate-950/90 p-4 rounded-lg border border-white/10 backdrop-blur-xl z-20 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2">
                <input type="number" value={s1} onChange={e => setS1(Math.max(0, parseInt(e.target.value) || 0))} className="w-12 bg-black/40 border border-white/10 rounded-sm py-1 text-center text-xl font-bold text-white focus:border-blue-500 outline-none" />
                <span className="text-slate-600 font-bold text-sm">:</span>
                <input type="number" value={s2} onChange={e => setS2(Math.max(0, parseInt(e.target.value) || 0))} className="w-12 bg-black/40 border border-white/10 rounded-sm py-1 text-center text-xl font-bold text-white focus:border-blue-500 outline-none" />
              </div>
              <div className="flex gap-1 w-full">
                <button onClick={() => { onFinalize(fixture.id, s1, s2); setIsEditing(false); }} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-sm font-bold text-[8px] uppercase tracking-widest">Save</button>
                {isEditing && <button onClick={() => setIsEditing(false)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-sm"><X size={10} /></button>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 transition-all duration-300">
              {isFinished ? (
                <div className="flex items-center gap-3 md:gap-5">
                  <span className={`text-3xl md:text-4xl font-black italic leading-none transition-all ${fixture.score1! > fixture.score2!
                    ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                    : 'text-slate-600'
                    }`}>{fixture.score1}</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-wider">VS</span>
                  </div>
                  <span className={`text-3xl md:text-4xl font-black italic leading-none transition-all ${fixture.score2! > fixture.score1!
                    ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                    : 'text-slate-600'
                    }`}>{fixture.score2}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2 px-4 bg-slate-800/50 rounded-full border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Awaiting</span>
                </div>
              )}

              {isAuthorized && isFinished && (
                <button
                  onClick={() => { setIsEditing(true); setS1(fixture.score1!); setS2(fixture.score2!); }}
                  className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-600 hover:text-blue-500 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Player 2 (Right) */}
        <div className="flex-1 w-0 flex items-center gap-3 flex-row-reverse text-right">
          <div className="relative shrink-0">
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border border-white/10 overflow-hidden bg-black/20 ${isFinished && fixture.score2! > fixture.score1! ? 'ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'grayscale-[30%] group-hover:grayscale-0 transition-all'}`}>
              <img
                src={p2.avatar}
                className="w-full h-full object-cover"
                style={{ objectPosition: p2.alignment ? `${p2.alignment.x}% ${p2.alignment.y}%` : 'center 20%' }}
              />
            </div>
            <div className="absolute -bottom-1 -left-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#0B1120] p-1 border border-white/10 flex items-center justify-center shadow-md">
              <img src={t2?.logo} className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-xs md:text-sm font-bold uppercase tracking-tight leading-tight line-clamp-2 ${isFinished && fixture.score2! > fixture.score1! ? 'text-white' : 'text-slate-400'}`}>{p2.name}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 truncate">{t2?.name}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute top-2 right-2 flex gap-1">
          {isAuthorized && dragHandleProps && (
            <div {...dragHandleProps} className="p-2 cursor-grab text-slate-700 hover:text-white transition-colors">
              <GripVertical size={12} />
            </div>
          )}
          {isAuthorized && isFinished && !isEditing && (
            <button
              onClick={() => onDelete(fixture.id)}
              className="p-2 text-slate-700 hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

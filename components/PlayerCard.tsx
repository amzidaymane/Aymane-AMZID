
import React, { useState } from 'react';
import { Edit2, Trash2, Loader2, UserX } from 'lucide-react';
import { Player } from '../types';
import { TEAMS } from '../constants';

interface PlayerCardProps {
  player: Player;
  onDelete: (id: number) => void;
  onEdit: (player: Player) => void;
  isAuthorized?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onDelete, onEdit, isAuthorized = false }) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const team = TEAMS.find(t => t.id === player.teamId) || TEAMS[0];

  const objectPosition = player.alignment 
    ? `${player.alignment.x}% ${player.alignment.y}%` 
    : 'center 20%';

  const handleImageError = () => {
    setImageState('error');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const avatarFallback = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=020617`;

  return (
    <div className="group relative w-full aspect-[4/6] overflow-hidden rounded-sm border border-white/5 transition-all duration-700 hover:border-white/20 shadow-2xl bg-slate-950">
      
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 blur-[60px] pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${team.secondary}, transparent)` }}
      ></div>

      <div className="absolute inset-0 bg-slate-900">
        {imageState === 'loading' && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 animate-pulse flex items-center justify-center">
            <Loader2 className="animate-spin text-slate-800" size={24} />
          </div>
        )}

        {imageState === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
            <img 
              src={avatarFallback} 
              className="w-32 h-32 mb-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700"
              alt="Avatar Fallback"
            />
            <div className="space-y-1">
              <span className="text-[7px] font-black text-slate-700 uppercase tracking-[0.4em]">Asset Offline</span>
              <div className="text-2xl font-black italic tracking-tighter opacity-10 uppercase text-white">
                {getInitials(player.name)}
              </div>
            </div>
          </div>
        ) : (
          <img 
            src={player.avatar} 
            alt={player.name} 
            onLoad={() => setImageState('loaded')}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-all duration-1000 ${
              imageState === 'loaded' 
                ? 'opacity-85 group-hover:opacity-100 grayscale-[40%] group-hover:grayscale-0 group-hover:scale-110' 
                : 'opacity-0 blur-xl'
            }`} 
            style={{ objectPosition }}
          />
        )}
        
        <div 
          className="absolute inset-0 opacity-40 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none"
          style={{ background: `linear-gradient(to top, #020617 10%, transparent 70%, ${team.secondary}11)` }}
        ></div>
      </div>

      {/* Reduced opacity of background logo by 10% (from 0.18/0.23 to 0.08/0.13) */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-[0.08] group-hover:opacity-[0.13] transition-all duration-1000 rotate-[-15deg] group-hover:rotate-0 pointer-events-none">
        <img src={team.logo} alt="" className="w-56 h-56 object-contain grayscale" />
      </div>

      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse"></div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.5em] italic">System Verified</span>
          </div>
          <div className="relative group/logo">
             <div className="absolute inset-0 bg-white/5 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity"></div>
             <img 
                src={team.logo} 
                className="h-9 w-9 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-110 relative z-10" 
                alt={team.name} 
             />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent pt-32">
        <div className="space-y-1 transform group-hover:-translate-y-2 transition-transform duration-500">
          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none text-glow truncate pr-4">
            {player.name}
          </h3>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] italic opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: team.secondary }}>
            {team.name}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <div className="flex space-x-6">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-700 uppercase tracking-[0.2em] mb-1">Success</span>
              <span className="text-xl font-black text-white italic tracking-tighter">{player.wins}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-700 uppercase tracking-[0.2em] mb-1">Defeat</span>
              <span className="text-xl font-black text-white italic tracking-tighter opacity-20">{player.losses}</span>
            </div>
          </div>
          
          {isAuthorized && (
            <div className="flex space-x-1.5">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(player); }} 
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-slate-500 hover:text-white transition-all"
              >
                <Edit2 size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(player.id); }} 
                className="p-2.5 bg-red-600/5 hover:bg-red-600/20 border border-red-600/10 rounded-sm text-red-950 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

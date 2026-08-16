import React from 'react';
import { BookOpen, User, LogOut, Sliders, FileText, Sparkles } from 'lucide-react';

export default function Navbar({ user, selectedDoc, level, setLevel, onLogout }) {
  return (
    <header className="h-16 border-b border-slate-800 glass-panel sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight flex items-center gap-2 text-base">
            EduMind
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              RAG & Multi-Agents
            </span>
          </h1>
          <p className="text-xs text-slate-400">Espace de révision intelligent</p>
        </div>
      </div>

      {/* Scope & Level selector */}
      <div className="flex items-center gap-4">
        {/* Document Scope */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-400">Document actif:</span>
          {selectedDoc ? (
            <span className="font-medium text-indigo-300 truncate max-w-[160px]">
              {selectedDoc.name}
            </span>
          ) : (
            <span className="text-slate-500 italic">Aucun document sélectionné</span>
          )}
        </div>

        {/* Vulgarization Level Dropdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-400 hidden sm:inline">Niveau:</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
          >
            <option value="DEBUTANT" className="bg-slate-900 text-white">🌱 Débutant</option>
            <option value="INTERMEDIAIRE" className="bg-slate-900 text-white">⚖️ Intermédiaire</option>
            <option value="EXPERT" className="bg-slate-900 text-white">🔬 Expert</option>
          </select>
        </div>
      </div>

      {/* User profile & Logout */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium text-slate-200">{user.username}</span>
            <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
              {user.role}
            </span>
          </div>
        )}
        <button
          onClick={onLogout}
          title="Se déconnecter"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

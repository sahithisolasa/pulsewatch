import React, { useState } from 'react';
import { Plus, ListFilter, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface WatchlistManagerProps {
  onOpenSearch: () => void;
}

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({ onOpenSearch }) => {
  const {
    watchlists,
    activeWatchlistId,
    setActiveWatchlistId,
    createWatchlist,
    renameWatchlist,
    deleteWatchlist,
  } = useAuth();

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createWatchlist(newTitle.trim());
      setNewTitle('');
      setIsCreating(false);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create watchlist');
    }
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await renameWatchlist(id, editTitle.trim());
      setEditingId(null);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to rename');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWatchlist(id);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="bg-[#141416] border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
      {/* Watchlist Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 md:pb-0">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider pr-2 border-r border-slate-800">
          <ListFilter className="w-3.5 h-3.5 text-blue-400" />
          <span>Watchlists:</span>
        </div>

        {watchlists.map((wl) => {
          const isActive = wl.id === activeWatchlistId;
          const isEditingThis = editingId === wl.id;

          if (isEditingThis) {
            return (
              <div key={wl.id} className="flex items-center gap-1 bg-[#0A0A0B] px-2 py-1 rounded border border-blue-500">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-28"
                  autoFocus
                />
                <button
                  onClick={() => handleRename(wl.id)}
                  className="text-emerald-400 hover:text-emerald-300 p-0.5"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={wl.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => setActiveWatchlistId(wl.id)}
                className="flex items-center gap-1.5"
              >
                <span>{wl.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {wl.stocks.length}
                </span>
              </button>

              {isActive && (
                <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-700">
                  <button
                    onClick={() => {
                      setEditingId(wl.id);
                      setEditTitle(wl.name);
                    }}
                    title="Rename watchlist"
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {watchlists.length > 1 && (
                    <button
                      onClick={() => handleDelete(wl.id)}
                      title="Delete watchlist"
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Create new watchlist button / form */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="flex items-center gap-1 bg-[#0A0A0B] px-2.5 py-1 rounded border border-slate-700">
            <input
              type="text"
              placeholder="Watchlist name..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-transparent text-xs text-white outline-none w-28 placeholder:text-slate-500"
              autoFocus
            />
            <button type="submit" className="text-blue-400 hover:text-blue-300">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded border border-dashed border-slate-800 hover:border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New List</span>
          </button>
        )}
      </div>

      {/* Add Stock to current watchlist trigger */}
      <div className="flex items-center gap-2">
        {errorMsg && (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {errorMsg}
          </span>
        )}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Stock to {activeWatchlist?.name || 'Watchlist'}</span>
        </button>
      </div>
    </div>
  );
};

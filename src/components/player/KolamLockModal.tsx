import { useState, type FormEvent } from 'react';
import { gameApi } from '@/lib/api';
import type { OpenKolam, KolamCell } from '@/lib/types';
import { Grid3x3, Send, Loader2 } from 'lucide-react';

export function KolamLockModal({
  teamId,
  sessionToken,
  lock,
  onSolved,
}: {
  teamId: string;
  sessionToken: string;
  lock: OpenKolam;
  onSolved: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    setWrong(false);
    try {
      const result = await gameApi.kolamAnswer(teamId, lock.id, selected, sessionToken);
      if (result.correct) {
        onSolved();
        return;
      }
      setWrong(true);
    } catch (err) {
      setError((err as Error).message);
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-maroon-950/95 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md festive-card rounded-3xl p-6 space-y-5 animate-pop-in my-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-marigold-500 flex items-center justify-center animate-flame-flicker">
            <Grid3x3 className="w-7 h-7 text-maroon-950" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-gold-200">Kolam Lock!</h2>
            <p className="text-gold-200/70 text-sm mt-1">
              {lock.ownerName} locked your board. Complete the Kolam pattern to unlock your controls.
            </p>
          </div>
        </div>

        {/* Kolam grid display */}
        <KolamGrid grid={lock.grid} />

        <div className="text-center">
          <p className="text-gold-100 font-display text-sm">
            The glowing dot marks the missing tile. Tap the correct piece to complete the symmetrical pattern.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {lock.options.map((option, i) => {
              const isFilled = option === 'filled';
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setSelected(option); setWrong(false); }}
                  className={`aspect-square rounded-xl border-2 transition-all active:scale-90 ${
                    selected === option
                      ? 'border-gold-400 bg-gold-500/30 scale-105'
                      : 'border-gold-500/20 bg-maroon-950/50 hover:border-gold-500/40'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <div
                      className={`w-5 h-5 rounded-full transition-all ${
                        isFilled
                          ? 'bg-gradient-to-br from-gold-300 to-marigold-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'border-2 border-dashed border-gold-500/30'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {wrong && (
            <p className="text-marigold-300 text-sm text-center">
              Not quite — look at the symmetry and try again.
            </p>
          )}
          {error && (
            <p className="text-marigold-300 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!selected || submitting}
            className="w-full btn-primary rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Checking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

function KolamGrid({ grid }: { grid: KolamCell[][] }) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  return (
    <div className="rounded-2xl bg-maroon-950/60 border border-gold-500/30 p-4 flex items-center justify-center">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => {
            const key = `${ri}-${ci}`;
            if (cell === 'filled') {
              return (
                <div
                  key={key}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center"
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-gold-300 to-marigold-400 shadow-[0_0_6px_rgba(251,191,36,0.5)] animate-sparkle" style={{ animationDelay: `${(ri + ci) * 0.1}s` }} />
                </div>
              );
            }
            if (cell === 'target') {
              return (
                <div
                  key={key}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center"
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-dashed border-marigold-400 animate-pulse" />
                </div>
              );
            }
            return (
              <div
                key={key}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center"
              >
                <div className="w-1 h-1 rounded-full bg-gold-500/15" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

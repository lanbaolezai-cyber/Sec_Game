import { useState, type FormEvent } from 'react';
import { gameApi } from '@/lib/api';
import { Puzzle, Send, Loader2 } from 'lucide-react';

export interface OpenRiddle {
  id: string;
  ownerName: string;
  question: string;
}

export function RiddleTrapModal({
  teamId,
  sessionToken,
  riddle,
  onSolved,
}: {
  teamId: string;
  sessionToken: string;
  riddle: OpenRiddle;
  onSolved: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setWrong(false);
    try {
      const result = await gameApi.riddleAnswer(teamId, riddle.id, answer, sessionToken);
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
    <div className="fixed inset-0 z-50 bg-maroon-950/95 flex items-center justify-center p-4">
      <div className="w-full max-w-md festive-card rounded-3xl p-6 space-y-5 animate-pop-in">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-marigold-500 flex items-center justify-center">
            <Puzzle className="w-7 h-7 text-maroon-950" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-gold-200">Riddle Trap!</h2>
            <p className="text-gold-200/70 text-sm mt-1">
              {riddle.ownerName} trapped your team. Solve the riddle to roll again.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-maroon-950/60 border border-gold-500/30 px-5 py-4">
          <p className="text-gold-100 font-display text-lg leading-snug">{riddle.question}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer"
            autoFocus
            autoComplete="off"
            disabled={submitting}
            className={`w-full rounded-xl bg-maroon-950/60 border px-4 py-3 text-gold-100 placeholder:text-gold-200/40 focus:outline-none focus:ring-2 focus:ring-gold-400/60 transition ${
              wrong ? 'border-marigold-400' : 'border-gold-500/30'
            }`}
          />
          {wrong && (
            <p className="text-marigold-300 text-sm text-center">Not quite. Think again and try once more.</p>
          )}
          {error && (
            <p className="text-marigold-300 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={!answer.trim() || submitting}
            className="w-full btn-primary rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Checking...' : 'Submit answer'}
          </button>
        </form>
      </div>
    </div>
  );
}

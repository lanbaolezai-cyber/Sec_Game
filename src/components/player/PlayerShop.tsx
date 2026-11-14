import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { gameApi } from '@/lib/api';
import type { ShopItem } from '@/lib/types';
import { DiyaIcon, DiyaBalance } from '@/components/DiyaIcon';
import { StationIcon } from '@/components/StationIcon';
import { X, Lock, ArrowLeft } from 'lucide-react';

interface RivalTeam {
  id: string;
  name: string;
}

export function PlayerShop({
  teamId,
  sessionToken,
  balance,
  onClose,
}: {
  teamId: string;
  sessionToken: string;
  balance: number;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [gameRunning, setGameRunning] = useState<boolean | null>(null);
  const [rivals, setRivals] = useState<RivalTeam[]>([]);
  const [trapItem, setTrapItem] = useState<ShopItem | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    supabase.from('shop_items').select('*').eq('active', true).order('price').then(({ data, error }) => {
      if (error) {
        setMessage({ ok: false, text: 'Could not load the shop. Please try again.' });
        return;
      }
      if (data) setItems(data);
    });
    supabase.from('teams').select('id, name').neq('id', teamId).order('name').then(({ data, error }) => {
      if (error) {
        setMessage({ ok: false, text: 'Could not load the other teams.' });
        return;
      }
      if (data) setRivals(data);
    });
  }, [teamId]);

  useEffect(() => {
    supabase.from('game_config').select('status').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) {
        setMessage({ ok: false, text: 'Could not check the game status. Please try again.' });
        return;
      }
      setGameRunning(data?.status === 'running');
    });
    const channel = supabase
      .channel('shop-game-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_config' }, (payload) => {
        setGameRunning((payload.new as { status: string }).status === 'running');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleBuy(item: ShopItem, targetTeamId?: string) {
    setPurchasing(item.id);
    setMessage(null);
    try {
      const result = await gameApi.purchase(teamId, item.id, sessionToken, targetTeamId);
      if (result.shieldBlocked) {
        setMessage({
          ok: false,
          text: `${result.targetName} had a Riddle Shield. Your trap was blocked, and the Diyas were spent.`,
        });
        setTrapItem(null);
      } else {
        setMessage({ ok: true, text: `Purchased ${result.item}! -${item.price} Diyas` });
        onClose();
      }
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    }
    setPurchasing(null);
  }

  function handleItemClick(item: ShopItem) {
    setMessage(null);
    if (item.effect_type === 'riddle_trap' || item.effect_type === 'kolam_lock') {
      setTrapItem(item);
      return;
    }
    handleBuy(item);
  }

  return (
    <div className="fixed inset-0 z-40 bg-maroon-950/90 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg festive-card rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-maroon-900/95 backdrop-blur-md px-5 py-4 border-b border-gold-500/20 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-display font-bold text-gold-200">Festival Shop</h2>
            <DiyaBalance amount={balance} className="text-sm" />
          </div>
          <button onClick={onClose} className="text-gold-300 hover:text-gold-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {message && (
          <div className="px-4 pt-4">
            <div className={`rounded-xl px-4 py-2 text-sm text-center ${message.ok ? 'bg-jewel-900/40 text-jewel-300' : 'bg-marigold-900/40 text-marigold-300'}`}>
              {message.text}
            </div>
          </div>
        )}

        {gameRunning === false && (
          <div className="px-4 pt-4">
            <div className="rounded-xl px-4 py-2 text-sm text-center bg-gold-500/10 text-gold-200">
              The shop opens once the game starts.
            </div>
          </div>
        )}

        {trapItem ? (
          <div className="p-4 space-y-3">
            <button
              onClick={() => { setTrapItem(null); setMessage(null); }}
              className="inline-flex items-center gap-1 text-sm text-gold-200/70 hover:text-gold-100 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to shop
            </button>
            <div>
              <h3 className="font-display font-semibold text-gold-100">Choose a rival team</h3>
              <p className="text-gold-200/60 text-xs mt-0.5">
                {trapItem.effect_type === 'kolam_lock'
                  ? 'Their board will be locked with a Kolam pattern they must solve before rolling.'
                  : 'They will get a riddle they must solve before they can roll again.'}
              </p>
            </div>
            {rivals.length === 0 ? (
              <p className="text-gold-200/50 text-center py-6">No other teams to target yet</p>
            ) : (
              rivals.map((rival) => (
                <button
                  key={rival.id}
                  onClick={() => handleBuy(trapItem, rival.id)}
                  disabled={purchasing !== null}
                  className="w-full text-left rounded-xl border border-gold-500/30 bg-maroon-800/50 px-4 py-3 text-gold-100 font-medium hover:bg-maroon-800 transition active:scale-95 disabled:opacity-50"
                >
                  {purchasing === trapItem.id ? 'Setting trap…' : rival.name}
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {items.length === 0 ? (
              <p className="text-gold-200/50 text-center py-8">No items available</p>
            ) : (
              items.map((item) => {
                const affordable = balance >= item.price;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 transition ${
                      affordable
                        ? 'bg-maroon-800/50 border-gold-500/30'
                        : 'bg-maroon-950/50 border-gold-500/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-marigold-500 flex items-center justify-center shrink-0">
                        <StationIcon icon={item.icon} className="w-5 h-5 text-maroon-950" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display font-semibold text-gold-100">{item.name}</h3>
                          <span className="inline-flex items-center gap-1 text-flame-300 font-display font-bold text-sm shrink-0">
                            <DiyaIcon className="w-4 h-4" /> {item.price}
                          </span>
                        </div>
                        <p className="text-gold-200/60 text-xs mt-0.5">{item.description}</p>
                        <button
                          onClick={() => handleItemClick(item)}
                          disabled={!affordable || gameRunning !== true || purchasing === item.id}
                          className={`mt-2 w-full rounded-lg py-2 text-sm font-medium transition active:scale-95 ${
                            affordable
                              ? 'bg-gradient-to-br from-gold-400 to-marigold-500 text-maroon-950 font-semibold hover:brightness-110'
                              : 'bg-maroon-950/60 text-gold-200/40 cursor-not-allowed flex items-center justify-center gap-1'
                          }`}
                        >
                          {affordable ? (
                            purchasing === item.id ? 'Buying…' : 'Buy'
                          ) : (
                            <><Lock className="w-3.5 h-3.5" /> Not enough Diyas</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

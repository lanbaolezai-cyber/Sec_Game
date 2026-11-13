/*
# Add Riddle Trap shop item

1. New Tables
- `riddle_traps`: one row per trap bought. Stores the team that bought it (`owner_team_id`), the team it targets (`target_team_id`), and whether it is still `armed` or has been `triggered`.

2. New Shop Item
- "Riddle Trap" (45 Diyas, puzzle icon). Buying it requires choosing another team as the target.

3. Security
- RLS is enabled on `riddle_traps` with no policies, so players and the browser cannot read or write it directly.
- Only the server (service role) is granted access, through the game action function.

4. Notes
- A trap is consumed the next time its target rolls the dice.
- The trap insert uses IF NOT EXISTS and the shop item insert is guarded by a NOT EXISTS check, so this migration is safe to re-run.
*/

CREATE TABLE IF NOT EXISTS riddle_traps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  target_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'armed' CHECK (status IN ('armed', 'triggered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  triggered_at timestamptz
);

CREATE INDEX IF NOT EXISTS riddle_traps_target_armed_idx
  ON riddle_traps (target_team_id, created_at) WHERE status = 'armed';

ALTER TABLE riddle_traps ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON riddle_traps TO service_role;

INSERT INTO shop_items (name, description, price, effect_type, icon, active)
SELECT
  'Riddle Trap',
  'Pick a rival team. The next time they roll, their riddle snare holds them on their tile for that turn.',
  45,
  'riddle_trap',
  'puzzle',
  true
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Riddle Trap');

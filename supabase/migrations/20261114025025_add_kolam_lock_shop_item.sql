/*
# Add Kolam Lock shop item and kolam_locks table

1. New Tables
- `kolam_locks`
  - `id` (uuid, primary key, default gen_random_uuid())
  - `owner_team_id` (uuid, not null) — the team that bought the lock
  - `target_team_id` (uuid, not null) — the team whose board gets blocked
  - `status` (text, not null, default 'armed') — 'armed' then 'solved'
  - `created_at` (timestamptz, default now())
  - `triggered_at` (timestamptz, nullable) — when the target's turn began
  - `pattern_index` (integer, not null, default 0) — which Kolam pattern to show
  - `solved_at` (timestamptz, nullable) — when the target solved it
  Mirrors the structure of `riddle_traps`.

2. Modified Tables
- `shop_items` — inserts one new row: "Kolam Lock" (effect_type = 'kolam_lock', icon = 'grid', price = 40).

3. Security
- Enable RLS on `kolam_locks`.
- Grant SELECT, INSERT, UPDATE to anon + authenticated (same pattern as riddle_traps / riddle_shields).
- Policy: anon + authenticated can do all CRUD (intentionally public/shared game data, matching the existing riddle_traps and riddle_shields posture).

4. Notes
- The Kolam Lock blocks the target team's board with a glowing Kolam pattern puzzle.
- The target must connect dots in a continuous line or tap the missing symmetrical tile from 4 options.
- Once solved, the lock is marked 'solved' and the team can roll again.
- If the target has an active Riddle Shield, the lock is blocked (same as riddle_trap) — handled in edge function logic, not the schema.
*/

CREATE TABLE IF NOT EXISTS kolam_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  target_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'armed',
  created_at timestamptz NOT NULL DEFAULT now(),
  triggered_at timestamptz,
  pattern_index integer NOT NULL DEFAULT 0,
  solved_at timestamptz
);

ALTER TABLE kolam_locks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON kolam_locks TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON kolam_locks TO service_role;

DROP POLICY IF EXISTS "anon_all_kolam_locks" ON kolam_locks;
CREATE POLICY "anon_all_kolam_locks"
  ON kolam_locks FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Insert the Kolam Lock shop item (idempotent: skip if already exists)
INSERT INTO shop_items (name, description, price, effect_type, icon, active)
SELECT 'Kolam Lock',
       'Pick a rival team. A glowing Kolam grid blocks their board — they must complete the symmetrical pattern to unlock their controls.',
       40, 'kolam_lock', 'grid', true
WHERE NOT EXISTS (
  SELECT 1 FROM shop_items WHERE effect_type = 'kolam_lock'
);

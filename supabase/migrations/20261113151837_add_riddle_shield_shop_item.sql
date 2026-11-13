/*
# Add Riddle Shield shop item

1. New Tables
- `riddle_shields`: one row per shield bought. Each shield holds one charge: it blocks one riddle trap aimed at the team that owns it.
  - `team_id`: the team that owns the shield.
  - `status`: `active` (ready to block) or `used` (already blocked a trap).
  - `used_at`: when the shield blocked a trap.

2. New Shop Item
- "Riddle Shield" (35 Diyas, shield icon).

3. Security
- RLS is enabled on `riddle_shields` with no policies, so players and the browser cannot read or write it directly.
- Only the server (service role) is granted access, through the game action function.

4. Notes
- Every statement is idempotent (IF NOT EXISTS and a NOT EXISTS guard on the shop item), so the migration is safe to re-run.
*/

CREATE TABLE IF NOT EXISTS riddle_shields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used')),
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS riddle_shields_team_active_idx
  ON riddle_shields (team_id, created_at) WHERE status = 'active';

ALTER TABLE riddle_shields ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON riddle_shields TO service_role;

INSERT INTO shop_items (name, description, price, effect_type, icon, active)
SELECT
  'Riddle Shield',
  'Blocks one Riddle Trap aimed at your team. The rival still pays, but the trap does not land.',
  35,
  'riddle_shield',
  'shield-check',
  true
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Riddle Shield');

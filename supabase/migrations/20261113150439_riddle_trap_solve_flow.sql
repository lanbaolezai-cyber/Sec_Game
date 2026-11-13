/*
# Riddle Trap: stay active until the riddle is solved

1. Modified Tables
- `riddle_traps`
  - New column `riddle_index` (integer, default 0): which riddle from the server's list this trap shows.
  - New column `solved_at` (timestamptz, nullable): when the target team answered correctly.
  - Status values are now `armed` (riddle pending, target cannot roll) and `solved` (target may roll again).
  - The previous status rule that allowed `triggered` is replaced by one that allows `armed` or `solved`.

2. Security
- No change to access. The table stays server-only; riddle answers are never stored in or sent from the table.

3. Notes
- Existing rows keep status `armed`, which now means the riddle is still open.
- Every statement is idempotent (IF NOT EXISTS / DROP CONSTRAINT IF EXISTS), so the migration is safe to re-run.
- Sequence: drop the old status rule before adding the new one so existing rows do not violate it.
*/

ALTER TABLE riddle_traps ADD COLUMN IF NOT EXISTS riddle_index integer NOT NULL DEFAULT 0;
ALTER TABLE riddle_traps ADD COLUMN IF NOT EXISTS solved_at timestamptz;

ALTER TABLE riddle_traps DROP CONSTRAINT IF EXISTS riddle_traps_status_check;
ALTER TABLE riddle_traps ADD CONSTRAINT riddle_traps_status_check CHECK (status IN ('armed', 'solved'));

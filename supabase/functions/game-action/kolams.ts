export interface KolamPattern {
  // A grid of cells: 'filled' = lit dot, 'empty' = no dot, 'target' = the missing tile to find
  grid: ("filled" | "empty" | "target")[][];
  // The 4 options for the missing tile question (only used in "pick" mode)
  options: string[];
  correctOption: string;
}

// Each pattern is a small symmetrical grid. The 'target' cell is the one
// the player must identify/complete to demonstrate Kolam symmetry.
// Patterns alternate between "connect the dots" (visual) and "pick the missing tile".
export const KOLAM_PATTERNS: KolamPattern[] = [
  {
    // Pattern 0: 5x5 radial symmetry — find the missing dot position
    grid: [
      ["empty", "filled", "filled", "filled", "empty"],
      ["filled", "filled", "empty", "filled", "filled"],
      ["filled", "empty", "target", "empty", "filled"],
      ["filled", "filled", "empty", "filled", "filled"],
      ["empty", "filled", "filled", "filled", "empty"],
    ],
    options: ["filled", "empty", "filled", "empty"],
    correctOption: "filled",
  },
  {
    // Pattern 1: 5x5 diamond — find the missing dot
    grid: [
      ["empty", "empty", "filled", "empty", "empty"],
      ["empty", "filled", "filled", "filled", "empty"],
      ["filled", "filled", "target", "filled", "filled"],
      ["empty", "filled", "filled", "filled", "empty"],
      ["empty", "empty", "filled", "empty", "empty"],
    ],
    options: ["empty", "filled", "empty", "filled"],
    correctOption: "filled",
  },
  {
    // Pattern 2: 5x5 cross — find the missing dot
    grid: [
      ["empty", "empty", "filled", "empty", "empty"],
      ["empty", "empty", "filled", "empty", "empty"],
      ["filled", "filled", "filled", "filled", "filled"],
      ["empty", "empty", "target", "empty", "empty"],
      ["empty", "empty", "filled", "empty", "empty"],
    ],
    options: ["filled", "empty", "filled", "empty"],
    correctOption: "filled",
  },
  {
    // Pattern 3: 5x5 lotus — find the missing dot
    grid: [
      ["filled", "empty", "filled", "empty", "filled"],
      ["empty", "filled", "filled", "filled", "empty"],
      ["filled", "filled", "filled", "filled", "filled"],
      ["empty", "filled", "target", "filled", "empty"],
      ["filled", "empty", "filled", "empty", "filled"],
    ],
    options: ["empty", "filled", "empty", "filled"],
    correctOption: "filled",
  },
];

// For the "pick the missing tile" challenge, we generate a question
// with 4 options. The correct answer is determined by symmetry.
export function getKolamChallenge(patternIndex: number) {
  const pattern = KOLAM_PATTERNS[patternIndex] ?? KOLAM_PATTERNS[0];
  return {
    patternIndex,
    grid: pattern.grid,
    options: pattern.options,
    correctOption: pattern.correctOption,
  };
}

// Check if the player's answer matches the correct option
export function isCorrectKolamAnswer(patternIndex: number, answer: string): boolean {
  const pattern = KOLAM_PATTERNS[patternIndex] ?? KOLAM_PATTERNS[0];
  return answer === pattern.correctOption;
}

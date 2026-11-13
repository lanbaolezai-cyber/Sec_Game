export interface Riddle {
  question: string;
  answers: string[];
}

export const RIDDLES: Riddle[] = [
  {
    question: "I have keys but open no locks, I have space but no room, and you can enter but never go outside. What am I?",
    answers: ["keyboard"],
  },
  {
    question: "The more of me you take, the more you leave behind. What am I?",
    answers: ["footsteps", "footstep"],
  },
  {
    question: "I am made of clay, I hold oil and a cotton wick, and I light up homes on Diwali night. What am I?",
    answers: ["diya", "diye", "deepak"],
  },
  {
    question: "The more I dry, the wetter I become. What am I?",
    answers: ["towel"],
  },
  {
    question: "I have a face and two hands but no arms or legs, and I tell you the time. What am I?",
    answers: ["clock", "watch"],
  },
  {
    question: "I have many rings but no fingers, and people talk into me. What am I?",
    answers: ["telephone", "phone"],
  },
];

export function normalizeAnswer(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isCorrectAnswer(riddle: Riddle, attempt: string): boolean {
  const normalized = normalizeAnswer(attempt);
  return normalized.length > 0 && riddle.answers.some((a) => normalizeAnswer(a) === normalized);
}

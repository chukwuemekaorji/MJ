export type DailyQuestion = {
  id: string;
  question: string;
  focus: string;
  answerPrompt: string;
};

const QUESTION_BANK: DailyQuestion[] = [
  {
    id: 'clarify-problem',
    question: 'What problem are you actually solving today?',
    focus: 'Separate the stated request from the underlying outcome you need.',
    answerPrompt: 'Write the real objective in one sentence and list the smallest proof that would satisfy it.'
  },
  {
    id: 'remove-friction',
    question: 'What is the single biggest source of friction in your current workflow?',
    focus: 'Find the step that costs the most time, context switching, or uncertainty.',
    answerPrompt: 'Name the blocker, describe its impact, and sketch one simplification you can test this week.'
  },
  {
    id: 'smallest-step',
    question: 'What is the smallest useful next step?',
    focus: 'Shrink the problem until progress becomes obvious and low risk.',
    answerPrompt: 'Choose one action that takes under ten minutes and moves the work forward.'
  },
  {
    id: 'success-criteria',
    question: 'How will you know this work is done well enough?',
    focus: 'Define a finish line before you start expanding the scope.',
    answerPrompt: 'List three acceptance criteria and one thing you explicitly will not optimize yet.'
  },
  {
    id: 'hidden-assumption',
    question: 'Which assumption, if false, would change the whole plan?',
    focus: 'Surface the fragile part of the strategy before investing more time.',
    answerPrompt: 'Write the assumption, the risk if it fails, and one cheap test to validate it.'
  },
  {
    id: 'user-value',
    question: 'Who benefits most from this result, and what do they gain?',
    focus: 'Keep the work anchored to a real audience and a measurable payoff.',
    answerPrompt: 'Describe the user, their gain, and the concrete behavior that would prove value.'
  },
  {
    id: 'quality-bar',
    question: 'What quality bar is appropriate for today: prototype, draft, or final?',
    focus: 'Match effort to the actual phase of the work.',
    answerPrompt: 'Pick the bar and write what that bar means in practical terms.'
  },
  {
    id: 'next-review',
    question: 'What would you review first if this needed a quick sanity check?',
    focus: 'Create a lightweight inspection path that catches obvious mistakes early.',
    answerPrompt: 'Name the first artifact, the key signal, and the likely failure mode.'
  }
];

function hashDate(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDailyQuestion(date: Date = new Date()) {
  const isoDate = toIsoDate(date);
  const index = hashDate(`${process.env.DAILY_QUESTION_SEED ?? 'mj-daily'}:${isoDate}`) % QUESTION_BANK.length;
  const selected = QUESTION_BANK[index];

  return {
    ...selected,
    date: isoDate,
    index
  };
}

function getTodayDailyPrompt(coupleId: any, string: any) {
  throw new Error("Function not implemented.");
}

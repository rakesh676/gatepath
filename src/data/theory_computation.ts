import { Question } from "./types";

export const TOC_QUESTIONS: Question[] = [
  {
    type: "MCQ",
    id: "toc-1",
    subject: "Theory of Computation",
    topic: "Finite Automata",
    question: "Which of the following languages is NOT regular?",
    options: {
      a: "L = {a^n b^n | n >= 0}",
      b: "L = {a^n | n is even}",
      c: "L = {w | w starts with 'ab'}",
      d: "L = {w | w has an even number of 1s}"
    },
    correct_answer: "a",
    difficulty: "medium",
    explanation: "The language {a^n b^n | n >= 0} requires memory to count the number of 'a's to match with 'b's, which a Finite Automaton lacks. It is a Context-Free Language."
  }
];

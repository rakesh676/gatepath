import { Question } from "./types";

export const DBMS_QUESTIONS: Question[] = [
  {
    type: "MCQ",
    id: "dbms-1",
    subject: "DBMS",
    topic: "Normalization",
    question: "A relation is in BCNF if and only if for every non-trivial functional dependency X -> Y:",
    options: {
      a: "X is a superkey",
      b: "Y is a prime attribute",
      c: "X is a prime attribute",
      d: "Y is a superkey"
    },
    correct_answer: "a",
    difficulty: "medium",
    explanation: "Boyce-Codd Normal Form (BCNF) requires that for every functional dependency X -> Y, X must be a superkey of the relation."
  }
];

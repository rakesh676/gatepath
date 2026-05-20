import { Question } from "./types";

export const ALGO_QUESTIONS: Question[] = [
  {
    type: "MCQ",
    id: "algo-1",
    subject: "Algorithms",
    topic: "Sorting",
    question: "What is the worst-case time complexity of QuickSort?",
    options: {
      a: "O(n log n)",
      b: "O(n^2)",
      c: "O(n)",
      d: "O(log n)"
    },
    correct_answer: "b",
    difficulty: "medium",
    explanation: "QuickSort's worst case is O(n^2), which occurs when the pivot is consistently the smallest or largest element (e.g., when the array is already sorted)."
  }
];

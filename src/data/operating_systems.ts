import { Question } from "./types";

export const OS_QUESTIONS: Question[] = [
  {
    type: "MCQ",
    id: "os-1",
    subject: "Operating Systems",
    topic: "Processes & Threads",
    question: "What is the primary purpose of a PCB (Process Control Block)?",
    options: {
      a: "To store the process executable code",
      b: "To store all information needed to manage a process",
      c: "To speed up the execution of the process",
      d: "To handle user input for the process"
    },
    correct_answer: "b",
    difficulty: "easy",
    explanation: "The Process Control Block (PCB) contains all the information that the OS needs to manage a process, including state, program counter, register values, memory management information, etc."
  }
];

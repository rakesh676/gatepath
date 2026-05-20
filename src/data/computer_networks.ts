import { Question } from "./types";

export const CN_QUESTIONS: Question[] = [
  {
    type: "MCQ",
    id: "cn-1",
    subject: "Computer Networks",
    topic: "IP Addressing",
    question: "Which of the following is a private IP address range?",
    options: {
      a: "172.16.0.0 – 172.31.255.255",
      b: "192.168.0.0 – 192.168.255.255",
      c: "10.0.0.0 – 10.255.255.255",
      d: "All of the above"
    },
    correct_answer: "d",
    difficulty: "easy"
  }
];

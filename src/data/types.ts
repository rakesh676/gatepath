export type QuestionType = "MCQ" | "MSQ" | "NAT";

export interface Question {
  id: string;
  subject: string;
  topic?: string;
  type: QuestionType;
  question: string;
  options?: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correct_answer: string; // "a" for MCQ, "a,b" for MSQ
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
  marks?: number;
}

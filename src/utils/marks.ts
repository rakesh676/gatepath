export interface AttemptAnswer {
  id: string;
  chosen: string;
  correct: string;
  isCorrect: boolean;
  type: "MCQ" | "MSQ" | "NAT";
}

export function calculateAttemptMarks(answers: AttemptAnswer[] | null | undefined) {
  let totalMarks = 0;
  let earnedMarks = 0;
  
  if (!answers || !Array.isArray(answers)) {
    return { earnedMarks: 0, totalMarks: 0 };
  }

  answers.forEach((d) => {
    const qMax = d.type === "MSQ" ? 2 : 1;
    totalMarks += qMax;
    
    if (d.isCorrect) {
      earnedMarks += qMax;
    } else if (d.chosen && d.chosen.trim() !== "" && d.type === "MCQ") {
      earnedMarks -= 0.33; // Negative marking for MCQ
    }
  });

  return {
    earnedMarks: Math.max(0, Number(earnedMarks.toFixed(2))),
    totalMarks,
  };
}

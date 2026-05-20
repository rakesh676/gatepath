import { Question } from "./types";
import { OS_QUESTIONS } from "./operating_systems";
import { DBMS_QUESTIONS } from "./dbms";
import { CN_QUESTIONS } from "./computer_networks";
import { ALGO_QUESTIONS } from "./algorithms";
import { TOC_QUESTIONS } from "./theory_computation";
import { APTITUDE_QUESTIONS } from "./general_aptitude";
import { COMPILER_QUESTIONS } from "./compiler_design";
import { DIGITAL_QUESTIONS } from "./digital_logic";
import { DISCRETE_QUESTIONS } from "./discrete_mathematics";
import { COA_QUESTIONS } from "./computer_organization_architecture";
import { C_DSA_QUESTIONS } from "./programming_data_structures";

export * from "./types";
export { OS_QUESTIONS } from "./operating_systems";
export { DBMS_QUESTIONS } from "./dbms";
export { CN_QUESTIONS } from "./computer_networks";
export { ALGO_QUESTIONS } from "./algorithms";
export { TOC_QUESTIONS } from "./theory_computation";
export { APTITUDE_QUESTIONS } from "./general_aptitude";
export { COMPILER_QUESTIONS } from "./compiler_design";
export { DIGITAL_QUESTIONS } from "./digital_logic";
export { DISCRETE_QUESTIONS } from "./discrete_mathematics";
export { COA_QUESTIONS } from "./computer_organization_architecture";
export { C_DSA_QUESTIONS } from "./programming_data_structures";

export const ALL_QUESTIONS: Question[] = [
  ...OS_QUESTIONS,
  ...DBMS_QUESTIONS,
  ...CN_QUESTIONS,
  ...ALGO_QUESTIONS,
  ...TOC_QUESTIONS,
  ...APTITUDE_QUESTIONS,
  ...COMPILER_QUESTIONS,
  ...DIGITAL_QUESTIONS,
  ...DISCRETE_QUESTIONS,
  ...COA_QUESTIONS,
  ...C_DSA_QUESTIONS,
];


export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  CLARIFYING = 'CLARIFYING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  answer?: string;
}

export interface FinalPrompt {
  persona: string;
  steps: string;
  constraints: string;
  outputSpec: string;
  apiConfig: {
    temperature: number;
    thinkingBudget: number;
    recommendedModel: string;
  };
  fullMarkdown: string;
}

export interface ArchitectSession {
  id: string;
  initialInput: string;
  questions: ClarificationQuestion[];
  finalResult?: FinalPrompt;
  timestamp: number;
}

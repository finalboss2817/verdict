
export type IntentLevel = 'High' | 'Medium' | 'Low';
export type AnalysisMode = 'VOID' | 'NEXUS';

export interface Analysis {
  id: string;
  user_id: string;
  timestamp: number;
  objection: string;
  mode: AnalysisMode;
  context: {
    ticketSize: string;
    product: string;
    stage: string;
  };
  result: {
    meaning: string;
    intentLevel: IntentLevel;
    intentExplanation: string;
    closeProbability: string;
    bestResponse: string;
    whatNotToSay: string[];
    followUpStrategy: {
      maxFollowUps: string;
      timeGap: string;
      stopCondition: string;
    };
    walkAwaySignal: string;
  };
}

export interface ObjectionInput {
  objection: string;
  ticketSize: string;
  product: string;
  stage: string;
  mode: AnalysisMode;
}

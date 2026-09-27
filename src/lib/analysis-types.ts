export type KeywordFound = {
  term: string;
  evidence: string;
};

export type KeywordMissing = {
  term: string;
  explanation: string;
};

export type KeywordPartial = {
  term: string;
  note: string;
};

export type AnalysisResult = {
  matchScore: number;
  jobTitle: string;
  summary: string;
  keywordsFound: KeywordFound[];
  keywordsPartial: KeywordPartial[];
  keywordsMissing: KeywordMissing[];
  technicalSkills: string[];
  softSkills: string[];
  strengths: string[];
  improvements: string[];
  optimizedResume: string;
};

export const MIN_CONTENT_LENGTH = 120;

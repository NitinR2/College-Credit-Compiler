export interface APCourse {
  id: string;
  courseName: string;
  score?: string; // Optional, formatted as string to handle "3+" or numeric strings
}

export interface UniversityEntry {
  name: string;
  residency: 'In-State' | 'Out-of-State';
}

export interface UserFormData {
  degreeLevel: 'Undergraduate' | 'Postgraduate';
  university: string;
  residency: 'In-State' | 'Out-of-State';
  universities: UniversityEntry[]; // Updated to store object with residency
  program: string; // "Intended Program"
  major: string;
  minor: string;
  apCourses: APCourse[];
  languages: string;
  communityCollege: string;
  targetCommunityCollege: string; // New field for future summer planning
  interests: string; // New field for sports, music, etc.
  scoreReportImage?: string; // Base64 string of uploaded report
}

export interface CreditItem {
  activity: string; // The input activity (e.g., AP Chem)
  universityCourse: string; // The equivalent course (e.g., CHEM 101)
  creditHours: string | number;
  notes: string;
}

export interface RecommendedCourse {
  ccCourse: string; // Course at Community College
  universityEquivalent: string; // Equivalent at Target Uni
  creditHours: string | number; // Estimated credit hours
  reason: string; // Why take it? (Gen Ed, Major Prep)
}

export interface AnalysisResult {
  canonicalUniversityName: string; // New: Official corrected name
  summary: string;
  credits: CreditItem[];
  summerRecommendations?: RecommendedCourse[];
  totalCredits: string | number;
  // New fields for progress and financials
  degreeTotalCredits: number; // e.g. 120
  estimatedCostPerCredit: number; // e.g. 500
  currencySymbol: string; // e.g. "$"
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ComparisonItem {
  id: string;
  university: string;
  residency: 'In-State' | 'Out-of-State';
  totalCredits: string | number;
  program: string;
  timestamp: number;
  fullResult?: AnalysisResult;
  sources?: { uri: string; title: string }[];
}

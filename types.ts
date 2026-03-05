
export interface PlantDiagnosisResult {
  plantName: string;
  diagnosis: string;
  cause: string;
  treatment: string[];
  preventiveMeasures: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface DiagnosisHistoryItem {
  id: string;
  date: string;
  imageUrl?: string;
  result: PlantDiagnosisResult;
}

export interface SymptomCardData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tag: string;
  tagColor: string;
}

export type ViewType = 'home' | 'camera' | 'text-input' | 'result' | 'loading' | 'history';

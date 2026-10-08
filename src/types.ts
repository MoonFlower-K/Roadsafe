/**
 * Core type definitions for ROADSAFE AI ML Engine
 */

export type SeverityClass = 'Slight' | 'Serious' | 'Fatal';

export interface RawCollisionRow {
  [key: string]: string | number | undefined;
}

export interface CleanedCollisionRecord {
  id: string;
  severity: SeverityClass;
  speedLimit: number;
  roadType: string;
  junctionDetail: string;
  junctionControl: string;
  urbanOrRural: string;
  weather: string;
  roadSurface: string;
  lightConditions: string;
  dayOfWeek: string;
  hour: number;
  numberOfVehicles: number;
}

export interface DatasetStatistics {
  totalRowsRaw: number;
  totalValid: number;
  duplicatesRemoved: number;
  invalidDropped: number;
  slightCount: number;
  seriousCount: number;
  fatalCount: number;
  slightPct: number;
  seriousPct: number;
  fatalPct: number;
  classWeights: { [K in SeverityClass]: number };
  featureNames: string[];
  rawColumns: string[];
}

export interface ClassMetrics {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface ConfusionMatrixData {
  matrix: number[][]; // [actual][predicted] 3x3: 0=Slight, 1=Serious, 2=Fatal
  labels: SeverityClass[];
  totalSamples: number;
}

export interface ModelEvaluation {
  modelName: 'Logistic Regression' | 'Decision Tree' | 'Random Forest';
  accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  classMetrics: {
    Slight: ClassMetrics;
    Serious: ClassMetrics;
    Fatal: ClassMetrics;
  };
  confusionMatrix: ConfusionMatrixData;
  trainingTimeMs: number;
  featureImportance: { feature: string; importance: number }[];
}

export interface ModelComparisonResult {
  evaluations: ModelEvaluation[];
  championModelName: 'Logistic Regression' | 'Decision Tree' | 'Random Forest';
  championEvaluation: ModelEvaluation;
}

export interface PredictionInput {
  speedLimit: number;
  roadType: string;
  junctionDetail: string;
  junctionControl: string;
  urbanOrRural: string;
  weather: string;
  roadSurface: string;
  lightConditions: string;
  dayOfWeek: string;
  hour: number;
  numberOfVehicles: number;
}

export interface PredictionResult {
  predictedClass: SeverityClass;
  probabilities: {
    Slight: number;
    Serious: number;
    Fatal: number;
  };
  confidence: number;
  dominantRiskFactors: {
    factor: string;
    impact: 'Elevates Fatal/Serious Risk' | 'Associated with Slight' | 'Neutral';
    reason: string;
  }[];
}

export interface PreprocessedData {
  X_train: number[][];
  y_train: number[];
  X_test: number[][];
  y_test: number[];
  featureNames: string[];
  numericalMeans: { [idx: number]: number };
  numericalStds: { [idx: number]: number };
  categoricalMappings: { [feature: string]: string[] };
  cleanedRecords: CleanedCollisionRecord[];
  stats: DatasetStatistics;
}

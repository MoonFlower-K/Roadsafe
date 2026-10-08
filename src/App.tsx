/**
 * ROADSAFE - Road Accident Severity Prediction ML Application
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { UploadView } from './components/UploadView';
import { OverviewPage } from './components/OverviewPage';
import { PredictPage } from './components/PredictPage';
import { parseCSVFile, cleanAndPreprocess } from './ml/preprocessor';
import { trainAndCompareAllModels, MLClassifier } from './ml/models';
import { generateSampleSTATS19CSV } from './ml/sampleDataset';
import {
  CleanedCollisionRecord,
  DatasetStatistics,
  ModelComparisonResult,
} from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'overview' | 'predict'>('overview');

  // Pipeline execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Model & Dataset state
  const [stats, setStats] = useState<DatasetStatistics | null>(null);
  const [cleanedRecords, setCleanedRecords] = useState<CleanedCollisionRecord[] | null>(null);
  const [modelComparison, setModelComparison] = useState<ModelComparisonResult | null>(null);
  const [championModel, setChampionModel] = useState<MLClassifier | null>(null);
  const [categoricalMappings, setCategoricalMappings] = useState<Record<string, string[]> | null>(null);

  const processCSVContent = async (fileOrText: File | string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProgressPercent(10);
    setProgressStep('Parsing CSV structure & inspecting header fields...');

    try {
      // 1. Parse CSV
      const { data, columns } = await parseCSVFile(fileOrText);
      setProgressPercent(30);
      setProgressStep('Validating STATS19 columns and target identification...');

      if (data.length === 0) {
        throw new Error('The uploaded CSV file is empty.');
      }

      // Small async pause to allow UI update
      await new Promise((r) => setTimeout(r, 60));

      // 2. Clean & Preprocess
      setProgressPercent(45);
      setProgressStep('Cleaning missing values, deduplicating, and computing class weights...');
      const preprocessed = cleanAndPreprocess(data, columns);

      await new Promise((r) => setTimeout(r, 80));

      // 3. Train ML Models & Compare
      const result = trainAndCompareAllModels(preprocessed, (step, pct) => {
        setProgressStep(step);
        setProgressPercent(45 + Math.round((pct * 0.55)));
      });

      // Update state
      setStats(preprocessed.stats);
      setCleanedRecords(preprocessed.cleanedRecords);
      setModelComparison(result.comparison);
      setChampionModel(result.championModel);
      setCategoricalMappings(preprocessed.categoricalMappings);
      setCurrentPage('overview');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to process CSV file.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setProgressStep('');
      setProgressPercent(0);
    }
  };

  const handleFileUpload = (file: File) => {
    processCSVContent(file);
  };

  const handleLoadSample = () => {
    const sampleCsv = generateSampleSTATS19CSV();
    processCSVContent(sampleCsv);
  };

  const handleResetDataset = () => {
    setStats(null);
    setCleanedRecords(null);
    setModelComparison(null);
    setChampionModel(null);
    setCategoricalMappings(null);
    setCurrentPage('overview');
  };

  const hasLoadedModel = Boolean(stats && modelComparison && championModel && categoricalMappings && cleanedRecords);

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex text-[#1E2229]">
      {/* Sidebar with exact 3 items: Brand, Overview, Predict Severity */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        hasModel={hasLoadedModel}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 min-w-0 p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto">
        {!hasLoadedModel ? (
          /* Initial Screen: Upload 2025 Collision Dataset */
          <UploadView
            onFileUpload={handleFileUpload}
            onLoadSample={handleLoadSample}
            isProcessing={isProcessing}
            progressStep={progressStep}
            progressPercent={progressPercent}
            errorMessage={errorMessage}
          />
        ) : currentPage === 'overview' ? (
          /* Page 1: OVERVIEW */
          <OverviewPage
            stats={stats!}
            cleanedRecords={cleanedRecords!}
            modelComparison={modelComparison!}
            onResetDataset={handleResetDataset}
          />
        ) : (
          /* Page 2: PREDICT SEVERITY */
          <PredictPage
            championModel={championModel!}
            championEvaluation={modelComparison!.championEvaluation}
            categoricalMappings={categoricalMappings!}
          />
        )}
      </main>
    </div>
  );
}

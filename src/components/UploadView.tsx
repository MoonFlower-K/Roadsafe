import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface UploadViewProps {
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  isProcessing: boolean;
  progressStep: string;
  progressPercent: number;
  errorMessage: string | null;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onFileUpload,
  onLoadSample,
  isProcessing,
  progressStep,
  progressPercent,
  errorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        onFileUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#1F2421]">
          Upload 2025 Collision Dataset
        </h1>
        <p className="mt-2 text-sm text-[#616662] max-w-lg mx-auto leading-relaxed">
          Upload your UK STATS19 collision CSV dataset. ROADSAFE will inspect columns, decode official STATS19 codes, handle class imbalance, train 3 ML algorithms, and select the optimal model using Macro F1.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white rounded-2xl border border-[#EBEAE5] shadow-xs p-8">
        {!isProcessing ? (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-[#557A66] bg-[#F4F7F5]'
                  : 'border-[#D9D7D0] hover:border-[#557A66]/60 hover:bg-[#FAF9F5]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF9F5] border border-[#EBEAE5] flex items-center justify-center text-[#557A66] mb-4">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <p className="text-base font-semibold text-[#1F2421]">
                  Click to select CSV or drag and drop
                </p>
                <p className="text-xs text-[#717672]">
                  Accepts standard UK STATS19 collision CSV files (up to 50MB)
                </p>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F2F1EC] text-xs font-medium text-[#1F2421]">
                <FileText className="w-3.5 h-3.5 text-[#557A66]" />
                <span>Select 2025 Collision CSV File</span>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#FAF0F0] border border-[#EED7D7] flex items-start gap-2.5 text-xs text-[#B34440]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Processing Error</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Alternative: Load 2025 UK STATS19 Sample Dataset */}
            <div className="mt-6 pt-6 border-t border-[#EBEAE5] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#717672]">
                <span className="font-medium text-[#1F2421]">No CSV on hand?</span> Test with official 2025 STATS19 structure & distribution (1,200 collisions).
              </div>
              <button
                type="button"
                onClick={onLoadSample}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#FAF9F5] hover:bg-[#F2F1EC] text-[#1F2421] text-xs font-semibold border border-[#E0DED7] transition-colors shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C98A3C]" />
                <span>Load Sample 2025 STATS19 Dataset</span>
              </button>
            </div>
          </div>
        ) : (
          /* Processing State */
          <div className="py-8 px-4 text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#F4F7F5] border border-[#DCE5DF] flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-[#557A66] border-t-transparent rounded-full animate-spin" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#1F2421]">
                Processing Dataset & Training ML Pipeline
              </h2>
              <p className="mt-1 text-xs text-[#717672] font-mono">
                {progressStep || 'Running automated ML pipeline...'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto">
              <div className="w-full bg-[#EBEAE5] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#557A66] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-[#8F9490] font-mono">
                <span>STAGE {Math.min(3, Math.ceil(progressPercent / 33))}/3</span>
                <span>{progressPercent}%</span>
              </div>
            </div>

            {/* Step checklist */}
            <div className="max-w-md mx-auto text-left space-y-2 pt-4 border-t border-[#EBEAE5] text-xs text-[#616662]">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    progressPercent >= 20 ? 'text-[#557A66]' : 'text-[#C9C8C0]'
                  }`}
                />
                <span>1. Parse & decode STATS19 columns and target</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    progressPercent >= 40 ? 'text-[#557A66]' : 'text-[#C9C8C0]'
                  }`}
                />
                <span>2. Clean missing/invalid values & balance class weights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    progressPercent >= 75 ? 'text-[#557A66]' : 'text-[#C9C8C0]'
                  }`}
                />
                <span>3. Train Logistic Regression, Decision Tree & Random Forest</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    progressPercent >= 100 ? 'text-[#557A66]' : 'text-[#C9C8C0]'
                  }`}
                />
                <span>4. Evaluate test partition & select Champion via Macro F1</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset schema guidance */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-[#EBEAE5]">
          <span className="font-semibold text-[#1F2421] block mb-1">Target Identified</span>
          <p className="text-[#717672] leading-relaxed">
            <span className="font-mono text-[#557A66]">accident_severity</span> (1=Fatal, 2=Serious, 3=Slight).
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#EBEAE5]">
          <span className="font-semibold text-[#1F2421] block mb-1">Non-Leaking Features</span>
          <p className="text-[#717672] leading-relaxed">
            Speed limit, road type, junction detail, weather, road surface, light, hour, and vehicles.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#EBEAE5]">
          <span className="font-semibold text-[#1F2421] block mb-1">Class Imbalance Handled</span>
          <p className="text-[#717672] leading-relaxed">
            Inverse class frequency weighting <span className="font-mono text-[#1F2421]">w = N / (K · N_c)</span> protects rare Fatal and Serious cases.
          </p>
        </div>
      </div>
    </div>
  );
};

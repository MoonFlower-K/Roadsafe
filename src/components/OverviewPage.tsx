import React, { useState } from 'react';
import {
  CleanedCollisionRecord,
  DatasetStatistics,
  ModelComparisonResult,
} from '../types';
import {
  Upload,
  Trophy,
  Check,
  TrendingUp,
  CloudRain,
  Sun,
  Layers,
  Clock,
} from 'lucide-react';

interface OverviewPageProps {
  stats: DatasetStatistics;
  cleanedRecords: CleanedCollisionRecord[];
  modelComparison: ModelComparisonResult;
  onResetDataset: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  stats,
  cleanedRecords,
  modelComparison,
  onResetDataset,
}) => {
  const [selectedChartTab, setSelectedChartTab] = useState<'hour' | 'road' | 'weather' | 'light'>('hour');

  const { championEvaluation, championModelName } = modelComparison;

  // 1. Hourly distribution (0 to 23)
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const subset = cleanedRecords.filter((r) => r.hour === h);
    const slight = subset.filter((r) => r.severity === 'Slight').length;
    const serious = subset.filter((r) => r.severity === 'Serious').length;
    const fatal = subset.filter((r) => r.severity === 'Fatal').length;
    return { hour: h, total: subset.length, slight, serious, fatal };
  });

  const maxHourTotal = Math.max(...hourlyData.map((d) => d.total), 1);

  // 2. Road type breakdown
  const roadTypeMap: Record<string, { total: number; slight: number; serious: number; fatal: number }> = {};
  cleanedRecords.forEach((r) => {
    if (!roadTypeMap[r.roadType]) {
      roadTypeMap[r.roadType] = { total: 0, slight: 0, serious: 0, fatal: 0 };
    }
    roadTypeMap[r.roadType].total++;
    if (r.severity === 'Slight') roadTypeMap[r.roadType].slight++;
    else if (r.severity === 'Serious') roadTypeMap[r.roadType].serious++;
    else roadTypeMap[r.roadType].fatal++;
  });

  const roadTypeData = Object.entries(roadTypeMap)
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => b.total - a.total);

  // 3. Weather breakdown
  const weatherMap: Record<string, { total: number; slight: number; serious: number; fatal: number }> = {};
  cleanedRecords.forEach((r) => {
    if (!weatherMap[r.weather]) {
      weatherMap[r.weather] = { total: 0, slight: 0, serious: 0, fatal: 0 };
    }
    weatherMap[r.weather].total++;
    if (r.severity === 'Slight') weatherMap[r.weather].slight++;
    else if (r.severity === 'Serious') weatherMap[r.weather].serious++;
    else weatherMap[r.weather].fatal++;
  });

  const weatherData = Object.entries(weatherMap)
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => b.total - a.total);

  // 4. Light conditions breakdown
  const lightMap: Record<string, { total: number; slight: number; serious: number; fatal: number }> = {};
  cleanedRecords.forEach((r) => {
    if (!lightMap[r.lightConditions]) {
      lightMap[r.lightConditions] = { total: 0, slight: 0, serious: 0, fatal: 0 };
    }
    lightMap[r.lightConditions].total++;
    if (r.severity === 'Slight') lightMap[r.lightConditions].slight++;
    else if (r.severity === 'Serious') lightMap[r.lightConditions].serious++;
    else lightMap[r.lightConditions].fatal++;
  });

  const lightData = Object.entries(lightMap)
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => b.total - a.total);

  // Top 10 features for champion model
  const topFeatures = championEvaluation.featureImportance.slice(0, 10);
  const maxImportance = Math.max(...topFeatures.map((f) => f.importance), 1);

  // Format percentage helper
  const formatPct = (val: number) => (val * 100).toFixed(1) + '%';

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2421]">
            Dataset Overview & Model Benchmarking
          </h1>
          <p className="mt-1 text-xs text-[#717672]">
            UK STATS19 collision preprocessing, feature importance, and Macro F1 performance analysis
          </p>
        </div>

        <button
          onClick={onResetDataset}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E0DED7] text-xs font-semibold text-[#1F2421] hover:bg-[#FAF9F5] transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5 text-[#557A66]" />
          <span>Upload Different Dataset</span>
        </button>
      </div>

      {/* KPI Cards: Total Collisions, Slight, Serious, Fatal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collisions */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAE5] shadow-xs">
          <div className="text-xs text-[#717672] font-medium">Total Collisions Processed</div>
          <div className="mt-2 text-2xl font-bold text-[#1F2421] font-mono tabular-nums">
            {stats.totalValid.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-[#8F9490]">
            {stats.duplicatesRemoved} duplicates removed · {stats.invalidDropped} invalid dropped
          </div>
        </div>

        {/* Slight */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#717672] font-medium">Slight Collisions</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#557A66]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#1F2421] font-mono tabular-nums">
            {stats.slightCount.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-[#557A66] font-mono tabular-nums">
            {stats.slightPct}% of dataset · Weight: {stats.classWeights.Slight}
          </div>
        </div>

        {/* Serious */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#717672] font-medium">Serious Collisions</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#C98A3C]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#1F2421] font-mono tabular-nums">
            {stats.seriousCount.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-[#C98A3C] font-mono tabular-nums">
            {stats.seriousPct}% of dataset · Weight: {stats.classWeights.Serious}
          </div>
        </div>

        {/* Fatal */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#717672] font-medium">Fatal Collisions</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#C25450]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#1F2421] font-mono tabular-nums">
            {stats.fatalCount.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-[#C25450] font-mono tabular-nums">
            {stats.fatalPct}% of dataset · Weight: {stats.classWeights.Fatal}
          </div>
        </div>
      </div>

      {/* Severity Distribution Ratio Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#EBEAE5] shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-[#1F2421]">Severity Class Distribution (Target Imbalance)</span>
          <span className="text-[#717672] text-[11px]">
            Ratio: {stats.slightPct}% Slight : {stats.seriousPct}% Serious : {stats.fatalPct}% Fatal
          </span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#EBEAE5]">
          <div
            style={{ width: `${stats.slightPct}%` }}
            className="bg-[#557A66] h-full"
            title={`Slight: ${stats.slightPct}%`}
          />
          <div
            style={{ width: `${stats.seriousPct}%` }}
            className="bg-[#C98A3C] h-full"
            title={`Serious: ${stats.seriousPct}%`}
          />
          <div
            style={{ width: `${stats.fatalPct}%` }}
            className="bg-[#C25450] h-full"
            title={`Fatal: ${stats.fatalPct}%`}
          />
        </div>
        <div className="flex items-center gap-6 mt-3 text-xs text-[#616662]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#557A66]" />
            <span>Slight ({stats.slightCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C98A3C]" />
            <span>Serious ({stats.seriousCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C25450]" />
            <span>Fatal ({stats.fatalCount})</span>
          </div>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="bg-white rounded-xl border border-[#EBEAE5] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#EBEAE5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1F2421]">
                Model Benchmarking & Selection
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F4F7F5] text-[#4A7C59] text-[11px] font-semibold border border-[#DCE5DF]">
                <Trophy className="w-3 h-3 text-[#4A7C59]" />
                Champion Selected by Macro F1
              </span>
            </div>
            <p className="mt-1 text-xs text-[#717672]">
              Held-out test partition (25% stratified). Macro F1 ensures high penalization for misclassifying rare Serious and Fatal events.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F5] border-b border-[#EBEAE5] text-[#717672]">
              <tr>
                <th className="py-3 px-5 font-semibold">Model Algorithm</th>
                <th className="py-3 px-4 font-semibold text-right">Accuracy</th>
                <th className="py-3 px-4 font-semibold text-right">Macro Precision</th>
                <th className="py-3 px-4 font-semibold text-right">Macro Recall</th>
                <th className="py-3 px-4 font-semibold text-right text-[#1F2421]">Macro F1 (Score)</th>
                <th className="py-3 px-4 font-semibold text-right">Training Time</th>
                <th className="py-3 px-5 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEAE5]">
              {modelComparison.evaluations.map((ev) => {
                const isChampion = ev.modelName === championModelName;
                return (
                  <tr
                    key={ev.modelName}
                    className={`transition-colors ${
                      isChampion ? 'bg-[#F9FAF8] font-medium' : 'hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        {isChampion && <Trophy className="w-3.5 h-3.5 text-[#C98A3C]" />}
                        <span className="text-[#1F2421] font-semibold">{ev.modelName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#616662]">
                      {formatPct(ev.accuracy)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#616662]">
                      {formatPct(ev.macroPrecision)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#616662]">
                      {formatPct(ev.macroRecall)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-sm font-bold text-[#1F2421]">
                      {formatPct(ev.macroF1)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#8F9490]">
                      {ev.trainingTimeMs} ms
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {isChampion ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EAF2ED] text-[#4A7C59] text-[11px] font-semibold border border-[#D1E2D7]">
                          <Check className="w-3 h-3 text-[#4A7C59]" />
                          Champion Model
                        </span>
                      ) : (
                        <span className="text-[#8F9490] text-[11px]">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2: Confusion Matrix & Top Predictive Features */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-[#EBEAE5] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold text-[#1F2421]">
                Confusion Matrix ({championModelName})
              </h2>
              <p className="text-xs text-[#717672]">
                Actual vs Predicted counts on held-out test records ({championEvaluation.confusionMatrix.totalSamples} collisions)
              </p>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="text-[11px] font-semibold text-center text-[#717672] mb-1">
                PREDICTED CLASS
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-xs text-center font-mono">
                <div />
                <div className="py-1 font-semibold text-[#557A66] bg-[#FAF9F5] rounded">Slight</div>
                <div className="py-1 font-semibold text-[#C98A3C] bg-[#FAF9F5] rounded">Serious</div>
                <div className="py-1 font-semibold text-[#C25450] bg-[#FAF9F5] rounded">Fatal</div>

                {/* Slight row */}
                <div className="py-3 font-semibold text-[#557A66] bg-[#FAF9F5] rounded flex items-center justify-center">
                  Actual Slight
                </div>
                {championEvaluation.confusionMatrix.matrix[0].map((count, colIdx) => {
                  const rowSum = championEvaluation.confusionMatrix.matrix[0].reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / rowSum) * 100);
                  const isDiag = colIdx === 0;
                  return (
                    <div
                      key={`r0c${colIdx}`}
                      className={`p-3 rounded border flex flex-col items-center justify-center transition-colors ${
                        isDiag
                          ? 'bg-[#EBF2ED] border-[#D1E2D7] text-[#1F2421]'
                          : 'bg-white border-[#EBEAE5] text-[#717672]'
                      }`}
                    >
                      <span className="text-base font-bold">{count}</span>
                      <span className="text-[10px] text-[#8F9490]">{pct}%</span>
                    </div>
                  );
                })}

                {/* Serious row */}
                <div className="py-3 font-semibold text-[#C98A3C] bg-[#FAF9F5] rounded flex items-center justify-center">
                  Actual Serious
                </div>
                {championEvaluation.confusionMatrix.matrix[1].map((count, colIdx) => {
                  const rowSum = championEvaluation.confusionMatrix.matrix[1].reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / rowSum) * 100);
                  const isDiag = colIdx === 1;
                  return (
                    <div
                      key={`r1c${colIdx}`}
                      className={`p-3 rounded border flex flex-col items-center justify-center transition-colors ${
                        isDiag
                          ? 'bg-[#FCF5EA] border-[#EFE0C5] text-[#1F2421]'
                          : 'bg-white border-[#EBEAE5] text-[#717672]'
                      }`}
                    >
                      <span className="text-base font-bold">{count}</span>
                      <span className="text-[10px] text-[#8F9490]">{pct}%</span>
                    </div>
                  );
                })}

                {/* Fatal row */}
                <div className="py-3 font-semibold text-[#C25450] bg-[#FAF9F5] rounded flex items-center justify-center">
                  Actual Fatal
                </div>
                {championEvaluation.confusionMatrix.matrix[2].map((count, colIdx) => {
                  const rowSum = championEvaluation.confusionMatrix.matrix[2].reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / rowSum) * 100);
                  const isDiag = colIdx === 2;
                  return (
                    <div
                      key={`r2c${colIdx}`}
                      className={`p-3 rounded border flex flex-col items-center justify-center transition-colors ${
                        isDiag
                          ? 'bg-[#FDF0F0] border-[#F4D3D3] text-[#1F2421]'
                          : 'bg-white border-[#EBEAE5] text-[#717672]'
                      }`}
                    >
                      <span className="text-base font-bold">{count}</span>
                      <span className="text-[10px] text-[#8F9490]">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Per-class breakdown metrics */}
          <div className="mt-5 pt-4 border-t border-[#EBEAE5] grid grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#FAF9F5] border border-[#EBEAE5]">
              <span className="font-semibold text-[#557A66] block">Slight Metrics</span>
              <div className="mt-1 text-[11px] space-y-0.5 text-[#616662] font-mono tabular-nums">
                <div>Prec: {formatPct(championEvaluation.classMetrics.Slight.precision)}</div>
                <div>Rec: {formatPct(championEvaluation.classMetrics.Slight.recall)}</div>
                <div>F1: {formatPct(championEvaluation.classMetrics.Slight.f1)}</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAF9F5] border border-[#EBEAE5]">
              <span className="font-semibold text-[#C98A3C] block">Serious Metrics</span>
              <div className="mt-1 text-[11px] space-y-0.5 text-[#616662] font-mono tabular-nums">
                <div>Prec: {formatPct(championEvaluation.classMetrics.Serious.precision)}</div>
                <div>Rec: {formatPct(championEvaluation.classMetrics.Serious.recall)}</div>
                <div>F1: {formatPct(championEvaluation.classMetrics.Serious.f1)}</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAF9F5] border border-[#EBEAE5]">
              <span className="font-semibold text-[#C25450] block">Fatal Metrics</span>
              <div className="mt-1 text-[11px] space-y-0.5 text-[#616662] font-mono tabular-nums">
                <div>Prec: {formatPct(championEvaluation.classMetrics.Fatal.precision)}</div>
                <div>Rec: {formatPct(championEvaluation.classMetrics.Fatal.recall)}</div>
                <div>F1: {formatPct(championEvaluation.classMetrics.Fatal.f1)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Predictive Features (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-[#EBEAE5] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-[#1F2421]">
              Top Predictive Features
            </h2>
            <TrendingUp className="w-4 h-4 text-[#557A66]" />
          </div>
          <p className="text-xs text-[#717672] mb-4">
            Relative importance / decision tree Gini reduction
          </p>

          <div className="space-y-3">
            {topFeatures.map((feat) => {
              const widthPct = Math.max(4, Math.round((feat.importance / maxImportance) * 100));
              return (
                <div key={feat.feature} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#1F2421] font-medium truncate max-w-[200px]" title={feat.feature}>
                      {feat.feature}
                    </span>
                    <span className="text-[#616662] font-mono tabular-nums text-[11px]">
                      {feat.importance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F2F1EC] rounded-full overflow-hidden">
                    <div
                      className="bg-[#557A66] h-full rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Environmental and Contextual Charts */}
      <div className="bg-white p-5 rounded-xl border border-[#EBEAE5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-semibold text-[#1F2421]">
              Accident Patterns & Environmental Conditions
            </h2>
            <p className="text-xs text-[#717672]">
              Explore collision volume and severity proportion across real road factors
            </p>
          </div>

          {/* Segmented Chart Selector */}
          <div className="inline-flex p-1 rounded-lg bg-[#F2F1EC] border border-[#E5E3DC] text-xs">
            <button
              onClick={() => setSelectedChartTab('hour')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                selectedChartTab === 'hour'
                  ? 'bg-white text-[#1F2421] shadow-2xs font-semibold'
                  : 'text-[#717672] hover:text-[#1F2421]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time of Day (24h)</span>
            </button>

            <button
              onClick={() => setSelectedChartTab('road')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                selectedChartTab === 'road'
                  ? 'bg-white text-[#1F2421] shadow-2xs font-semibold'
                  : 'text-[#717672] hover:text-[#1F2421]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Road Type</span>
            </button>

            <button
              onClick={() => setSelectedChartTab('weather')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                selectedChartTab === 'weather'
                  ? 'bg-white text-[#1F2421] shadow-2xs font-semibold'
                  : 'text-[#717672] hover:text-[#1F2421]'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Weather</span>
            </button>

            <button
              onClick={() => setSelectedChartTab('light')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                selectedChartTab === 'light'
                  ? 'bg-white text-[#1F2421] shadow-2xs font-semibold'
                  : 'text-[#717672] hover:text-[#1F2421]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light Conditions</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Hourly 24h Distribution */}
        {selectedChartTab === 'hour' && (
          <div>
            <div className="flex items-center justify-between text-xs text-[#717672] mb-3">
              <span>Collision frequency by hour of day (00:00 to 23:00)</span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#557A66]" /> Slight</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#C98A3C]" /> Serious</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#C25450]" /> Fatal</span>
              </div>
            </div>

            <div className="h-48 flex items-end gap-1.5 pt-4 pb-2 border-b border-[#EBEAE5]">
              {hourlyData.map((d) => {
                const heightPct = Math.round((d.total / maxHourTotal) * 100);
                return (
                  <div
                    key={d.hour}
                    className="flex-1 flex flex-col justify-end items-center group relative h-full"
                  >
                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute bottom-full mb-2 bg-[#1F2421] text-white text-[10px] p-2 rounded shadow-md z-10 whitespace-nowrap">
                      <div className="font-bold">{d.hour}:00 - {d.hour + 1}:00</div>
                      <div>Total: {d.total}</div>
                      <div>Slight: {d.slight} | Serious: {d.serious} | Fatal: {d.fatal}</div>
                    </div>

                    <div
                      className="w-full rounded-t overflow-hidden flex flex-col justify-end bg-[#EBEAE5]"
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                    >
                      <div style={{ height: `${(d.fatal / (d.total || 1)) * 100}%` }} className="bg-[#C25450]" />
                      <div style={{ height: `${(d.serious / (d.total || 1)) * 100}%` }} className="bg-[#C98A3C]" />
                      <div style={{ height: `${(d.slight / (d.total || 1)) * 100}%` }} className="bg-[#557A66]" />
                    </div>

                    <span className="mt-1 text-[9px] text-[#8F9490] font-mono">
                      {d.hour % 3 === 0 ? `${d.hour}h` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Road Type */}
        {selectedChartTab === 'road' && (
          <div className="space-y-4">
            {roadTypeData.map((item) => {
              const slightPct = Math.round((item.slight / item.total) * 100);
              const seriousPct = Math.round((item.serious / item.total) * 100);
              const fatalPct = Math.round((item.fatal / item.total) * 100);
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#1F2421]">{item.name}</span>
                    <span className="font-mono text-[#717672]">
                      {item.total} collisions ({slightPct}% Slight / {seriousPct}% Serious / {fatalPct}% Fatal)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#EBEAE5]">
                    <div style={{ width: `${slightPct}%` }} className="bg-[#557A66] h-full" />
                    <div style={{ width: `${seriousPct}%` }} className="bg-[#C98A3C] h-full" />
                    <div style={{ width: `${fatalPct}%` }} className="bg-[#C25450] h-full" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Weather Conditions */}
        {selectedChartTab === 'weather' && (
          <div className="space-y-4">
            {weatherData.slice(0, 6).map((item) => {
              const slightPct = Math.round((item.slight / item.total) * 100);
              const seriousPct = Math.round((item.serious / item.total) * 100);
              const fatalPct = Math.round((item.fatal / item.total) * 100);
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#1F2421]">{item.name}</span>
                    <span className="font-mono text-[#717672]">
                      {item.total} collisions ({slightPct}% Slight / {seriousPct}% Serious / {fatalPct}% Fatal)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#EBEAE5]">
                    <div style={{ width: `${slightPct}%` }} className="bg-[#557A66] h-full" />
                    <div style={{ width: `${seriousPct}%` }} className="bg-[#C98A3C] h-full" />
                    <div style={{ width: `${fatalPct}%` }} className="bg-[#C25450] h-full" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: Light Conditions */}
        {selectedChartTab === 'light' && (
          <div className="space-y-4">
            {lightData.map((item) => {
              const slightPct = Math.round((item.slight / item.total) * 100);
              const seriousPct = Math.round((item.serious / item.total) * 100);
              const fatalPct = Math.round((item.fatal / item.total) * 100);
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#1F2421]">{item.name}</span>
                    <span className="font-mono text-[#717672]">
                      {item.total} collisions ({slightPct}% Slight / {seriousPct}% Serious / {fatalPct}% Fatal)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#EBEAE5]">
                    <div style={{ width: `${slightPct}%` }} className="bg-[#557A66] h-full" />
                    <div style={{ width: `${seriousPct}%` }} className="bg-[#C98A3C] h-full" />
                    <div style={{ width: `${fatalPct}%` }} className="bg-[#C25450] h-full" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

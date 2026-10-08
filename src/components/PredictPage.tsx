import React, { useState, useMemo } from 'react';
import {
  MLClassifier,
} from '../ml/models';
import {
  encodeUserScenario,
} from '../ml/preprocessor';
import {
  ModelEvaluation,
  SeverityClass,
} from '../types';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface PredictPageProps {
  championModel: MLClassifier;
  championEvaluation: ModelEvaluation;
  categoricalMappings: Record<string, string[]>;
}

export const PredictPage: React.FC<PredictPageProps> = ({
  championModel,
  championEvaluation,
  categoricalMappings,
}) => {
  // Input scenario state
  const [speedLimit, setSpeedLimit] = useState<number>(30);
  const [roadType, setRoadType] = useState<string>('Single carriageway');
  const [urbanOrRural, setUrbanOrRural] = useState<string>('Urban');
  const [weather, setWeather] = useState<string>('Fine no high winds');
  const [roadSurface, setRoadSurface] = useState<string>('Dry');
  const [lightConditions, setLightConditions] = useState<string>('Daylight');
  const [junctionDetail, setJunctionDetail] = useState<string>('Not at junction (within 20m)');
  const [junctionControl, setJunctionControl] = useState<string>('Give way or uncontrolled');
  const [dayOfWeek, setDayOfWeek] = useState<string>('Friday');
  const [hour, setHour] = useState<number>(17);
  const [numberOfVehicles, setNumberOfVehicles] = useState<number>(2);

  // Available options derived from dataset
  const roadTypeOptions = categoricalMappings.roadType || ['Single carriageway', 'Dual carriageway', 'Roundabout', 'One way street'];
  const urbanRuralOptions = categoricalMappings.urbanOrRural || ['Urban', 'Rural'];
  const weatherOptions = categoricalMappings.weather || ['Fine no high winds', 'Raining no high winds', 'Fine + high winds', 'Raining + high winds', 'Fog or mist'];
  const roadSurfaceOptions = categoricalMappings.roadSurface || ['Dry', 'Wet or damp', 'Frost or ice', 'Snow'];
  const lightOptions = categoricalMappings.lightConditions || ['Daylight', 'Darkness - lights lit', 'Darkness - lights unlit', 'Darkness - no lighting'];
  const junctionDetailOptions = categoricalMappings.junctionDetail || ['Not at junction (within 20m)', 'T or staggered junction', 'Crossroads', 'Roundabout'];
  const junctionControlOptions = categoricalMappings.junctionControl || ['Give way or uncontrolled', 'Auto traffic signal', 'Stop sign'];
  const dayOfWeekOptions = categoricalMappings.dayOfWeek || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Run Real Prediction
  const predictionResult = useMemo(() => {
    const inputVec = encodeUserScenario(
      {
        speedLimit,
        hour,
        numberOfVehicles,
        roadType,
        junctionDetail,
        junctionControl,
        urbanOrRural,
        weather,
        roadSurface,
        lightConditions,
        dayOfWeek,
      },
      categoricalMappings
    );

    const [p0, p1, p2] = championModel.predictProba(inputVec);

    // Determine predicted class
    let predictedClass: SeverityClass = 'Slight';
    if (p1 > p0 && p1 >= p2) predictedClass = 'Serious';
    else if (p2 > p0 && p2 > p1) predictedClass = 'Fatal';

    const pSlight = Math.max(0, Math.min(100, Number((p0 * 100).toFixed(1))));
    const pSerious = Math.max(0, Math.min(100, Number((p1 * 100).toFixed(1))));
    const pFatal = Math.max(0, Math.min(100, Number((p2 * 100).toFixed(1))));

    // Determine key contributing risk factors
    const risks: { text: string; severity: 'high' | 'medium' | 'low' }[] = [];

    if (speedLimit >= 60) {
      risks.push({
        text: `High speed limit (${speedLimit} mph) significantly magnifies kinetic impact and kinetic severity.`,
        severity: 'high',
      });
    } else if (speedLimit >= 40) {
      risks.push({
        text: `Moderate-high speed limit (${speedLimit} mph) increases stopping distances.`,
        severity: 'medium',
      });
    }

    if (urbanOrRural.toLowerCase().includes('rural')) {
      risks.push({
        text: 'Rural roads correlate with higher impact speeds and delayed emergency response windows.',
        severity: 'high',
      });
    }

    if (lightConditions.toLowerCase().includes('no lighting') || lightConditions.toLowerCase().includes('unlit')) {
      risks.push({
        text: 'Darkness without functioning street lighting severely impairs driver hazard perception.',
        severity: 'high',
      });
    }

    if (roadSurface.toLowerCase().includes('ice') || roadSurface.toLowerCase().includes('wet')) {
      risks.push({
        text: `Adverse surface condition (${roadSurface}) reduces tire grip and extends braking distance.`,
        severity: 'medium',
      });
    }

    if (weather.toLowerCase().includes('rain') || weather.toLowerCase().includes('fog') || weather.toLowerCase().includes('snow')) {
      risks.push({
        text: `Inclement weather (${weather}) reduces visibility and lateral control.`,
        severity: 'medium',
      });
    }

    if (hour >= 23 || hour <= 4) {
      risks.push({
        text: `Late-night time (${hour}:00) exhibits elevated fatigue and lower traffic vigilance.`,
        severity: 'medium',
      });
    }

    if (risks.length === 0) {
      risks.push({
        text: 'Daylight urban environment with standard 30 mph limit presents low baseline severity risk.',
        severity: 'low',
      });
    }

    return {
      predictedClass,
      probabilities: {
        Slight: pSlight,
        Serious: pSerious,
        Fatal: pFatal,
      },
      risks,
    };
  }, [
    speedLimit,
    hour,
    numberOfVehicles,
    roadType,
    junctionDetail,
    junctionControl,
    urbanOrRural,
    weather,
    roadSurface,
    lightConditions,
    dayOfWeek,
    championModel,
    categoricalMappings,
  ]);

  // Scenario Presets
  const applyPreset = (preset: 'urban' | 'rural_night' | 'wet_dual' | 'junction') => {
    if (preset === 'urban') {
      setSpeedLimit(30);
      setRoadType(roadTypeOptions[0] || 'Single carriageway');
      setUrbanOrRural('Urban');
      setWeather('Fine no high winds');
      setRoadSurface('Dry');
      setLightConditions('Daylight');
      setJunctionDetail('T or staggered junction');
      setJunctionControl('Give way or uncontrolled');
      setHour(14);
      setNumberOfVehicles(2);
    } else if (preset === 'rural_night') {
      setSpeedLimit(60);
      setRoadType('Single carriageway');
      setUrbanOrRural('Rural');
      setWeather('Fine no high winds');
      setRoadSurface('Wet or damp');
      setLightConditions('Darkness - no lighting');
      setJunctionDetail('Not at junction (within 20m)');
      setHour(23);
      setNumberOfVehicles(1);
    } else if (preset === 'wet_dual') {
      setSpeedLimit(70);
      setRoadType('Dual carriageway');
      setUrbanOrRural('Rural');
      setWeather('Raining no high winds');
      setRoadSurface('Wet or damp');
      setLightConditions('Daylight');
      setJunctionDetail('Not at junction (within 20m)');
      setHour(18);
      setNumberOfVehicles(3);
    } else {
      setSpeedLimit(30);
      setRoadType('Roundabout');
      setUrbanOrRural('Urban');
      setWeather('Fine no high winds');
      setRoadSurface('Dry');
      setLightConditions('Daylight');
      setJunctionDetail('Roundabout');
      setJunctionControl('Give way or uncontrolled');
      setHour(9);
      setNumberOfVehicles(2);
    }
  };

  const getSeverityBadge = (severity: SeverityClass) => {
    switch (severity) {
      case 'Fatal':
        return {
          bg: 'bg-[#FDF0F0]',
          border: 'border-[#F4D3D3]',
          text: 'text-[#C25450]',
          indicator: 'bg-[#C25450]',
          desc: 'High mortality risk. Extreme kinetic forces or unlit conditions present.',
        };
      case 'Serious':
        return {
          bg: 'bg-[#FCF5EA]',
          border: 'border-[#EFE0C5]',
          text: 'text-[#C98A3C]',
          indicator: 'bg-[#C98A3C]',
          desc: 'Severe injury likelihood requiring hospitalization or prolonged recovery.',
        };
      case 'Slight':
      default:
        return {
          bg: 'bg-[#EBF2ED]',
          border: 'border-[#D1E2D7]',
          text: 'text-[#557A66]',
          indicator: 'bg-[#557A66]',
          desc: 'Minor or superficial injury risk; rapid resolution expected.',
        };
    }
  };

  const badgeStyle = getSeverityBadge(predictionResult.predictedClass);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2421]">
            Predict Collision Severity
          </h1>
          <p className="mt-1 text-xs text-[#717672]">
            Inference using champion model:{' '}
            <span className="font-semibold text-[#1F2421]">{championEvaluation.modelName}</span> (Macro F1:{' '}
            <span className="font-mono text-[#557A66]">
              {(championEvaluation.macroF1 * 100).toFixed(1)}%
            </span>
            )
          </p>
        </div>

        {/* Quick Scenario Presets */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <span className="text-[#8F9490] text-[11px] mr-1 hidden lg:inline">Presets:</span>
          <button
            onClick={() => applyPreset('urban')}
            className="px-2.5 py-1 rounded bg-white border border-[#E0DED7] text-[#1F2421] hover:bg-[#FAF9F5] text-[11px] transition-colors"
          >
            Urban Low-Speed
          </button>
          <button
            onClick={() => applyPreset('rural_night')}
            className="px-2.5 py-1 rounded bg-white border border-[#E0DED7] text-[#1F2421] hover:bg-[#FAF9F5] text-[11px] transition-colors"
          >
            Rural Unlit 60mph
          </button>
          <button
            onClick={() => applyPreset('wet_dual')}
            className="px-2.5 py-1 rounded bg-white border border-[#E0DED7] text-[#1F2421] hover:bg-[#FAF9F5] text-[11px] transition-colors"
          >
            Dual Carriageway Wet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Parameters Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#EBEAE5] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#EBEAE5] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#557A66]" />
              <h2 className="text-sm font-semibold text-[#1F2421]">
                Collision & Roadway Condition Parameters
              </h2>
            </div>
            <button
              onClick={() => applyPreset('urban')}
              className="text-[11px] text-[#717672] hover:text-[#1F2421] inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Speed Limit */}
            <div className="space-y-1.5 sm:col-span-2 bg-[#FAF9F5] p-3.5 rounded-xl border border-[#EBEAE5]">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-[#1F2421]">
                  Speed Limit: <span className="font-mono text-[#557A66]">{speedLimit} mph</span>
                </label>
                <div className="flex gap-1">
                  {[20, 30, 40, 50, 60, 70].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeedLimit(s)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        speedLimit === s
                          ? 'bg-[#1F2421] text-white font-bold'
                          : 'bg-white border border-[#E0DED7] text-[#616662] hover:text-[#1F2421]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="20"
                max="70"
                step="10"
                value={speedLimit}
                onChange={(e) => setSpeedLimit(Number(e.target.value))}
                className="w-full accent-[#557A66] cursor-pointer"
              />
            </div>

            {/* Road Type */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">Road Type</label>
              <select
                value={roadType}
                onChange={(e) => setRoadType(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D9D7D0] text-[#1F2421] text-xs focus:outline-hidden focus:border-[#557A66]"
              >
                {roadTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Urban or Rural */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">Urban / Rural Classification</label>
              <select
                value={urbanOrRural}
                onChange={(e) => setUrbanOrRural(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D9D7D0] text-[#1F2421] text-xs focus:outline-hidden focus:border-[#557A66]"
              >
                {urbanRuralOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Weather Conditions */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">Weather Conditions</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D9D7D0] text-[#1F2421] text-xs focus:outline-hidden focus:border-[#557A66]"
              >
                {weatherOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Road Surface Conditions */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">Road Surface Conditions</label>
              <select
                value={roadSurface}
                onChange={(e) => setRoadSurface(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D9D7D0] text-[#1F2421] text-xs focus:outline-hidden focus:border-[#557A66]"
              >
                {roadSurfaceOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Light Conditions */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">Light Conditions</label>
              <select
                value={lightConditions}
                onChange={(e) => setLightConditions(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D9D7D0] text-[#1F2421] text-xs focus:outline-hidden focus:border-[#557A66]"
              >
                {lightOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Junction Detail */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">Junction Detail</label>
              <select
                value={junctionDetail}
                onChange={(e) => setJunctionDetail(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D9D7D0] text-[#1F2421] text-xs focus:outline-hidden focus:border-[#557A66]"
              >
                {junctionDetailOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Junction Control */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">Junction Control</label>
              <select
                value={junctionControl}
                onChange={(e) => setJunctionControl(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D9D7D0] text-[#1F2421] text-xs focus:outline-hidden focus:border-[#557A66]"
              >
                {junctionControlOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Day of Week */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D9D7D0] text-[#1F2421] text-xs focus:outline-hidden focus:border-[#557A66]"
              >
                {dayOfWeekOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Time / Hour of Day */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">
                Time of Day (Hour: <span className="font-mono text-[#557A66]">{String(hour).padStart(2, '0')}:00</span>)
              </label>
              <input
                type="range"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="w-full accent-[#557A66] cursor-pointer"
              />
            </div>

            {/* Number of Vehicles */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1F2421] block">
                Vehicles Involved: <span className="font-mono text-[#557A66]">{numberOfVehicles}</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setNumberOfVehicles(v)}
                    className={`flex-1 py-1.5 rounded text-xs font-mono transition-colors ${
                      numberOfVehicles === v
                        ? 'bg-[#1F2421] text-white font-bold'
                        : 'bg-white border border-[#E0DED7] text-[#616662] hover:text-[#1F2421]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Prediction Outcome (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#EBEAE5] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#EBEAE5] pb-3">
              <span className="text-xs font-semibold text-[#717672]">
                PREDICTION OUTCOME
              </span>
              <span className="text-[11px] text-[#8F9490] font-mono">
                Real-Time Inference
              </span>
            </div>

            {/* Severity Result Callout */}
            <div className={`p-5 rounded-xl border ${badgeStyle.bg} ${badgeStyle.border} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#717672]">
                  Predicted Collision Severity
                </span>
                <span className={`w-3 h-3 rounded-full ${badgeStyle.indicator}`} />
              </div>

              <div className={`text-3xl font-bold tracking-tight ${badgeStyle.text}`}>
                {predictionResult.predictedClass}
              </div>

              <p className="text-xs text-[#616662] leading-relaxed pt-1">
                {badgeStyle.desc}
              </p>
            </div>

            {/* Actual Model Probabilities */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#1F2421] block">
                Actual Model Probabilities
              </span>

              {/* Slight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#616662] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#557A66]" />
                    <span>Slight Severity</span>
                  </span>
                  <span className="font-mono font-bold text-[#1F2421] tabular-nums">
                    {predictionResult.probabilities.Slight}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F1EC] rounded-full overflow-hidden">
                  <div
                    className="bg-[#557A66] h-full rounded-full transition-all duration-300"
                    style={{ width: `${predictionResult.probabilities.Slight}%` }}
                  />
                </div>
              </div>

              {/* Serious */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#616662] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C98A3C]" />
                    <span>Serious Severity</span>
                  </span>
                  <span className="font-mono font-bold text-[#1F2421] tabular-nums">
                    {predictionResult.probabilities.Serious}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F1EC] rounded-full overflow-hidden">
                  <div
                    className="bg-[#C98A3C] h-full rounded-full transition-all duration-300"
                    style={{ width: `${predictionResult.probabilities.Serious}%` }}
                  />
                </div>
              </div>

              {/* Fatal */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#616662] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C25450]" />
                    <span>Fatal Severity</span>
                  </span>
                  <span className="font-mono font-bold text-[#1F2421] tabular-nums">
                    {predictionResult.probabilities.Fatal}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F2F1EC] rounded-full overflow-hidden">
                  <div
                    className="bg-[#C25450] h-full rounded-full transition-all duration-300"
                    style={{ width: `${predictionResult.probabilities.Fatal}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Contributing Risk Explanations */}
            <div className="pt-4 border-t border-[#EBEAE5] space-y-2">
              <span className="text-xs font-semibold text-[#1F2421] block">
                Contributing Risk Factors
              </span>
              <div className="space-y-2 text-xs">
                {predictionResult.risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#FAF9F5] border border-[#EBEAE5] flex items-start gap-2"
                  >
                    {risk.severity === 'high' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#C25450] shrink-0 mt-0.5" />
                    ) : risk.severity === 'medium' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#C98A3C] shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-[#557A66] shrink-0 mt-0.5" />
                    )}
                    <span className="text-[#616662] leading-relaxed">{risk.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

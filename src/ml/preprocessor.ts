/**
 * Robust Preprocessing Pipeline for UK STATS19 Collision Data
 * Handles parsing, inspection, cleaning, code decoding, feature engineering,
 * class imbalance weight calculation, and stratified train/test split.
 */

import Papa from 'papaparse';
import {
  CleanedCollisionRecord,
  DatasetStatistics,
  PreprocessedData,
  RawCollisionRow,
  SeverityClass,
} from '../types';
import {
  decodeCategoricalField,
  decodeSeverity,
  findColumnKey,
  STATS19_DAY_OF_WEEK,
  STATS19_JUNCTION_CONTROL,
  STATS19_JUNCTION_DETAIL,
  STATS19_LIGHT_CONDITIONS,
  STATS19_ROAD_SURFACE,
  STATS19_ROAD_TYPE,
  STATS19_URBAN_RURAL,
  STATS19_WEATHER,
} from './stats19Dictionary';

export function parseCSVFile(fileOrString: File | string): Promise<{ data: RawCollisionRow[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawCollisionRow>(fileOrString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        const rawColumns = results.meta.fields || [];
        resolve({
          data: results.data,
          columns: rawColumns,
        });
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}

export function cleanAndPreprocess(
  rawData: RawCollisionRow[],
  rawColumns: string[]
): PreprocessedData {
  const totalRowsRaw = rawData.length;

  // 1. Identify Target Column
  const severityKey = findColumnKey(rawColumns, [
    'accident_severity',
    'collision_severity',
    'severity',
    'Accident_Severity',
    'Collision_Severity',
    'casualty_severity',
  ]);

  if (!severityKey) {
    throw new Error(
      'Target column for Collision Severity not found. Expected "accident_severity" or "collision_severity".'
    );
  }

  // 2. Identify Non-leaking Feature Columns
  const speedLimitKey = findColumnKey(rawColumns, [
    'speed_limit',
    'Speed_limit',
    'Speed_Limit',
    'speedlimit',
    'speed_limit_mph',
  ]);

  const roadTypeKey = findColumnKey(rawColumns, [
    'road_type',
    'Road_Type',
    'roadtype',
  ]);

  const junctionDetailKey = findColumnKey(rawColumns, [
    'junction_detail',
    'Junction_Detail',
    'junctiondetail',
  ]);

  const junctionControlKey = findColumnKey(rawColumns, [
    'junction_control',
    'Junction_Control',
    'junctioncontrol',
  ]);

  const urbanRuralKey = findColumnKey(rawColumns, [
    'urban_or_rural_area',
    'Urban_or_Rural_Area',
    'urban_rural',
    'urban_or_rural',
  ]);

  const weatherKey = findColumnKey(rawColumns, [
    'weather_conditions',
    'Weather_Conditions',
    'weather',
    'Weather',
  ]);

  const roadSurfaceKey = findColumnKey(rawColumns, [
    'road_surface_conditions',
    'Road_Surface_Conditions',
    'road_surface',
    'roadsurface',
  ]);

  const lightKey = findColumnKey(rawColumns, [
    'light_conditions',
    'Light_Conditions',
    'light',
    'lightconditions',
  ]);

  const dayOfWeekKey = findColumnKey(rawColumns, [
    'day_of_week',
    'Day_of_Week',
    'day',
    'dayofweek',
  ]);

  const timeKey = findColumnKey(rawColumns, [
    'time',
    'Time',
    'hour',
    'collision_time',
  ]);

  const vehiclesKey = findColumnKey(rawColumns, [
    'number_of_vehicles',
    'Number_of_Vehicles',
    'vehicles',
    'numberofvehicles',
  ]);

  const idKey = findColumnKey(rawColumns, [
    'collision_reference',
    'accident_reference',
    'collision_index',
    'accident_index',
    'id',
  ]);

  // 3. Deduplication and Cleaning
  const seenHashes = new Set<string>();
  let duplicatesRemoved = 0;
  let invalidDropped = 0;

  const validRecords: CleanedCollisionRecord[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];

    // Decode Severity
    const rawSev = row[severityKey];
    const severity = decodeSeverity(rawSev);
    if (!severity) {
      invalidDropped++;
      continue;
    }

    // Deduplication check
    const rowSpeed = speedLimitKey ? row[speedLimitKey] : '';
    const rowRoad = roadTypeKey ? row[roadTypeKey] : '';
    const rowWeather = weatherKey ? row[weatherKey] : '';
    const rowTime = timeKey ? row[timeKey] : '';
    const hash = idKey && row[idKey]
      ? String(row[idKey])
      : `${rowSpeed}-${rowRoad}-${rowWeather}-${rowTime}-${i}`;
    
    if (seenHashes.has(hash)) {
      duplicatesRemoved++;
      continue;
    }
    seenHashes.add(hash);

    // Speed limit
    let speedLimit = 30;
    if (speedLimitKey && row[speedLimitKey] !== undefined) {
      const parsedSpeed = Number(row[speedLimitKey]);
      if (!isNaN(parsedSpeed) && parsedSpeed > 0 && parsedSpeed <= 100) {
        speedLimit = parsedSpeed;
      }
    }

    // Road type
    const roadType = roadTypeKey
      ? decodeCategoricalField(row[roadTypeKey], STATS19_ROAD_TYPE, 'Single carriageway')
      : 'Single carriageway';

    // Junction Detail
    const junctionDetail = junctionDetailKey
      ? decodeCategoricalField(row[junctionDetailKey], STATS19_JUNCTION_DETAIL, 'Not at junction (within 20m)')
      : 'Not at junction (within 20m)';

    // Junction Control
    const junctionControl = junctionControlKey
      ? decodeCategoricalField(row[junctionControlKey], STATS19_JUNCTION_CONTROL, 'Give way or uncontrolled')
      : 'Give way or uncontrolled';

    // Urban or Rural
    const urbanOrRural = urbanRuralKey
      ? decodeCategoricalField(row[urbanRuralKey], STATS19_URBAN_RURAL, 'Urban')
      : 'Urban';

    // Weather
    const weather = weatherKey
      ? decodeCategoricalField(row[weatherKey], STATS19_WEATHER, 'Fine no high winds')
      : 'Fine no high winds';

    // Road surface
    const roadSurface = roadSurfaceKey
      ? decodeCategoricalField(row[roadSurfaceKey], STATS19_ROAD_SURFACE, 'Dry')
      : 'Dry';

    // Light conditions
    const lightConditions = lightKey
      ? decodeCategoricalField(row[lightKey], STATS19_LIGHT_CONDITIONS, 'Daylight')
      : 'Daylight';

    // Day of week
    let dayOfWeek = 'Monday';
    if (dayOfWeekKey && row[dayOfWeekKey] !== undefined) {
      dayOfWeek = decodeCategoricalField(row[dayOfWeekKey], STATS19_DAY_OF_WEEK, 'Monday');
    }

    // Time / Hour
    let hour = 14;
    if (timeKey && row[timeKey] !== undefined) {
      const rawTime = String(row[timeKey]).trim();
      if (rawTime.includes(':')) {
        const parts = rawTime.split(':');
        const h = parseInt(parts[0], 10);
        if (!isNaN(h) && h >= 0 && h < 24) hour = h;
      } else {
        const h = parseInt(rawTime, 10);
        if (!isNaN(h) && h >= 0 && h < 24) hour = h;
      }
    }

    // Number of vehicles
    let numberOfVehicles = 2;
    if (vehiclesKey && row[vehiclesKey] !== undefined) {
      const v = Number(row[vehiclesKey]);
      if (!isNaN(v) && v > 0) numberOfVehicles = Math.min(v, 10);
    }

    validRecords.push({
      id: String((idKey && row[idKey]) || `rec_${i}`),
      severity,
      speedLimit,
      roadType,
      junctionDetail,
      junctionControl,
      urbanOrRural,
      weather,
      roadSurface,
      lightConditions,
      dayOfWeek,
      hour,
      numberOfVehicles,
    });
  }

  if (validRecords.length < 20) {
    throw new Error(
      `Dataset has only ${validRecords.length} valid records. At least 20 valid records are required for training and evaluation.`
    );
  }

  // 4. Compute Counts & Imbalance Weights
  const slightCount = validRecords.filter((r) => r.severity === 'Slight').length;
  const seriousCount = validRecords.filter((r) => r.severity === 'Serious').length;
  const fatalCount = validRecords.filter((r) => r.severity === 'Fatal').length;

  const totalValid = validRecords.length;
  const slightPct = Number(((slightCount / totalValid) * 100).toFixed(1));
  const seriousPct = Number(((seriousCount / totalValid) * 100).toFixed(1));
  const fatalPct = Number(((fatalCount / totalValid) * 100).toFixed(1));

  // Balanced class weights: w_c = N / (K * N_c)
  const K = 3;
  const classWeights: Record<SeverityClass, number> = {
    Slight: slightCount > 0 ? Number((totalValid / (K * slightCount)).toFixed(3)) : 1,
    Serious: seriousCount > 0 ? Number((totalValid / (K * seriousCount)).toFixed(3)) : 1,
    Fatal: fatalCount > 0 ? Number((totalValid / (K * fatalCount)).toFixed(3)) : 1,
  };

  // 5. Categorical Mappings for One-Hot Encoding
  const getUniqueValues = (key: keyof CleanedCollisionRecord) =>
    Array.from(new Set(validRecords.map((r) => String(r[key])))).sort();

  const categoricalMappings: Record<string, string[]> = {
    roadType: getUniqueValues('roadType'),
    junctionDetail: getUniqueValues('junctionDetail'),
    junctionControl: getUniqueValues('junctionControl'),
    urbanOrRural: getUniqueValues('urbanOrRural'),
    weather: getUniqueValues('weather'),
    roadSurface: getUniqueValues('roadSurface'),
    lightConditions: getUniqueValues('lightConditions'),
    dayOfWeek: getUniqueValues('dayOfWeek'),
  };

  // Build full feature names list
  const featureNames: string[] = [
    'Speed Limit (mph)',
    'Hour of Day',
    'Number of Vehicles',
  ];

  for (const [catName, vals] of Object.entries(categoricalMappings)) {
    for (const val of vals) {
      featureNames.push(`${catName}: ${val}`);
    }
  }

  // 6. Vectorize rows
  const X: number[][] = [];
  const y: number[] = [];

  for (const rec of validRecords) {
    const vec: number[] = [
      rec.speedLimit,
      rec.hour,
      rec.numberOfVehicles,
    ];

    for (const [catName, vals] of Object.entries(categoricalMappings)) {
      const recVal = String(rec[catName as keyof CleanedCollisionRecord]);
      for (const val of vals) {
        vec.push(recVal === val ? 1 : 0);
      }
    }

    X.push(vec);

    // Target label: 0=Slight, 1=Serious, 2=Fatal
    if (rec.severity === 'Slight') y.push(0);
    else if (rec.severity === 'Serious') y.push(1);
    else y.push(2);
  }

  // Calculate Numerical Means and Stds for Standard Scaler (first 3 features)
  const numericalMeans: Record<number, number> = {};
  const numericalStds: Record<number, number> = {};

  for (let col = 0; col < 3; col++) {
    const sum = X.reduce((acc, row) => acc + row[col], 0);
    const mean = sum / X.length;
    const variance = X.reduce((acc, row) => acc + Math.pow(row[col] - mean, 2), 0) / X.length;
    const std = Math.sqrt(variance) || 1;
    numericalMeans[col] = mean;
    numericalStds[col] = std;
  }

  // 7. Stratified Train / Test Split (75% Train, 25% Test)
  const classIndices: { [c: number]: number[] } = { 0: [], 1: [], 2: [] };
  y.forEach((label, idx) => {
    classIndices[label].push(idx);
  });

  const trainIndices: number[] = [];
  const testIndices: number[] = [];

  // Deterministic pseudo-random shuffle for consistency
  const seededShuffle = (arr: number[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (i * 37 + 13) % copy.length;
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  for (let c = 0; c < 3; c++) {
    const shuffled = seededShuffle(classIndices[c]);
    const splitPoint = Math.max(1, Math.floor(shuffled.length * 0.75));
    trainIndices.push(...shuffled.slice(0, splitPoint));
    testIndices.push(...shuffled.slice(splitPoint));
  }

  const X_train = trainIndices.map((i) => X[i]);
  const y_train = trainIndices.map((i) => y[i]);
  const X_test = testIndices.map((i) => X[i]);
  const y_test = testIndices.map((i) => y[i]);

  const stats: DatasetStatistics = {
    totalRowsRaw,
    totalValid,
    duplicatesRemoved,
    invalidDropped,
    slightCount,
    seriousCount,
    fatalCount,
    slightPct,
    seriousPct,
    fatalPct,
    classWeights,
    featureNames,
    rawColumns,
  };

  return {
    X_train,
    y_train,
    X_test,
    y_test,
    featureNames,
    numericalMeans,
    numericalStds,
    categoricalMappings,
    cleanedRecords: validRecords,
    stats,
  };
}

/**
 * Encodes a user input scenario into the feature vector expected by the model
 */
export function encodeUserScenario(
  input: {
    speedLimit: number;
    hour: number;
    numberOfVehicles: number;
    roadType: string;
    junctionDetail: string;
    junctionControl: string;
    urbanOrRural: string;
    weather: string;
    roadSurface: string;
    lightConditions: string;
    dayOfWeek: string;
  },
  categoricalMappings: Record<string, string[]>
): number[] {
  const vec: number[] = [
    input.speedLimit,
    input.hour,
    input.numberOfVehicles,
  ];

  for (const [catName, vals] of Object.entries(categoricalMappings)) {
    const userVal = String((input as Record<string, unknown>)[catName] || '');
    for (const val of vals) {
      vec.push(userVal.toLowerCase() === val.toLowerCase() ? 1 : 0);
    }
  }

  return vec;
}

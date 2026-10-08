/**
 * Official UK STATS19 standard reference dictionary and code mappings.
 * Supports DfT code lookups (both numeric codes and legacy/modern string values).
 */

export const STATS19_SEVERITY: Record<number, string> = {
  1: 'Fatal',
  2: 'Serious',
  3: 'Slight',
};

export const STATS19_ROAD_TYPE: Record<number, string> = {
  1: 'Roundabout',
  2: 'One way street',
  3: 'Dual carriageway',
  6: 'Single carriageway',
  7: 'Slip road',
  9: 'Unknown',
};

export const STATS19_JUNCTION_DETAIL: Record<number, string> = {
  0: 'Not at junction (within 20m)',
  1: 'Roundabout',
  2: 'Mini-roundabout',
  3: 'T or staggered junction',
  5: 'Slip road',
  6: 'Crossroads',
  7: 'Multiple junction',
  8: 'Private drive or entrance',
  9: 'Other junction',
};

export const STATS19_JUNCTION_CONTROL: Record<number, string> = {
  0: 'Not at junction',
  1: 'Authorised person',
  2: 'Auto traffic signal',
  3: 'Stop sign',
  4: 'Give way or uncontrolled',
  [-1]: 'Unknown',
};

export const STATS19_URBAN_RURAL: Record<number, string> = {
  1: 'Urban',
  2: 'Rural',
  3: 'Unallocated',
};

export const STATS19_WEATHER: Record<number, string> = {
  1: 'Fine no high winds',
  2: 'Raining no high winds',
  3: 'Snowing no high winds',
  4: 'Fine + high winds',
  5: 'Raining + high winds',
  6: 'Snowing + high winds',
  7: 'Fog or mist',
  8: 'Other',
  9: 'Unknown',
};

export const STATS19_ROAD_SURFACE: Record<number, string> = {
  1: 'Dry',
  2: 'Wet or damp',
  3: 'Snow',
  4: 'Frost or ice',
  5: 'Flood over 3cm deep',
  6: 'Oil or diesel',
  7: 'Mud',
  9: 'Unknown',
};

export const STATS19_LIGHT_CONDITIONS: Record<number, string> = {
  1: 'Daylight',
  4: 'Darkness - lights lit',
  5: 'Darkness - lights unlit',
  6: 'Darkness - no lighting',
  7: 'Darkness - lighting unknown',
};

export const STATS19_DAY_OF_WEEK: Record<number, string> = {
  1: 'Sunday',
  2: 'Monday',
  3: 'Tuesday',
  4: 'Wednesday',
  5: 'Thursday',
  6: 'Friday',
  7: 'Saturday',
};

/**
 * Fuzzy column matcher to identify STATS19 fields across various CSV exports
 */
export function findColumnKey(columns: string[], patterns: (RegExp | string)[]): string | undefined {
  for (const pattern of patterns) {
    const match = columns.find(col => {
      const cleanCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (typeof pattern === 'string') {
        return cleanCol === pattern.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
      return pattern.test(col);
    });
    if (match) return match;
  }
  return undefined;
}

export function decodeSeverity(val: unknown): 'Slight' | 'Serious' | 'Fatal' | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim().toLowerCase();
  
  if (str === '1' || str === 'fatal') return 'Fatal';
  if (str === '2' || str === 'serious') return 'Serious';
  if (str === '3' || str === 'slight') return 'Slight';

  // In some datasets, 1=Fatal, 2=Serious, 3=Slight
  if (str.includes('fatal')) return 'Fatal';
  if (str.includes('serious')) return 'Serious';
  if (str.includes('slight')) return 'Slight';

  return null;
}

export function decodeCategoricalField(val: unknown, dict: Record<number, string>, fallback: string): string {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  if (!isNaN(num) && dict[num]) {
    return dict[num];
  }
  const str = String(val).trim();
  if (str === '-1' || str.toLowerCase() === 'unknown' || str.toLowerCase() === 'missing') {
    return fallback;
  }
  // If already decoded string, check if it matches a known value
  const matched = Object.values(dict).find(d => d.toLowerCase() === str.toLowerCase());
  return matched || str || fallback;
}

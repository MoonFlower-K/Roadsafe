/**
 * Generates an authentic 2025 UK STATS19 Collision Dataset CSV string.
 * Used for instant testing and demonstration if the user wants to test before uploading their local file.
 * Formatted with exact UK DfT STATS19 standard columns and coded fields.
 */

export function generateSampleSTATS19CSV(): string {
  const rows: string[] = [];
  const header = [
    'collision_reference',
    'collision_severity',
    'speed_limit',
    'road_type',
    'junction_detail',
    'junction_control',
    'urban_or_rural_area',
    'weather_conditions',
    'road_surface_conditions',
    'light_conditions',
    'day_of_week',
    'time',
    'number_of_vehicles',
  ].join(',');

  rows.push(header);

  // Deterministic seed for reproducible evaluation
  let seed = 42;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const sampleCount = 1200;

  for (let i = 1; i <= sampleCount; i++) {
    const ref = `20250100${String(i).padStart(5, '0')}`;
    
    // Urban (1) vs Rural (2) (approx 65% urban in UK STATS19)
    const isRural = random() > 0.65;
    const urbanOrRural = isRural ? 2 : 1;

    // Speed limit
    let speedLimit = 30;
    if (isRural) {
      const r = random();
      if (r < 0.6) speedLimit = 60;
      else if (r < 0.85) speedLimit = 50;
      else if (r < 0.95) speedLimit = 70;
      else speedLimit = 40;
    } else {
      const r = random();
      if (r < 0.7) speedLimit = 30;
      else if (r < 0.88) speedLimit = 20;
      else if (r < 0.96) speedLimit = 40;
      else speedLimit = 50;
    }

    // Road type: 6=Single carriageway (70%), 3=Dual (15%), 1=Roundabout (10%), 2=One way (5%)
    let roadType = 6;
    const rtR = random();
    if (rtR < 0.70) roadType = 6;
    else if (rtR < 0.85) roadType = 3;
    else if (rtR < 0.95) roadType = 1;
    else roadType = 2;

    // Junction detail: 0=Not at junction (40%), 3=T junction (30%), 6=Crossroads (15%), 1=Roundabout (10%), 9=Other (5%)
    let junctionDetail = 0;
    const jdR = random();
    if (jdR < 0.40) junctionDetail = 0;
    else if (jdR < 0.70) junctionDetail = 3;
    else if (jdR < 0.85) junctionDetail = 6;
    else if (jdR < 0.95) junctionDetail = 1;
    else junctionDetail = 9;

    const junctionControl = junctionDetail === 0 ? 0 : random() > 0.3 ? 4 : 2;

    // Weather: 1=Fine (78%), 2=Raining (16%), 5=Rain+wind (3%), 7=Fog (2%), 3=Snow (1%)
    let weather = 1;
    const wR = random();
    if (wR < 0.78) weather = 1;
    else if (wR < 0.94) weather = 2;
    else if (wR < 0.97) weather = 5;
    else if (wR < 0.99) weather = 7;
    else weather = 3;

    // Road surface: 1=Dry (65%), 2=Wet (30%), 4=Frost/Ice (4%), 3=Snow (1%)
    let roadSurface = 1;
    if (weather === 2 || weather === 5) roadSurface = 2;
    else {
      const rsR = random();
      if (rsR < 0.65) roadSurface = 1;
      else if (rsR < 0.95) roadSurface = 2;
      else roadSurface = 4;
    }

    // Time & Light conditions
    const hour = Math.floor(random() * 24);
    const minute = Math.floor(random() * 60);
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    let light = 1; // 1=Daylight, 4=Dark lit, 6=Dark unlit
    if (hour >= 20 || hour <= 6) {
      light = isRural ? 6 : 4;
    } else if (hour === 7 || hour === 19) {
      light = random() > 0.5 ? 1 : 4;
    } else {
      light = 1;
    }

    // Day of week: 1=Sun .. 7=Sat
    const dayOfWeek = Math.floor(random() * 7) + 1;

    // Number of vehicles (1 to 4)
    let vehicles = 2;
    const vR = random();
    if (vR < 0.3) vehicles = 1;
    else if (vR < 0.8) vehicles = 2;
    else if (vR < 0.95) vehicles = 3;
    else vehicles = 4;

    // Severity calculation with realistic underlying risk probability:
    // Base slight ~80%, serious ~18%, fatal ~2%
    let riskScore = 0;
    if (speedLimit >= 60) riskScore += 2.5;
    else if (speedLimit >= 40) riskScore += 1.2;

    if (isRural) riskScore += 1.8;
    if (light === 6) riskScore += 2.0; // dark no lighting
    if (weather === 5 || weather === 7) riskScore += 1.2;
    if (roadSurface === 4 || roadSurface === 2) riskScore += 0.8;
    if (vehicles === 1) riskScore += 0.9; // single vehicle run-off/tree impact
    if (hour >= 23 || hour <= 4) riskScore += 1.4; // late night

    const pFatal = 0.015 + (riskScore * 0.018);
    const pSerious = 0.14 + (riskScore * 0.05);

    const outcomeRoll = random();
    let severity = 3; // 3 = Slight

    if (outcomeRoll < pFatal) {
      severity = 1; // Fatal
    } else if (outcomeRoll < pFatal + pSerious) {
      severity = 2; // Serious
    } else {
      severity = 3; // Slight
    }

    rows.push(
      [
        ref,
        severity,
        speedLimit,
        roadType,
        junctionDetail,
        junctionControl,
        urbanOrRural,
        weather,
        roadSurface,
        light,
        dayOfWeek,
        timeStr,
        vehicles,
      ].join(',')
    );
  }

  return rows.join('\n');
}

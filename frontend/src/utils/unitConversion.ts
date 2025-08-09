/**
 * Unit Conversion Utilities
 * Following TRS Section 3 specifications
 * 
 * Handles conversion between different units used in production operations:
 * - Volume: barrels, cubic meters, cubic feet
 * - Flow rates: per day, per hour, per minute
 * - Pressure: PSI, bar, kPa
 * - Temperature: Fahrenheit, Celsius, Kelvin
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type VolumeUnit = 'bbl' | 'cu_m' | 'cu_ft' | 'gal' | 'liter';
export type FlowRateUnit = 'bbl/day' | 'cu_m/day' | 'mcf/day' | 'gal/min' | 'liter/sec';
export type PressureUnit = 'psi' | 'bar' | 'kpa' | 'mpa';
export type TemperatureUnit = 'fahrenheit' | 'celsius' | 'kelvin';

// =============================================================================
// CONVERSION FACTORS
// =============================================================================

/**
 * Volume conversion factors (to cubic meters as base unit)
 */
const VOLUME_FACTORS: Record<VolumeUnit, number> = {
  bbl: 0.158987, // Barrel to cubic meters
  cu_m: 1.0,     // Cubic meters (base)
  cu_ft: 0.0283168, // Cubic feet to cubic meters
  gal: 0.00378541, // US Gallon to cubic meters
  liter: 0.001,   // Liter to cubic meters
};

/**
 * Pressure conversion factors (to PSI as base unit)
 */
const PRESSURE_FACTORS: Record<PressureUnit, number> = {
  psi: 1.0,      // PSI (base)
  bar: 14.5038,  // Bar to PSI
  kpa: 0.145038, // kPa to PSI
  mpa: 145.038,  // MPa to PSI
};

// =============================================================================
// VOLUME CONVERSIONS
// =============================================================================

/**
 * Convert volume between different units
 */
export const convertVolume = (
  value: number,
  fromUnit: VolumeUnit,
  toUnit: VolumeUnit
): number => {
  if (fromUnit === toUnit) return value;
  
  // Convert to base unit (cubic meters) then to target unit
  const cubicMeters = value * VOLUME_FACTORS[fromUnit];
  return cubicMeters / VOLUME_FACTORS[toUnit];
};

/**
 * Format volume with appropriate unit and precision
 */
export const formatVolume = (
  value: number,
  unit: VolumeUnit,
  precision: number = 2
): string => {
  const unitLabels: Record<VolumeUnit, string> = {
    bbl: 'barrels',
    cu_m: 'm³',
    cu_ft: 'ft³',
    gal: 'gallons',
    liter: 'L',
  };

  return `${value.toFixed(precision)} ${unitLabels[unit]}`;
};

// =============================================================================
// FLOW RATE CONVERSIONS
// =============================================================================

/**
 * Convert flow rate between different units
 */
export const convertFlowRate = (
  value: number,
  fromUnit: FlowRateUnit,
  toUnit: FlowRateUnit
): number => {
  if (fromUnit === toUnit) return value;

  // Define flow rate conversion factors (to bbl/day as base)
  const flowFactors: Record<FlowRateUnit, number> = {
    'bbl/day': 1.0,
    'cu_m/day': 6.28981, // Cubic meters per day to barrels per day
    'mcf/day': 178.108,  // Thousand cubic feet per day to barrels per day (approximate for gas)
    'gal/min': 34.2857,  // Gallons per minute to barrels per day
    'liter/sec': 543.44, // Liters per second to barrels per day
  };

  // Convert to base unit then to target unit
  const baseValue = value * flowFactors[fromUnit];
  return baseValue / flowFactors[toUnit];
};

/**
 * Format flow rate with appropriate unit and precision
 */
export const formatFlowRate = (
  value: number,
  unit: FlowRateUnit,
  precision: number = 1
): string => {
  // Handle large numbers with appropriate formatting
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ${unit}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K ${unit}`;
  }
  
  return `${value.toFixed(precision)} ${unit}`;
};

// =============================================================================
// PRESSURE CONVERSIONS
// =============================================================================

/**
 * Convert pressure between different units
 */
export const convertPressure = (
  value: number,
  fromUnit: PressureUnit,
  toUnit: PressureUnit
): number => {
  if (fromUnit === toUnit) return value;

  // Convert to base unit (PSI) then to target unit
  const psiValue = value * PRESSURE_FACTORS[fromUnit];
  return psiValue / PRESSURE_FACTORS[toUnit];
};

/**
 * Format pressure with appropriate unit and precision
 */
export const formatPressure = (
  value: number,
  unit: PressureUnit,
  precision: number = 1
): string => {
  const unitLabels: Record<PressureUnit, string> = {
    psi: 'PSI',
    bar: 'bar',
    kpa: 'kPa',
    mpa: 'MPa',
  };

  return `${value.toFixed(precision)} ${unitLabels[unit]}`;
};

// =============================================================================
// TEMPERATURE CONVERSIONS
// =============================================================================

/**
 * Convert temperature between different units
 */
export const convertTemperature = (
  value: number,
  fromUnit: TemperatureUnit,
  toUnit: TemperatureUnit
): number => {
  if (fromUnit === toUnit) return value;

  // Convert to Celsius first
  let celsius: number;
  switch (fromUnit) {
    case 'celsius':
      celsius = value;
      break;
    case 'fahrenheit':
      celsius = (value - 32) * (5/9);
      break;
    case 'kelvin':
      celsius = value - 273.15;
      break;
    default:
      throw new Error(`Unknown temperature unit: ${fromUnit}`);
  }

  // Convert from Celsius to target unit
  switch (toUnit) {
    case 'celsius':
      return celsius;
    case 'fahrenheit':
      return (celsius * (9/5)) + 32;
    case 'kelvin':
      return celsius + 273.15;
    default:
      throw new Error(`Unknown temperature unit: ${toUnit}`);
  }
};

/**
 * Format temperature with appropriate unit and precision
 */
export const formatTemperature = (
  value: number,
  unit: TemperatureUnit,
  precision: number = 1
): string => {
  const unitLabels: Record<TemperatureUnit, string> = {
    fahrenheit: '°F',
    celsius: '°C',
    kelvin: 'K',
  };

  return `${value.toFixed(precision)}${unitLabels[unit]}`;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (
  oldValue: number,
  newValue: number
): number => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
};

/**
 * Calculate efficiency percentage
 */
export const calculateEfficiency = (
  current: number,
  capacity: number
): number => {
  if (capacity === 0) return 0;
  return Math.min((current / capacity) * 100, 100);
};

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export const formatLargeNumber = (
  value: number,
  precision: number = 1
): string => {
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  let suffixIndex = 0;
  let scaledValue = value;

  while (scaledValue >= 1000 && suffixIndex < suffixes.length - 1) {
    scaledValue /= 1000;
    suffixIndex++;
  }

  return `${scaledValue.toFixed(precision)}${suffixes[suffixIndex]}`;
};

/**
 * Validate if a unit is supported for a given type
 */
export const isValidUnit = (
  unit: string,
  type: 'volume' | 'flowRate' | 'pressure' | 'temperature'
): boolean => {
  switch (type) {
    case 'volume':
      return Object.keys(VOLUME_FACTORS).includes(unit);
    case 'flowRate':
      return ['bbl/day', 'cu_m/day', 'mcf/day', 'gal/min', 'liter/sec'].includes(unit);
    case 'pressure':
      return Object.keys(PRESSURE_FACTORS).includes(unit);
    case 'temperature':
      return ['fahrenheit', 'celsius', 'kelvin'].includes(unit);
    default:
      return false;
  }
};

/**
 * Generic conversion utility with validation
 */
export const convertWithValidation = <T extends number>(
  value: T,
  fromUnit: string,
  toUnit: string,
  conversionMap: Record<string, Record<string, number>>
): { value: T; isValid: boolean; error?: string } => {
  try {
    if (!conversionMap[fromUnit] || !conversionMap[fromUnit][toUnit]) {
      return {
        value,
        isValid: false,
        error: `Conversion from ${fromUnit} to ${toUnit} not supported`
      };
    }

    const factor = conversionMap[fromUnit][toUnit];
    const convertedValue = (value * factor) as T;

    return {
      value: convertedValue,
      isValid: true
    };
  } catch (error) {
    return {
      value,
      isValid: false,
      error: error instanceof Error ? error.message : 'Conversion failed'
    };
  }
};

// =============================================================================
// SECURITY-READY INPUT VALIDATION
// =============================================================================

/**
 * Validate and sanitize numeric input for unit conversion
 */
export const validateNumericInput = (
  value: unknown,
  min?: number,
  max?: number
): { isValid: boolean; sanitizedValue?: number; error?: string } => {
  // Type checking
  if (value === null || value === undefined) {
    return { isValid: false, error: 'Value is required' };
  }

  // Convert to number
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);

  // Validate number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return { isValid: false, error: 'Invalid numeric value' };
  }

  // Range validation
  if (min !== undefined && numValue < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }

  if (max !== undefined && numValue > max) {
    return { isValid: false, error: `Value must be at most ${max}` };
  }

  return { isValid: true, sanitizedValue: numValue };
}; 
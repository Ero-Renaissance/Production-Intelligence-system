/**
 * Unit tests for unit conversion utilities
 * Following TRS Section 11 testing requirements
 */

import {
  convertVolume,
  convertPressure,
  convertTemperature,
  formatVolume,
  formatPressure,
  formatTemperature,
  calculatePercentageChange,
  calculateEfficiency,
  validateNumericInput,
} from './unitConversion';

describe('Unit Conversion Utilities', () => {
  
  describe('Volume Conversions', () => {
    test('should convert barrels to cubic meters', () => {
      const result = convertVolume(1, 'bbl', 'cu_m');
      expect(result).toBeCloseTo(0.158987, 5);
    });

    test('should return same value for same units', () => {
      const result = convertVolume(100, 'bbl', 'bbl');
      expect(result).toBe(100);
    });

    test('should format volume correctly', () => {
      const result = formatVolume(1500.456, 'bbl', 1);
      expect(result).toBe('1500.5 barrels');
    });
  });

  describe('Pressure Conversions', () => {
    test('should convert bar to PSI', () => {
      const result = convertPressure(1, 'bar', 'psi');
      expect(result).toBeCloseTo(14.5038, 4);
    });

    test('should format pressure correctly', () => {
      const result = formatPressure(150.789, 'psi', 1);
      expect(result).toBe('150.8 PSI');
    });
  });

  describe('Temperature Conversions', () => {
    test('should convert Celsius to Fahrenheit', () => {
      const result = convertTemperature(0, 'celsius', 'fahrenheit');
      expect(result).toBe(32);
    });

    test('should convert Fahrenheit to Celsius', () => {
      const result = convertTemperature(32, 'fahrenheit', 'celsius');
      expect(result).toBe(0);
    });

    test('should format temperature correctly', () => {
      const result = formatTemperature(25.7, 'celsius', 1);
      expect(result).toBe('25.7°C');
    });
  });

  describe('Calculation Utilities', () => {
    test('should calculate percentage change correctly', () => {
      const result = calculatePercentageChange(100, 120);
      expect(result).toBe(20);
    });

    test('should calculate efficiency correctly', () => {
      const result = calculateEfficiency(800, 1000);
      expect(result).toBe(80);
    });

    test('should cap efficiency at 100%', () => {
      const result = calculateEfficiency(1200, 1000);
      expect(result).toBe(100);
    });
  });

  describe('Input Validation', () => {
    test('should validate valid numeric input', () => {
      const result = validateNumericInput(42.5);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(42.5);
    });

    test('should reject invalid input', () => {
      const result = validateNumericInput('invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid numeric value');
    });

    test('should validate range constraints', () => {
      const result = validateNumericInput(150, 0, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be at most');
    });
  });
}); 
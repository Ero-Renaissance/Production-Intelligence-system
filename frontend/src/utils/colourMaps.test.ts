/**
 * Unit tests for color mapping utilities
 * Following TRS Section 11 testing requirements
 */

import {
  CONSTRAINT_COLORS,
  STREAM_COLORS,
  getConstraintColorClass,
  getStreamColorClass,
  getTrendColor,
  getStatusColor,
  getAccessibleColor,
} from './colourMaps';

describe('Color Mapping Utilities', () => {
  
  describe('Constraint Colors', () => {
    test('should have correct constraint colors', () => {
      expect(CONSTRAINT_COLORS.normal).toBe('#10b981');
      expect(CONSTRAINT_COLORS.warning).toBe('#f59e0b');
      expect(CONSTRAINT_COLORS.critical).toBe('#ef4444');
      expect(CONSTRAINT_COLORS.offline).toBe('#6b7280');
    });

    test('should return correct Tailwind classes for constraint levels', () => {
      const result = getConstraintColorClass('critical', 'bg');
      expect(result).toBe('bg-brand-red');
    });

    test('should return correct text classes for constraint levels', () => {
      const result = getConstraintColorClass('normal', 'text');
      expect(result).toBe('text-brand-green');
    });

    test('should fallback to normal for invalid constraint level', () => {
      // @ts-expect-error Testing invalid input
      const result = getConstraintColorClass('invalid', 'bg');
      expect(result).toBe('bg-brand-green');
    });
  });

  describe('Stream Colors', () => {
    test('should have correct stream colors', () => {
      expect(STREAM_COLORS.oil).toBe('#075985');
      expect(STREAM_COLORS['export-gas']).toBe('#065f46');
      expect(STREAM_COLORS['domestic-gas']).toBe('#6b21a8');
    });

    test('should return correct Tailwind classes for stream types', () => {
      const result = getStreamColorClass('oil', 'bg');
      expect(result).toBe('bg-oil-500');
    });

    test('should return correct border classes for stream types', () => {
      const result = getStreamColorClass('export-gas', 'border');
      expect(result).toBe('border-exportgas-500');
    });
  });

  describe('Trend Colors', () => {
    test('should return correct trend color for up trend', () => {
      const result = getTrendColor('up');
      expect(result.color).toBe('#10b981');
      expect(result.icon).toBe('↗');
    });

    test('should return correct trend color for down trend', () => {
      const result = getTrendColor('down');
      expect(result.color).toBe('#ef4444');
      expect(result.icon).toBe('↘');
    });

    test('should fallback to stable for invalid trend', () => {
      // @ts-expect-error Testing invalid input
      const result = getTrendColor('invalid');
      expect(result).toEqual(expect.objectContaining({
        color: '#6b7280',
        icon: '→'
      }));
    });
  });

  describe('Status Colors', () => {
    test('should return correct status color and class', () => {
      const result = getStatusColor('active', 'bg');
      expect(result.color).toBe('#10b981');
      expect(result.class).toBe('bg-green-500');
    });

    test('should return correct text class for status', () => {
      const result = getStatusColor('error', 'text');
      expect(result.color).toBe('#ef4444');
      expect(result.class).toBe('text-red-500');
    });

    test('should fallback to inactive for invalid status', () => {
      // @ts-expect-error Testing invalid input
      const result = getStatusColor('invalid', 'bg');
      expect(result.color).toBe('#6b7280');
      expect(result.class).toBe('bg-gray-500');
    });
  });

  describe('Accessibility Helpers', () => {
    test('should return light text for dark background', () => {
      const result = getAccessibleColor('#000000');
      expect(result).toBe('#ffffff');
    });

    test('should return dark text for light background', () => {
      const result = getAccessibleColor('#ffffff');
      expect(result).toBe('#000000');
    });

    test('should handle custom light and dark colors', () => {
      const result = getAccessibleColor('#000000', '#f0f0f0', '#333333');
      expect(result).toBe('#f0f0f0');
    });
  });
}); 
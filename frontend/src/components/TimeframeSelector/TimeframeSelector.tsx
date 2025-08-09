import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { format } from 'date-fns';

export type Timeframe = 
  | 'realtime'
  | '24h'
  | '7d'
  | 'mtd'
  | 'ytd'
  | 'custom';

interface TimeframeSelectorProps {
  value: Timeframe;
  customRange?: {
    start: Date;
    end: Date;
  };
  onChange: (timeframe: Timeframe, customRange?: { start: Date; end: Date }) => void;
}

const timeframeLabels = {
  realtime: 'Real-time',
  '24h': 'Last 24 Hours',
  '7d': 'Last 7 Days',
  mtd: 'Month to Date',
  ytd: 'Year to Date',
  custom: 'Custom Range'
} as const;

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  value,
  customRange,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    onChange(newTimeframe);
    if (newTimeframe !== 'custom') {
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (value === 'custom' && customRange) {
      return `${format(customRange.start, 'MMM d')} - ${format(customRange.end, 'MMM d')}`;
    }
    return timeframeLabels[value];
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-white">
            {getDisplayText()}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-64"
          sideOffset={4}
        >
          <RadioGroup.Root
            value={value}
            onValueChange={(val) => handleTimeframeChange(val as Timeframe)}
            className="space-y-2"
          >
            {Object.entries(timeframeLabels).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroup.Item
                  value={key}
                  id={`timeframe-${key}`}
                  className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                >
                  <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-2 after:h-2 after:rounded-full after:bg-white" />
                </RadioGroup.Item>
                <label
                  htmlFor={`timeframe-${key}`}
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  {label}
                </label>
              </div>
            ))}
          </RadioGroup.Root>

          {value === 'custom' && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={customRange?.start ? format(customRange.start, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newDate = e.target.valueAsDate;
                      if (newDate && customRange?.end) {
                        onChange('custom', {
                          start: newDate,
                          end: customRange.end
                        });
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={customRange?.end ? format(customRange.end, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newDate = e.target.valueAsDate;
                      if (newDate && customRange?.start) {
                        onChange('custom', {
                          start: customRange.start,
                          end: newDate
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <Popover.Arrow className="fill-white dark:fill-gray-800" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}; 
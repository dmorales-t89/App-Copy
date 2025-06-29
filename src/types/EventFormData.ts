// ✅ Unified EventFormData interface to prevent type mismatches
export interface EventFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  color: string;
  groupId: string;
  // ✅ Make recurrence fields required with default values to prevent undefined issues
  isRepeating: boolean;
  repeatFrequency: 'daily' | 'weekly' | 'monthly' | '';
  repeatEndDate: Date | null;
}

// ✅ Helper function to create default EventFormData
export function createDefaultEventFormData(overrides: Partial<EventFormData> = {}): EventFormData {
  return {
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    isAllDay: false,
    startTime: '09:00',
    endTime: '10:00',
    color: '#AEC6CF',
    groupId: '1',
    isRepeating: false,
    repeatFrequency: '',
    repeatEndDate: null,
    ...overrides,
  };
}
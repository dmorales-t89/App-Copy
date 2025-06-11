export interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  groupId?: string;
  color: string;
}

export interface CalendarEvent extends Event {
  isVisible?: boolean;
} 
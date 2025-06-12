export interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  notes?: string;
  groupId: string;
  color: string;
  user_id?: string;
  imageUrl?: string;
}

export interface CalendarEvent extends Event {
  isVisible?: boolean;
}

export interface CalendarGroup {
  id: string;
  name: string;
  color: string;
  isVisible?: boolean;
}
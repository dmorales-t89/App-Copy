/*
  # Add Recurring Events Support

  1. Changes
    - Add recurrence_rule column to store repeat frequency (daily, weekly, monthly)
    - Add recurrence_end_date column to store when recurring events should stop
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add recurrence columns to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'recurrence_rule'
  ) THEN
    ALTER TABLE public.events ADD COLUMN recurrence_rule text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'recurrence_end_date'
  ) THEN
    ALTER TABLE public.events ADD COLUMN recurrence_end_date text;
  END IF;
END $$;
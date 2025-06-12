/*
  # Fix Events Table Schema

  1. Changes
    - Remove duplicate events table creation
    - Fix date column type to match application usage
    - Ensure start_time and end_time columns are properly defined
  
  2. Security
    - Maintain existing RLS policies
*/

-- Drop the existing table if it exists to start fresh
DROP TABLE IF EXISTS public.events CASCADE;

-- Create the events table with correct schema
CREATE TABLE IF NOT EXISTS public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    date text NOT NULL,
    start_time text,
    end_time text,
    color text NOT NULL,
    image_url text,
    group_id text NOT NULL,
    notes text
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own events"
    ON public.events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
    ON public.events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
    ON public.events
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
    ON public.events
    FOR DELETE
    USING (auth.uid() = user_id);
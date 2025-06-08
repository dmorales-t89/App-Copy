import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { events } = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Insert events into Supabase
    const { data, error } = await supabase
      .from('calendar_events')
      .insert(
        events.map(event => ({
          user_id: user.id,
          title: event.title,
          date: event.date,
          time: event.time,
          description: event.description
        }))
      )
      .select();

    if (error) {
      console.error('Error saving events:', error);
      return NextResponse.json(
        { error: 'Failed to save events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
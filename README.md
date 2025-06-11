# Picture Scheduler App

A modern calendar application with AI-powered event creation from images.

## Features

- Monthly and weekly calendar views
- Event creation with photo upload
- AI-assisted event details extraction from images
- Calendar groups (Work, Family, Personal)
- Drag-and-drop event scheduling
- Modern, clean UI inspired by TimeTree

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/picture-scheduler-app.git
cd picture-scheduler-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `src/env.example` to `.env.local`
   - Fill in the required values:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `OPENROUTER_API_KEY`: Your OpenRouter API key for InternVL

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/` to set up the database schema
3. Enable Row Level Security (RLS) policies for the events table

## Technologies Used

- Next.js 14 with App Router
- Supabase for authentication and database
- Tailwind CSS for styling
- shadcn/ui for UI components
- date-fns for date manipulation
- InternVL (via OpenRouter) for image analysis
- TypeScript for type safety

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

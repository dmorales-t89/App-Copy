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

## Network Connectivity Troubleshooting

If you encounter "fetch failed" errors when using the AI image analysis features, this typically indicates a network connectivity issue. Here's how to troubleshoot:

### Common Causes and Solutions

1. **Internet Connectivity**
   - Ensure your development server has internet access
   - Test basic connectivity: `ping google.com`

2. **Firewall/Proxy Issues**
   - Check if outgoing HTTPS connections (port 443) to `openrouter.ai` are blocked
   - If behind a corporate network, configure proxy settings
   - Test OpenRouter connectivity: `curl https://openrouter.ai`

3. **DNS Resolution**
   - Verify DNS can resolve OpenRouter: `nslookup openrouter.ai`
   - Try using a different DNS server (e.g., 8.8.8.8)

4. **Service Availability**
   - Check OpenRouter's status page for outages
   - Verify your API key is valid and has credits

### Debugging Steps

1. **Check Environment Variables**
   ```bash
   # Verify your .env.local file contains:
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

2. **Test Network Connectivity**
   ```bash
   # Test basic connectivity
   curl -I https://openrouter.ai
   
   # Test API endpoint
   curl -X POST https://openrouter.ai/api/v1/chat/completions \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"model":"opengvlab/internvl3-14b:free","messages":[{"role":"user","content":"test"}]}'
   ```

3. **Restart Development Server**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

4. **Check Server Logs**
   - Look for detailed error messages in the terminal
   - Check browser developer console for frontend errors

### Error Messages and Solutions

- **"Network connectivity test failed"**: Basic internet connectivity issue
- **"Network connection failed after X attempts"**: Persistent connectivity problems
- **"Request timed out"**: Service overload or slow connection
- **"UNAUTHORIZED"**: Invalid or expired API key

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
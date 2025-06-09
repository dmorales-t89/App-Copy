'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cross2Icon, CheckIcon, CopyIcon } from '@radix-ui/react-icons';

const SETUP_GUIDE_DISMISSED_KEY = 'picschedule-setup-guide-dismissed';

export function SetupGuide() {
  const [isDismissed, setIsDismissed] = useState(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(SETUP_GUIDE_DISMISSED_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const dismissGuide = () => {
    localStorage.setItem(SETUP_GUIDE_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const envExample = `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
OPENROUTER_API_KEY=your-openrouter-key-here`;

  if (isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-8 bg-white border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                🚀 Welcome to PicSchedule Setup
              </h2>
              <Button
                onClick={dismissGuide}
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Cross2Icon className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-8">
              {/* Environment Variables */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">1</span>
                  Environment Variables Setup
                </h3>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    Create a <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file in your project root:
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{envExample}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(envExample, 'env')}
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                    >
                      {copiedSection === 'env' ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </section>

              {/* Supabase Setup */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">2</span>
                  Supabase Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">A. Get your Supabase credentials:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                      <li>Select your project (or create a new one)</li>
                      <li>Go to Settings → API</li>
                      <li>Copy your Project URL and anon/public key</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">B. Enable Google OAuth:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Go to Authentication → Providers</li>
                      <li>Enable Google provider</li>
                      <li>Add your Google OAuth credentials (see step 3)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">C. Configure URLs:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Site URL: <code className="bg-gray-100 px-1 rounded">http://localhost:3000</code> (development)</li>
                      <li>Redirect URLs: Add your deployment URL when ready</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Google OAuth Setup */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">3</span>
                  Google Cloud Console Setup
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">A. Create OAuth 2.0 credentials:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                      <li>Create a new OAuth 2.0 Client ID</li>
                      <li>Application type: Web application</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">B. Authorized JavaScript origins:</h4>
                    <div className="bg-gray-50 p-3 rounded border">
                      <code className="text-sm">
                        https://your-project.supabase.co<br/>
                        http://localhost:3000<br/>
                        https://your-deployment-url.netlify.app
                      </code>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">C. Authorized redirect URIs:</h4>
                    <div className="bg-gray-50 p-3 rounded border">
                      <code className="text-sm">
                        https://your-project.supabase.co/auth/v1/callback<br/>
                        http://localhost:3000<br/>
                        https://your-deployment-url.netlify.app
                      </code>
                    </div>
                  </div>
                </div>
              </section>

              {/* OpenRouter Setup */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">4</span>
                  OpenRouter API Setup
                </h3>
                <div className="space-y-3">
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter API Keys</a></li>
                    <li>Create a new API key</li>
                    <li>Add it to your .env.local file as OPENROUTER_API_KEY</li>
                  </ul>
                </div>
              </section>

              {/* Deployment */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">5</span>
                  Deployment (Optional)
                </h3>
                <div className="space-y-3">
                  <p className="text-gray-700">When deploying to Netlify:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Add environment variables to Netlify dashboard</li>
                    <li>Update Google OAuth URLs with your Netlify domain</li>
                    <li>Update Supabase redirect URLs</li>
                  </ul>
                </div>
              </section>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Button
                onClick={() => window.open('https://supabase.com/docs/guides/auth/social-login/auth-google', '_blank')}
                variant="outline"
              >
                View Supabase Docs
              </Button>
              <Button onClick={dismissGuide} className="bg-blue-600 hover:bg-blue-700 text-white">
                Got it, let's start!
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
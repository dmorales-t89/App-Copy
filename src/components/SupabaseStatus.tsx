'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { checkSupabaseConnection } from '@/lib/supabase';
import { CheckCircledIcon, CrossCircledIcon, ReloadIcon } from '@radix-ui/react-icons';

interface ConnectionStatus {
  connected: boolean;
  error?: string;
  details?: any;
}

export function SupabaseStatus() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const result = await checkSupabaseConnection();
      setStatus(result);
    } catch (error) {
      setStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <Card className="p-4 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Supabase Status</h3>
          <Button
            onClick={checkConnection}
            disabled={isChecking}
            variant="ghost"
            className="h-6 w-6 p-0"
          >
            <ReloadIcon className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {status?.connected ? (
              <CheckCircledIcon className="h-4 w-4 text-green-600" />
            ) : (
              <CrossCircledIcon className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm text-gray-700">
              {status?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {status?.error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {status.error}
            </div>
          )}

          {!status?.connected && (
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Setup Checklist:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Create .env.local file</li>
                <li>Add NEXT_PUBLIC_SUPABASE_URL</li>
                <li>Add NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                <li>Enable Google OAuth in Supabase</li>
                <li>Configure Google Cloud Console</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
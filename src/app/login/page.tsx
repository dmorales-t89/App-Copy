'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2Icon, EyeIcon, EyeOffIcon, AlertCircleIcon } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithGoogle, signInWithEmail, user, loading, error, isConfigured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const { error } = await signInWithEmail(email, password);
    
    if (error) {
      // If user doesn't exist, redirect to signup
      if (error.message.includes('Invalid login credentials') || 
          error.message.includes('Email not confirmed') ||
          error.message.includes('User not found')) {
        router.push(`/signup?email=${encodeURIComponent(email)}&message=Account not found. Please create an account.`);
        return;
      }
    } else {
      router.push('/');
    }
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    // Loading state will be managed by auth context
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#011936] flex items-center justify-center">
        <Loader2Icon className="w-8 h-8 animate-spin text-[#C2EABD]" />
      </div>
    );
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#011936] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-white/10 backdrop-blur-sm border border-[#C2EABD]/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#C2EABD] mb-2">Welcome Back</h1>
            <p className="text-[#C2EABD]/80">Sign in to your PicSchedule account</p>
          </div>

          {!isConfigured && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 text-sm font-medium">Configuration Required</p>
              </div>
              <p className="text-yellow-400/80 text-sm mt-1">
                Please configure your Supabase credentials in .env.local to enable authentication.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {searchParams?.get('message') && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">{searchParams.get('message')}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#C2EABD] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-[#C2EABD]/20 rounded-lg text-[#C2EABD] placeholder-[#C2EABD]/50 focus:outline-none focus:ring-2 focus:ring-[#C2EABD]/50 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={!isConfigured || loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#C2EABD] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-[#C2EABD]/20 rounded-lg text-[#C2EABD] placeholder-[#C2EABD]/50 focus:outline-none focus:ring-2 focus:ring-[#C2EABD]/50 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  disabled={!isConfigured || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#C2EABD]/50 hover:text-[#C2EABD]"
                  disabled={!isConfigured || loading}
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password || !isConfigured}
              className="w-full bg-[#C2EABD] text-[#011936] hover:bg-[#A3D5FF] py-3 font-medium disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-[#C2EABD]/20"></div>
            <span className="px-4 text-[#C2EABD]/60 text-sm">or</span>
            <div className="flex-1 border-t border-[#C2EABD]/20"></div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading || !isConfigured}
            variant="outline"
            className="w-full border-[#C2EABD]/20 text-[#C2EABD] hover:bg-[#C2EABD]/10 py-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="mt-6 text-center">
            <p className="text-[#C2EABD]/80 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#C2EABD] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
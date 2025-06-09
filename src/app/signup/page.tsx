'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2Icon, EyeIcon, EyeOffIcon } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { signInWithGoogle, signUpWithEmail, user, loading, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill email from URL params if coming from login redirect
  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Validate password match
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  }, [password, confirmPassword]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;
    if (password !== confirmPassword) return;
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUpWithEmail(email, password);
    
    if (!error) {
      // Show success message or redirect
      router.push('/login?message=Check your email to confirm your account');
    }
    setIsSubmitting(false);
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    await signInWithGoogle();
    // Note: Loading state will be managed by the auth context
    // and redirect will happen automatically on success
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#011936] flex items-center justify-center">
        <Loader2Icon className="w-8 h-8 animate-spin text-[#C2EABD]" />
      </div>
    );
  }

  // Don't render signup form if user is already authenticated
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
            <h1 className="text-3xl font-bold text-[#C2EABD] mb-2">Create Account</h1>
            <p className="text-[#C2EABD]/80">Join PicSchedule and start organizing your events</p>
          </div>

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

          <form onSubmit={handleEmailSignup} className="space-y-6">
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
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#C2EABD]/50 hover:text-[#C2EABD]"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-[#C2EABD]/60 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#C2EABD] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-[#C2EABD]/20 rounded-lg text-[#C2EABD] placeholder-[#C2EABD]/50 focus:outline-none focus:ring-2 focus:ring-[#C2EABD]/50 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#C2EABD]/50 hover:text-[#C2EABD]"
                >
                  {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-400 mt-1">{passwordError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !email || !password || !confirmPassword || !!passwordError}
              className="w-full bg-[#C2EABD] text-[#011936] hover:bg-[#A3D5FF] py-3 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-[#C2EABD]/20"></div>
            <span className="px-4 text-[#C2EABD]/60 text-sm">or</span>
            <div className="flex-1 border-t border-[#C2EABD]/20"></div>
          </div>

          <Button
            onClick={handleGoogleSignup}
            disabled={isSubmitting}
            variant="outline"
            className="w-full border-[#C2EABD]/20 text-[#C2EABD] hover:bg-[#C2EABD]/10 py-3"
          >
            {isSubmitting ? (
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
              Already have an account?{' '}
              <Link href="/login" className="text-[#C2EABD] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
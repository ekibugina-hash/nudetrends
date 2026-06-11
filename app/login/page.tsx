"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password === 'Badman256.') {
      // Set session authentication token
      sessionStorage.setItem('nude_trends_admin_authenticated', 'true');
      router.push('/admin');
    } else {
      setError('Invalid admin credentials. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-stone-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0e0e0e] border border-stone-850 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6 animate-scaleUp">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-orange-600/10 border border-orange-500/20 rounded-full text-orange-500">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="font-extrabold text-white text-lg sm:text-xl tracking-tight uppercase">
            RESTRICTED ACCESS
          </h1>
          <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
            Authorized administrators only. Credentials required.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Secret Passkey
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 focus:border-orange-500 rounded-xl py-2.5 pl-4 pr-11 text-sm text-stone-100 placeholder:text-stone-700 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-stone-550 hover:text-stone-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center gap-2.5 text-xs text-red-400 font-bold animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-stone-950 font-black text-xs sm:text-sm rounded-xl transition shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Key className="w-4 h-4" />
            <span>Verify & Authenticate</span>
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-[10px] text-stone-600 hover:text-stone-400 transition"
          >
            ← Return to Main Page
          </button>
        </div>

      </div>
    </div>
  );
}

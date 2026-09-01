'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-5 font-sans">
      <div className="w-full max-w-[400px] rounded-xl bg-white p-8 text-center shadow-md">
        <h2 className="mb-2 text-2xl font-bold text-[#388E3C]">Reset Password</h2>
        <p className="mb-6 text-sm text-gray-600">Enter your email to receive recovery instructions.</p>

        {submitted ? (
          <div className="rounded-md bg-green-50 p-4 text-green-800">
            <p className="text-sm font-semibold">Instructions Sent!</p>
            <p className="mt-1 text-xs">If an account exists for {email}, a reset link has been dispatched.</p>
            <Link href="/login" className="mt-4 inline-block font-bold text-[#388E3C] hover:underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="text-left">
            <div className="mb-5">
              <label htmlFor="recovery-email" className="mb-2 block text-sm font-semibold text-gray-800">
                Email Address
              </label>
              <input
                type="email"
                id="recovery-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C] focus:ring-1 focus:ring-[#388E3C]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-[#388E3C] p-3 text-base font-bold text-white transition-colors hover:bg-[#2e7d32]"
            >
              Send Reset Link
            </button>
          </form>
        )}

        <div className="mt-6 text-sm">
          <Link href="/login" className="font-semibold text-gray-600 hover:text-gray-900">
            &larr; Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
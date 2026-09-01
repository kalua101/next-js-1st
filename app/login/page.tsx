'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UserRole = 'customer';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the backend API to authenticate
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://next-js-1st-1.onrender.com/api/v1';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();

      // Store authentication data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Route based on user role
      if (data.user.role === 'superadmin') {
        router.push('/superadmin');
      } else if (data.user.role === 'admin') {
        localStorage.setItem('adminLoggedIn', 'true');
        router.push('/admin/dashboard');
      } else {
        router.push('/marketplace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password. Please register first.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f5] p-5 font-sans">
      <div className="w-full max-w-[400px] rounded-xl bg-white p-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        <h2 className="mb-2.5 text-3xl font-bold text-[#388E3C]">Welcome Back</h2>
        <p className="mb-6 text-sm text-gray-600">Please login to continue</p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Form */}
<form onSubmit={handleSubmit} className="text-left">
  <div className="mb-5">
    <label htmlFor="email" className="mb-2 block font-semibold text-gray-800">
      Email Address
    </label>
    <input
      type="email"
      id="email"
      required
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="Enter your email"
      className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C] focus:ring-1 focus:ring-[#388E3C]"
    />
  </div>

  <div className="mb-5">
    <label htmlFor="password" className="mb-2 block font-semibold text-gray-800">
      Password
    </label>
    <input
      type="password"
      id="password"
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter your password"
      className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C] focus:ring-1 focus:ring-[#388E3C]"
    />
  </div>

  <button
    type="submit"
    disabled={loading}
    className="w-full rounded-md bg-[#388E3C] p-3 text-lg font-bold text-white transition-colors hover:bg-[#2e7d32] disabled:bg-gray-400 disabled:cursor-not-allowed"
  >
    {loading ? 'Logging in...' : 'Log In'}
  </button>
</form>

        {/* Navigation Links */}
        <div className="mt-5 space-y-1 text-sm">
          <p>
            <Link href="/forgot-password" className="text-[#388E3C] hover:underline">
              Forgot Password?
            </Link>
          </p>
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-[#388E3C] hover:underline">
              Sign Up Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

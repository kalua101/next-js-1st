'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import API_URL from '@/lib/config';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type Role = 'buyer' | 'farmer';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get('role') as Role) || 'buyer';

  const [role, setRole] = useState<Role>(initialRole);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', region: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Map frontend role to backend role
      const backendRole = role === 'farmer' ? 'farmer' : 'user';

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          phone_number: formData.phone,
          password: formData.password,
          role: backendRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      console.log('Registration successful:', data);

      // Show success and redirect to login
      alert('Registration successful! Please log in with your credentials.');
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-5 font-sans">
      <div className="w-full max-w-[480px] rounded-xl bg-white p-8 shadow-md">
        <h2 className="mb-2 text-center text-3xl font-bold text-[#388E3C]">Create Account</h2>
        <p className="mb-6 text-center text-sm text-gray-600">Join the AddisFarmers network</p>

        {/* Role Selection */}
        <div className="mb-6 flex rounded-md bg-gray-200 p-1">
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={`flex-1 rounded py-2.5 text-sm font-bold transition-all ${role === 'buyer' ? 'bg-[#388E3C] text-white shadow' : 'text-gray-600'}`}
          >
            Buyer
          </button>
          <button
            type="button"
            onClick={() => setRole('farmer')}
            className={`flex-1 rounded py-2.5 text-sm font-bold transition-all ${role === 'farmer' ? 'bg-[#388E3C] text-white shadow' : 'text-gray-600'}`}
          >
            Farmer
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
              placeholder="e.g. Abebe Bikila"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Phone Number</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
              placeholder="+251 9..."
            />
          </div>

          {role === 'farmer' && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">Farm Region / Location</label>
              <input
                type="text"
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
                placeholder="e.g. Amhara - Woldia"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-md bg-[#388E3C] py-3 text-lg font-bold text-white transition-colors hover:bg-[#2e7d32] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : `Register as ${role === 'farmer' ? 'Farmer' : 'Buyer'}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#388E3C] hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
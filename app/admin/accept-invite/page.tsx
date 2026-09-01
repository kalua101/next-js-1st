'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitationEmail, setInvitationEmail] = useState('');
  const [formData, setFormData] = useState({ fullName: '', password: '', confirmPassword: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setValidating(false);
      return;
    }

    // Validate the invitation token
    const validateToken = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/validate-invitation/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Invalid or expired invitation');
        }

        const data = await response.json();
        setInvitationEmail(data.email);
        setExpiresAt(new Date(data.expires_at).toLocaleDateString());
        setValidating(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid or expired invitation link');
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.fullName || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/register-with-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitation_token: token,
          full_name: formData.fullName,
          password: formData.password,
          phone_number: formData.phone || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      console.log('Admin registration successful:', data);

      // Show success message and redirect to login
      alert('Admin account created successfully! Please log in with your credentials.');
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold text-[#388E3C]">Validating Invitation...</div>
          <div className="text-gray-600">Please wait</div>
        </div>
      </div>
    );
  }

  if (error && !invitationEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-5">
        <div className="w-full max-w-[480px] rounded-xl bg-white p-8 shadow-md text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-4 text-2xl font-bold text-red-600">Invalid Invitation</h2>
          <p className="mb-6 text-gray-700">{error}</p>
          <Link 
            href="/login" 
            className="inline-block rounded-md bg-[#388E3C] px-6 py-3 font-bold text-white transition-colors hover:bg-[#2e7d32]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-5 font-sans">
      <div className="w-full max-w-[480px] rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="mb-3 text-5xl">🎉</div>
          <h2 className="mb-2 text-3xl font-bold text-[#388E3C]">Welcome, Admin!</h2>
          <p className="text-sm text-gray-600">Complete your registration to get started</p>
        </div>

        {/* Invitation Info */}
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="text-sm font-semibold text-green-800">You've been invited as an admin</div>
          <div className="mt-1 text-sm text-green-700">Email: <strong>{invitationEmail}</strong></div>
          <div className="mt-1 text-xs text-green-600">Expires: {expiresAt}</div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
              placeholder="+251 9..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
              placeholder="••••••••"
              minLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-md bg-[#388E3C] py-3 text-lg font-bold text-white transition-colors hover:bg-[#2e7d32] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
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

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="text-2xl font-bold text-[#388E3C]">Loading...</div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminRequest {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

interface Invitation {
  id: number;
  email: string;
  invitation_token: string;
  invitation_url: string;
  invited_by_email: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
}

interface Stats {
  total_admins: number;
  pending_admins: number;
  approved_admins: number;
  total_users: number;
  total_farmers: number;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [pendingAdmins, setPendingAdmins] = useState<AdminRequest[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'invitations'>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in as superadmin
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'superadmin') {
      setError('Access denied. Super admin privileges required.');
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/stats`, { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch pending admins
      const pendingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/pending-admins`, { headers });
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingAdmins(pendingData);
      }

      // Fetch all admins
      const allResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/all-admins`, { headers });
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAllAdmins(allData);
      }

      // Fetch invitations
      const invitationsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/invitations`, { headers });
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData);
      }
    } catch (err) {
      setError('Failed to load admin data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: number, approved: boolean) => {
    setProcessingId(userId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/approve-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, approved })
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      const data = await response.json();
      alert(data.message);
      
      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveAdmin = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to remove admin ${userName}?`)) {
      return;
    }

    setProcessingId(userId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/remove-admin/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove admin');
      }

      const data = await response.json();
      alert(data.message);
      
      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail || !newInviteEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setSendingInvite(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/invite-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newInviteEmail })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send invitation');
      }

      const data = await response.json();
      alert(`Invitation sent successfully to ${data.email}!\n\nInvitation Link:\n${data.invitation_url}`);
      
      setNewInviteEmail('');
      await fetchData();
      setActiveTab('invitations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: number, email: string) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${email}?`)) {
      return;
    }

    setProcessingId(invitationId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/revoke-invitation/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to revoke invitation');
      }

      const data = await response.json();
      alert(data.message);
      
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopyLink = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold text-[#388E3C]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-5 font-sans">
      {/* Header */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#388E3C]">Super Admin Dashboard</h1>
            <p className="text-gray-600">Manage admin registrations and users</p>
          </div>
          <Link 
            href="/admin/dashboard"
            className="rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="text-sm text-gray-600">Pending Admins</div>
              <div className="text-3xl font-bold text-orange-600">{stats.pending_admins}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="text-sm text-gray-600">Approved Admins</div>
              <div className="text-3xl font-bold text-green-600">{stats.approved_admins}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="text-sm text-gray-600">Total Admins</div>
              <div className="text-3xl font-bold text-[#388E3C]">{stats.total_admins}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="text-3xl font-bold text-blue-600">{stats.total_users}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="text-sm text-gray-600">Total Farmers</div>
              <div className="text-3xl font-bold text-purple-600">{stats.total_farmers}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex rounded-md bg-white p-1 shadow-md">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 rounded py-3 text-sm font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-[#388E3C] text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Requests ({pendingAdmins.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 rounded py-3 text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#388E3C] text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Admins ({allAdmins.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex-1 rounded py-3 text-sm font-bold transition-all ${
              activeTab === 'invitations'
                ? 'bg-[#388E3C] text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Invitations ({invitations.length})
          </button>
        </div>

        {/* Pending Admins Table */}
        {activeTab === 'pending' && (
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Pending Admin Requests</h2>
            
            {pendingAdmins.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No pending admin requests
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-left">
                      <th className="pb-3 text-sm font-semibold text-gray-700">Name</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700">Email</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700">Phone</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700">Requested</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAdmins.map((admin) => (
                      <tr key={admin.id} className="border-b border-gray-100">
                        <td className="py-4 text-gray-800">{admin.full_name}</td>
                        <td className="py-4 text-gray-600">{admin.email}</td>
                        <td className="py-4 text-gray-600">{admin.phone_number || 'N/A'}</td>
                        <td className="py-4 text-sm text-gray-500">{formatDate(admin.created_at)}</td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproval(admin.id, true)}
                              disabled={processingId === admin.id}
                              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                            >
                              {processingId === admin.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleApproval(admin.id, false)}
                              disabled={processingId === admin.id}
                              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-400"
                            >
                              {processingId === admin.id ? 'Processing...' : 'Deny'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* All Admins Table */}
        {activeTab === 'all' && (
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold text-gray-800">All Admin Users</h2>
            
            {allAdmins.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No admin users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-left">
                      <th className="pb-3 text-sm font-semibold text-gray-700">Name</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700">Email</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700">Phone</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700">Status</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700">Created</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAdmins.map((admin) => (
                      <tr key={admin.id} className="border-b border-gray-100">
                        <td className="py-4 text-gray-800">{admin.full_name}</td>
                        <td className="py-4 text-gray-600">{admin.email}</td>
                        <td className="py-4 text-gray-600">{admin.phone_number || 'N/A'}</td>
                        <td className="py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            admin.is_approved 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {admin.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-500">{formatDate(admin.created_at)}</td>
                        <td className="py-4">
                          {admin.is_approved ? (
                            <button
                              onClick={() => handleRemoveAdmin(admin.id, admin.full_name)}
                              disabled={processingId === admin.id}
                              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-400"
                            >
                              {processingId === admin.id ? 'Removing...' : 'Remove'}
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproval(admin.id, true)}
                                disabled={processingId === admin.id}
                                className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproval(admin.id, false)}
                                disabled={processingId === admin.id}
                                className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-400"
                              >
                                Deny
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-6">
            {/* Send New Invitation */}
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-bold text-gray-800">Send Admin Invitation</h2>
              <form onSubmit={handleSendInvite} className="flex gap-3">
                <input
                  type="email"
                  value={newInviteEmail}
                  onChange={(e) => setNewInviteEmail(e.target.value)}
                  placeholder="Enter admin email address"
                  className="flex-1 rounded-md border border-gray-300 p-3 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="rounded-md bg-[#388E3C] px-6 py-3 font-bold text-white transition-colors hover:bg-[#2e7d32] disabled:bg-gray-400"
                >
                  {sendingInvite ? 'Sending...' : 'Send Invitation'}
                </button>
              </form>
              <p className="mt-2 text-sm text-gray-600">
                The invitation link will expire in 7 days and can only be used once.
              </p>
            </div>

            {/* Invitations List */}
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-bold text-gray-800">All Invitations</h2>
              
              {invitations.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No invitations sent yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-left">
                        <th className="pb-3 text-sm font-semibold text-gray-700">Email</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Status</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Invited By</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Created</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Expires</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map((invitation) => {
                        const isExpired = new Date(invitation.expires_at) < new Date();
                        const isPending = !invitation.is_used && !isExpired;
                        
                        return (
                          <tr key={invitation.id} className="border-b border-gray-100">
                            <td className="py-4 text-gray-800">{invitation.email}</td>
                            <td className="py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                invitation.is_used
                                  ? 'bg-blue-100 text-blue-800'
                                  : isExpired
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {invitation.is_used ? 'Used' : isExpired ? 'Expired' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-4 text-gray-600">{invitation.invited_by_email}</td>
                            <td className="py-4 text-sm text-gray-500">{formatDate(invitation.created_at)}</td>
                            <td className="py-4 text-sm text-gray-500">{formatDate(invitation.expires_at)}</td>
                            <td className="py-4">
                              <div className="flex gap-2">
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleCopyLink(invitation.invitation_url, invitation.invitation_token)}
                                      className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                                    >
                                      {copiedToken === invitation.invitation_token ? '✓ Copied' : 'Copy Link'}
                                    </button>
                                    <button
                                      onClick={() => handleRevokeInvitation(invitation.id, invitation.email)}
                                      disabled={processingId === invitation.id}
                                      className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-gray-400"
                                    >
                                      {processingId === invitation.id ? 'Revoking...' : 'Revoke'}
                                    </button>
                                  </>
                                )}
                                {!isPending && (
                                  <span className="text-xs text-gray-400">
                                    {invitation.is_used ? 'Completed' : 'Expired'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

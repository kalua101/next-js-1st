'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'farmer' | 'admin'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/all-users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else if (response.status === 403) {
          alert('Access denied. Admin privileges required.');
          router.push('/admin/dashboard');
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const filteredUsers = users.filter(user => 
    filter === 'all' ? true : user.role === filter
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 md:flex">
      {/* Mobile Topbar */}
      <div className="flex items-center justify-between bg-[#222] p-4 text-white md:hidden">
        <h2 className="text-xl font-bold text-[#A7C957]">Admin Panel</h2>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="rounded border border-gray-700 p-2 text-white hover:bg-gray-800"
        >
          {isSidebarOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'block' : 'hidden'
        } w-full bg-[#222] p-6 text-white md:block md:w-64`}
      >
        <h2 className="mb-8 hidden text-2xl font-bold text-[#A7C957] md:block">Admin Panel</h2>
        <nav className="space-y-4 text-sm font-medium">
          <Link href="/admin/dashboard" className="block rounded px-4 py-2 text-gray-300 hover:bg-gray-800">
            📊 Dashboard
          </Link>
          <Link href="/admin/users" className="block rounded bg-[#388E3C] px-4 py-2 text-white">
            👥 All Users
          </Link>
         
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <Link
            href="/admin/dashboard"
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 rounded-md bg-white p-2 shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`rounded px-4 py-2 text-sm font-bold ${
              filter === 'all' ? 'bg-[#388E3C] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setFilter('user')}
            className={`rounded px-4 py-2 text-sm font-bold ${
              filter === 'user' ? 'bg-[#388E3C] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Buyers ({users.filter(u => u.role === 'user').length})
          </button>
          <button
            onClick={() => setFilter('farmer')}
            className={`rounded px-4 py-2 text-sm font-bold ${
              filter === 'farmer' ? 'bg-[#388E3C] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Farmers ({users.filter(u => u.role === 'farmer').length})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`rounded px-4 py-2 text-sm font-bold ${
              filter === 'admin' ? 'bg-[#388E3C] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Admins ({users.filter(u => u.role === 'admin').length})
          </button>
        </div>

        {/* Users Table */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-xs uppercase text-gray-800">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-gray-600">#{user.id}</td>
                      <td className="p-3 font-bold text-gray-900">{user.full_name}</td>
                      <td className="p-3 text-gray-700">{user.email}</td>
                      <td className="p-3 text-gray-600">{user.phone_number || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-xs font-bold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'farmer' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-xs font-bold ${
                          user.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.is_approved ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{formatDate(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

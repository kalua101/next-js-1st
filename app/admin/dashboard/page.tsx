'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type TabType = 'dashboard' | 'users' | 'orders';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Order {
  id: number;
  product_name: string;
  buyer_name: string;
  buyer_phone: string;
  farmer_name: string;
  farmer_location: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
}

interface CropProduct {
  id: number;
  title: string;
  farmer: string;
  location: string;
  imageUrl: string;
  status: string;
}

export default function UnifiedAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Dashboard state
  const [crops, setCrops] = useState<CropProduct[]>([]);
  const [dashStats, setDashStats] = useState<any>(null);
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersFilter, setUsersFilter] = useState('all');
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/login');
        return false;
      }

      const user = JSON.parse(userStr);
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        alert('Access denied. Admin privileges required.');
        router.push('/login');
        return false;
      }

      setIsSuperAdmin(user.role === 'superadmin');
      return true;
    };

    if (checkAuth()) {
      loadAllData();
    }
  }, [router]);

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadUsersData();
    }
  }, [usersFilter]);

  useEffect(() => {
    if (!loading) {
      loadOrdersData();
    }
  }, [orderFilter]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadDashboardData(),
      loadUsersData(),
      loadOrdersData()
    ]);
    setLoading(false);
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load crops
      const cropsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/crops`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (cropsRes.ok) {
        const cropsData = await cropsRes.json();
        setCrops(cropsData);
      }
      
      // Load stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDashStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const loadUsersData = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = usersFilter === 'all' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/users`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/users?role=${usersFilter}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadOrdersData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load orders
      const ordersUrl = orderFilter === 'all'
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/orders`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/orders?status_filter=${orderFilter}`;
      
      const ordersRes = await fetch(ordersUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
      
      // Load order stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/stats/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setOrderStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <div className="mb-4 text-3xl font-bold text-[#388E3C]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-5 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#388E3C]">Admin Panel</h1>
            <div className="flex items-center gap-4">
              {isSuperAdmin && (
                <Link 
                  href="/superadmin"
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  Super Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-[#388E3C] text-[#388E3C]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-[#388E3C] text-[#388E3C]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'orders'
                  ? 'border-b-2 border-[#388E3C] text-[#388E3C]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Orders ({orderStats?.total_orders || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-5 py-6">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="text-sm text-gray-600">Total Users</div>
                <div className="text-3xl font-bold text-[#388E3C]">{dashStats?.total_users || 0}</div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="text-sm text-gray-600">Farmers</div>
                <div className="text-3xl font-bold text-[#388E3C]">{dashStats?.total_farmers || 0}</div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="text-sm text-gray-600">Buyers</div>
                <div className="text-3xl font-bold text-[#388E3C]">{dashStats?.total_buyers || 0}</div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="text-sm text-gray-600">Products</div>
                <div className="text-3xl font-bold text-[#388E3C]">{dashStats?.total_crops || 0}</div>
              </div>
            </div>

            {/* Crops Table */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Recent Products</h2>
              {crops.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No products available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="pb-3 text-sm font-semibold text-gray-700">Image</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Product</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Farmer</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Location</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crops.slice(0, 5).map((crop) => (
                        <tr key={crop.id} className="border-b border-gray-100">
                          <td className="py-3">
                            <div className="relative h-10 w-10 overflow-hidden rounded">
                              <Image src={crop.imageUrl} alt={crop.title} fill className="object-cover" />
                            </div>
                          </td>
                          <td className="py-3 font-semibold text-gray-900">{crop.title}</td>
                          <td className="py-3 text-gray-600">{crop.farmer}</td>
                          <td className="py-3 text-gray-600">{crop.location}</td>
                          <td className="py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              crop.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {crop.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <select
                value={usersFilter}
                onChange={(e) => setUsersFilter(e.target.value)}
                className="rounded-md border border-gray-300 p-2 text-black outline-none focus:border-[#388E3C]"
              >
                <option value="all">All Users</option>
                <option value="user">Buyers Only</option>
                <option value="farmer">Farmers Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">User List</h2>
              {users.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="pb-3 text-sm font-semibold text-gray-700">Name</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Email</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Phone</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Role</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100">
                          <td className="py-4 text-gray-900">{user.full_name}</td>
                          <td className="py-4 text-gray-600">{user.email}</td>
                          <td className="py-4 text-gray-600">{user.phone_number || 'N/A'}</td>
                          <td className="py-4">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Stats */}
            {orderStats && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-3xl font-bold text-[#388E3C]">{orderStats.total_orders}</div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="text-sm text-gray-600">Pending</div>
                  <div className="text-3xl font-bold text-yellow-600">{orderStats.pending_orders}</div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="text-sm text-gray-600">Confirmed</div>
                  <div className="text-3xl font-bold text-blue-600">{orderStats.confirmed_orders}</div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="text-sm text-gray-600">Delivered</div>
                  <div className="text-3xl font-bold text-green-600">{orderStats.delivered_orders}</div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="text-sm text-gray-600">Cancelled</div>
                  <div className="text-3xl font-bold text-red-600">{orderStats.cancelled_orders}</div>
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="rounded-md border border-gray-300 p-2 text-black outline-none focus:border-[#388E3C]"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Orders Table */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Order List</h2>
              {orders.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No orders found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="pb-3 text-sm font-semibold text-gray-700">ID</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Product</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Buyer</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Farmer</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Qty</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Status</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 text-gray-800">#{order.id}</td>
                          <td className="py-4 font-semibold text-gray-900">{order.product_name}</td>
                          <td className="py-4">
                            <div className="text-gray-900">{order.buyer_name}</div>
                            <div className="text-xs text-gray-500">{order.buyer_phone}</div>
                          </td>
                          <td className="py-4">
                            <div className="text-gray-900">{order.farmer_name}</div>
                            <div className="text-xs text-gray-500">{order.farmer_location}</div>
                          </td>
                          <td className="py-4 text-gray-600">{order.quantity} {order.unit}</td>
                          <td className="py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'in_transit' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                        </tr>
                      ))}
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: number;
  user_id: number;
  crop_id: number | null;
  product_name: string;
  product_category: string | null;
  quantity: number;
  unit: string;
  price_per_unit: string;
  total_price: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  delivery_address: string;
  farmer_name: string;
  farmer_location: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Check if user is logged in as admin
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      setError('Access denied. Admin privileges required.');
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    fetchData();
  }, [router, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch orders
      const ordersUrl = statusFilter === 'all' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/orders`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/orders?status_filter=${statusFilter}`;
      
      const ordersResponse = await fetch(ordersUrl, { headers });
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }

      // Fetch stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/stats/summary`, { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (err) {
      setError('Failed to load orders data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus || undefined,
          admin_notes: adminNotes || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      alert('Order updated successfully!');
      setSelectedOrder(null);
      setNewStatus('');
      setAdminNotes('');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.admin_notes || '');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold text-[#388E3C]">Loading Orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-5 font-sans">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#388E3C]">Order Management</h1>
            <p className="text-gray-600">View and manage customer orders</p>
          </div>
          <Link 
            href="/admin/dashboard"
            className="rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
          >
            Back to Dashboard
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
              <div className="text-sm text-gray-600">Total Orders</div>
              <div className="text-3xl font-bold text-[#388E3C]">{stats.total_orders}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending_orders}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="text-sm text-gray-600">Confirmed</div>
              <div className="text-3xl font-bold text-blue-600">{stats.confirmed_orders}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="text-sm text-gray-600">Delivered</div>
              <div className="text-3xl font-bold text-green-600">{stats.delivered_orders}</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="text-sm text-gray-600">Cancelled</div>
              <div className="text-3xl font-bold text-red-600">{stats.cancelled_orders}</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-md">
          <label className="mr-3 text-sm font-semibold text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white p-2 text-black outline-none focus:border-[#388E3C]"
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
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-800">Orders List</h2>
          
          {orders.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left">
                    <th className="pb-3 text-sm font-semibold text-gray-700">Order ID</th>
                    <th className="pb-3 text-sm font-semibold text-gray-700">Product</th>
                    <th className="pb-3 text-sm font-semibold text-gray-700">Buyer</th>
                    <th className="pb-3 text-sm font-semibold text-gray-700">Farmer</th>
                    <th className="pb-3 text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="pb-3 text-sm font-semibold text-gray-700">Status</th>
                    <th className="pb-3 text-sm font-semibold text-gray-700">Date</th>
                    <th className="pb-3 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 text-gray-800">#{order.id}</td>
                      <td className="py-4">
                        <div className="font-semibold text-gray-800">{order.product_name}</div>
                        <div className="text-xs text-gray-500">{order.product_category}</div>
                      </td>
                      <td className="py-4">
                        <div className="text-gray-800">{order.buyer_name}</div>
                        <div className="text-xs text-gray-500">{order.buyer_phone}</div>
                      </td>
                      <td className="py-4">
                        <div className="text-gray-800">{order.farmer_name}</div>
                        <div className="text-xs text-gray-500">{order.farmer_location}</div>
                      </td>
                      <td className="py-4 text-gray-600">
                        {order.quantity} {order.unit}
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="py-4">
                        <button
                          onClick={() => openOrderModal(order)}
                          className="rounded-md bg-[#388E3C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2e7d32]"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Order #{selectedOrder.id}</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Order Details */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Product</div>
                <div className="font-semibold text-gray-900">{selectedOrder.product_name}</div>
                <div className="text-sm text-gray-600">{selectedOrder.product_category}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Quantity</div>
                <div className="font-semibold text-gray-900">{selectedOrder.quantity} {selectedOrder.unit}</div>
                <div className="text-sm text-gray-600">{selectedOrder.price_per_unit}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Buyer</div>
                <div className="font-semibold text-gray-900">{selectedOrder.buyer_name}</div>
                <div className="text-sm text-gray-600">{selectedOrder.buyer_email}</div>
                <div className="text-sm text-gray-600">{selectedOrder.buyer_phone}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Farmer</div>
                <div className="font-semibold text-gray-900">{selectedOrder.farmer_name}</div>
                <div className="text-sm text-gray-600">{selectedOrder.farmer_location}</div>
              </div>
            </div>

            <div className="mb-4 rounded-lg bg-blue-50 p-4">
              <div className="text-xs text-gray-500 mb-1">Delivery Address</div>
              <div className="text-gray-800">{selectedOrder.delivery_address}</div>
            </div>

            {selectedOrder.notes && (
              <div className="mb-4 rounded-lg bg-yellow-50 p-4">
                <div className="text-xs text-gray-500 mb-1">Customer Notes</div>
                <div className="text-gray-800">{selectedOrder.notes}</div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-black outline-none focus:border-[#388E3C]"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
                  placeholder="Add notes about this order..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 rounded-md border-2 border-gray-300 py-2 font-bold text-gray-700 hover:bg-gray-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={updating}
                  className="flex-1 rounded-md bg-[#388E3C] py-2 font-bold text-white transition-colors hover:bg-[#2e7d32] disabled:bg-gray-400"
                >
                  {updating ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

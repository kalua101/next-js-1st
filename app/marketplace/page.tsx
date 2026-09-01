'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getMarketplaceProducts } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

// ==========================================
// 1. TYPES
// ==========================================
interface Product {
  id: number;
  title: string;
  category: string;
  location: string;
  price: string;
  farmer: string;
  imageUrl: string;
  status: string;
}

interface SearchFormProps {
  search: string;
  setSearch: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
}

// ==========================================
// 2. DATA WILL BE FETCHED FROM BACKEND
// ==========================================

// ==========================================
// 3. RESPONSIVE NAVBAR WITH MOBILE HAMBURGER
// ==========================================
function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        const user = JSON.parse(userStr);
        setUserName(user.full_name || user.email);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <header className="bg-[#388E3C] text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between px-5 py-4">
        <Link href="/" className="text-2xl font-bold">
          AddisFarmers<span className="text-[#A7C957]">.org</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-semibold hover:underline">
            Home
          </Link>
         
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-sm">Hello, {userName}</span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-white px-4 py-1.5 text-sm font-semibold hover:bg-red-600 hover:border-red-600"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-white px-4 py-1.5 text-sm font-semibold hover:bg-white hover:text-[#388E3C]"
            >
              Log In
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded p-2 text-white hover:bg-[#2e7d32] focus:outline-none md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 01-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 01-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 011.414-1.414l4.829 4.828 4.828-4.828a1 1 0 111.414 1.414l-4.828 4.829 4.828 4.828z"/>
            ) : (
              <path fillRule="evenodd" d="M4 5h16a1 1 0 010 2H4a1 1 0 110-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z"/>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-[#2e7d32] bg-[#388E3C] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold hover:underline"
            >
              Home
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-semibold hover:underline"
            >
              Marketplace
            </Link>
            {isLoggedIn ? (
              <>
                <span className="text-sm text-gray-200">Hello, {userName}</span>
                <button
                  onClick={handleLogout}
                  className="inline-block rounded-md border border-white py-2 text-center text-base font-semibold hover:bg-red-600"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-block rounded-md border border-white py-2 text-center text-base font-semibold hover:bg-white hover:text-[#388E3C]"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-[#222] py-8 text-white">
      <div className="container mx-auto px-5 text-center">
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} AddisFarmers.org. Connecting Ethiopian farmers directly to urban markets.
        </p>
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-300">
          
          <Link href="/register" className="hover:text-white">Register</Link>
          <Link href="/login" className="hover:text-white"> Login</Link>
        </div>
      </div>
    </footer>
  );
}

// ==========================================
// 4. HIGH CONTRAST SEARCH FORM
// ==========================================
function SearchForm({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
}: SearchFormProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      {/* Explicit bg-white and text-black prevents dark mode invisible text */}
      <input
        type="text"
        placeholder="Search produce..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white p-3 text-black placeholder-gray-500 outline-none focus:border-[#388E3C] focus:ring-1 focus:ring-[#388E3C] md:w-1/3"
      />

      <div className="flex flex-wrap gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border border-gray-300 bg-white p-3 text-black outline-none focus:border-[#388E3C]"
        >
          <option value="All" className="bg-white text-black">All Categories</option>
          <option value="Crops" className="bg-white text-black">Crops</option>
          <option value="Fruits" className="bg-white text-black">Fruits</option>
          <option value="Vegetables" className="bg-white text-black">Vegetables</option>
        </select>

        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="rounded-md border border-gray-300 bg-white p-3 text-black outline-none focus:border-[#388E3C]"
        >
          <option value="All" className="bg-white text-black">All Regions</option>
          <option value="Amhara" className="bg-white text-black">Amhara</option>
          <option value="Southern" className="bg-white text-black">Southern</option>
          <option value="Oromia" className="bg-white text-black">Oromia</option>
          <option value="Sidama" className="bg-white text-black">Sidama</option>
        </select>
      </div>
    </div>
  );
}

function FarmCard({ product }: { product: Product }) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderData, setOrderData] = useState({
    quantity: 1,
    unit: 'kg',
    phone: '',
    address: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    setError('');
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to place an order');
      window.location.href = '/login';
      return;
    }

    // Validate
    if (!orderData.phone || !orderData.address) {
      setError('Please fill in all required fields');
      return;
    }

    if (orderData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          crop_id: product.id,
          quantity: orderData.quantity,
          unit: orderData.unit,
          buyer_phone: orderData.phone,
          delivery_address: orderData.address,
          notes: orderData.notes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to place order');
      }

      const data = await response.json();
      alert('Order placed successfully! You can track your order in your profile.');
      setShowOrderModal(false);
      setOrderData({ quantity: 1, unit: 'kg', phone: '', address: '', notes: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white text-black shadow-md transition-shadow hover:shadow-lg">
        <div className="relative h-48 w-full bg-gray-200">
          <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
        </div>
        <div className="p-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-[#388E3C]">
              {product.category}
            </span>
            <span className="text-xs text-gray-500">{product.location}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
          <p className="mt-1 text-sm text-gray-600">Farmer: {product.farmer}</p>
          <p className="mt-3 text-lg font-bold text-[#388E3C]">{product.price}</p>
          <button 
            onClick={() => setShowOrderModal(true)}
            className="mt-4 w-full rounded-md bg-[#A7C957] py-2 text-sm font-bold text-white transition-colors hover:bg-[#388E3C]"
          >
            Place Order
          </button>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Place Order</h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3">
              <div className="font-semibold text-gray-900">{product.title}</div>
              <div className="text-sm text-gray-600">Farmer: {product.farmer}</div>
              <div className="text-sm text-gray-600">Location: {product.location}</div>
              <div className="text-lg font-bold text-[#388E3C] mt-1">{product.price}</div>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={orderData.quantity}
                    onChange={(e) => setOrderData({ ...orderData, quantity: parseFloat(e.target.value) || 0 })}
                    className="flex-1 rounded-md border border-gray-300 p-2 text-black outline-none focus:border-[#388E3C]"
                  />
                  <select
                    value={orderData.unit}
                    onChange={(e) => setOrderData({ ...orderData, unit: e.target.value })}
                    className="rounded-md border border-gray-300 p-2 text-black outline-none focus:border-[#388E3C]"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="ton">ton</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={orderData.phone}
                  onChange={(e) => setOrderData({ ...orderData, phone: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
                  placeholder="+251 9..."
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={orderData.address}
                  onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
                  placeholder="Enter your delivery address"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-800">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={orderData.notes}
                  onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2 text-black placeholder-gray-400 outline-none focus:border-[#388E3C]"
                  placeholder="Any special instructions..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 rounded-md border-2 border-gray-300 py-2 font-bold text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="flex-1 rounded-md bg-[#388E3C] py-2 font-bold text-white transition-colors hover:bg-[#2e7d32] disabled:bg-gray-400"
                >
                  {submitting ? 'Placing...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize from URL parameters on mount
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || '';
    const locationFromUrl = searchParams.get('location') || '';
    
    // Combine search and location into the search field for better filtering
    if (searchFromUrl && locationFromUrl) {
      setSearch(`${searchFromUrl} ${locationFromUrl}`);
    } else if (searchFromUrl) {
      setSearch(searchFromUrl);
    } else if (locationFromUrl) {
      setSearch(locationFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedLocation]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getMarketplaceProducts(search, selectedCategory, selectedLocation);
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products;

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9] font-sans text-gray-900">
      <Navbar />

      <main className="container mx-auto flex-1 px-5 py-8">
        <h1 className="mb-6 text-3xl font-bold text-[#388E3C]">Agricultural Marketplace</h1>

        <SearchForm
          search={search}
          setSearch={setSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              No products found. Try adjusting your filters.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <FarmCard key={product.id} product={product} />
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
        <div className="container mx-auto flex-1 px-5 py-8">
          <div className="py-12 text-center text-gray-500">Loading...</div>
        </div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CropProduct {
  id: number | string;
  title: string;
  farmer: string;
  location: string;
  imageUrl?: string;
  status?: string;
}

interface Stats {
  total_farmers: number;
  total_users: number;
  total_crops: number;
}

export default function HomePage() {
  const [filteredProducts, setFilteredProducts] = useState<CropProduct[]>([]);
  const [stats, setStats] = useState<Stats>({ total_farmers: 0, total_users: 0, total_crops: 0 });
  const [loading, setLoading] = useState(true);
  const [searchItem, setSearchItem] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const router = useRouter();

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://next-js-1st-1.onrender.com/api/v1';

        // Fetch products via public API endpoint
        const productsRes = await fetch(`${apiUrl}/products`);
        if (productsRes.ok) {
          const products = await productsRes.json();
          if (Array.isArray(products)) {
            // Show only the last 3 added products
            setFilteredProducts(products.slice(0, 3));
          }
        }

        // Fetch stats via public API endpoint
        const statsRes = await fetch(`${apiUrl}/public/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query params and redirect to marketplace
    const params = new URLSearchParams();
    if (searchItem) params.append('search', searchItem);
    if (searchLocation) params.append('location', searchLocation);
    
    router.push(`/marketplace?${params.toString()}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserName('');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header Section */}
      <header className="relative min-h-[500px] overflow-hidden bg-[#388E3C] pb-24 text-gray-900">
        {/* Full-bleed Header Background Image */}
        <Image
          src="/images/main.jpg"
          alt="Header Background"
          fill
          priority
          className="object-cover"
        />

        {/* Full-bleed Dark Overlay for Contrast */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Foreground Header Content */}
        <div className="container relative z-10 mx-auto px-5">
          {/* Navbar */}
          <nav className="flex items-center justify-between py-5">
            <div className="text-3xl font-bold text-white">
              <Link href="/">
                AddisFarmers<span className="text-[#A7C957]">.org</span>
              </Link>
            </div>
            <div className="flex items-center gap-5">
              <Link
                href="/marketplace"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:text-[#A7C957]"
              >
                Marketplace
              </Link>
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm text-white md:inline">Hello, {userName}</span>
                  <button
                    onClick={handleLogout}
                    className="rounded-md border-2 border-white px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600 hover:border-red-600"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-md border-2 border-white px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#388E3C]"
                >
                  Log In
                </Link>
              )}
            </div>
          </nav>

          {/* Hero Content */}
          <div className="pt-[10vh] text-center">
            <h1 className="mx-auto max-w-[800px] rounded-lg bg-[#5AA15A]/90 px-4 py-2 text-4xl font-bold text-white backdrop-blur-sm md:text-6xl">
              From farmers to City market
            </h1>
            <p className="my-3 text-xl font-bold text-white drop-shadow-[1px_1px_2px_rgba(0,0,0,1)]">
              Direct, Fair & Transparent
            </p>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="mx-auto flex max-w-[800px] flex-col gap-2 rounded-lg bg-white p-2.5 shadow-lg md:flex-row md:gap-1"
            >
              <input
                type="text"
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                placeholder="Enter Product..."
                className="flex-grow rounded border border-gray-200 px-4 py-3 text-base text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#388E3C]"
              />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Enter Location..."
                className="flex-grow rounded border border-gray-200 px-4 py-3 text-base text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#388E3C]"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded bg-[#A7C957] px-6 py-3 text-base font-bold text-white transition-colors hover:bg-[#388E3C]"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </header>

      <main>
        {/* Impact & Intro Section */}
        <section className="py-16 text-center">
          <div className="container mx-auto px-5">
            <h2 className="mb-2 text-3xl font-bold text-[#388E3C] md:text-4xl">
              Farm Food Markets From All Over Ethiopia
            </h2>
            <p className="mx-auto mb-12 max-w-[800px] text-gray-600">
              AddisFarmers allows you to buy crops, fruits and vegetables directly from farmers and use produce that is as fresh as possible...
            </p>

            <div className="mb-12 flex flex-row justify-around text-center">
              <div>
                <h3 className="text-2xl font-bold text-[#388E3C]">2</h3>
                <p className="text-sm text-gray-600">Number of Branches</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#388E3C]">
                  {loading ? '...' : stats.total_farmers}
                </h3>
                <p className="text-sm text-gray-600">Farmers</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#388E3C]">
                  {loading ? '...' : stats.total_crops}
                </h3>
                <p className="text-sm text-gray-600">Products</p>
              </div>
            </div>

            <Link
              href="/marketplace"
              className="inline-block rounded bg-[#A7C957] px-6 py-3 font-bold text-white transition-colors hover:bg-[#388E3C]"
            >
              Find products in Marketplace
            </Link>
          </div>
        </section>

        {/* Products We Provide Section */}
        <section className="bg-[#f5f5f5] py-16">
          <div className="container mx-auto px-5">
            <h2 className="mb-8 text-3xl font-bold text-[#388E3C] md:text-4xl">
              Products we provide
            </h2>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="col-span-full py-8 text-center text-gray-500">
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-8 text-center text-gray-500">
                  No products available yet
                </div>
              ) : (
                filteredProducts.map((farm) => (
                  <div
                    key={farm.id}
                    className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
                  >
                    <div className="relative h-48 w-full bg-gray-100">
                      <Image
                        src={farm.imageUrl || '/images/ll.jpg'}
                        alt={farm.title || 'Crop Image'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900">{farm.title}</h3>
                      <p className="text-gray-600">{farm.location}</p>
                      <p className="mt-2 font-medium text-[#388E3C]">By: {farm.farmer}</p>
                      {farm.status && (
                        <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          {farm.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Join CTA Section */}
        <section className="py-16 text-center">
          <div className="container mx-auto px-5">
            <h2 className="mb-8 text-3xl font-bold text-[#388E3C] md:text-4xl">
              Healthy Food - Healthy Family
            </h2>
            <div className="flex flex-col justify-around gap-8 md:flex-row">
              {/* Buyer Card */}
              <div className="flex-1 rounded-lg bg-white p-8 shadow-md">
                <h3 className="mb-4 text-2xl font-bold text-[#388E3C]">Join as a Buyer</h3>
                <ul className="mb-6 ml-6 list-disc text-left text-gray-600">
                  <li>All Products from Local Farmers</li>
                  <li>Superior Food Quality</li>
                  <li>Money Saving</li>
                </ul>
              </div>

              {/* Farmer Card */}
              <div className="flex-1 rounded-lg bg-white p-8 shadow-md">
                <h3 className="mb-4 text-2xl font-bold text-[#388E3C]">Join as a Farmer</h3>
                <ul className="mb-6 ml-6 list-disc text-left text-gray-600">
                  <li>Increased Direct Sales</li>
                  <li>Enable Pre-Orders</li>
                  <li>Get what you deserve</li>
                </ul>
              </div>
            </div>
          </div>
          <Link
            href="/login"
            className="mt-8 inline-block rounded bg-[#A7C957] px-6 py-3 font-bold text-white transition-colors hover:bg-[#388E3C]"
          >
            Join Us Today!
          </Link>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-[#222] py-12 text-white/80">
        <div className="container mx-auto px-5">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            <div className="flex-1">
              <h4 className="mb-4 text-lg font-bold text-white">About</h4>
              <p className="text-sm text-white/70">
                AddisFarmers vision is to put farmers in their deserved place...
              </p>
            </div>

            <div className="flex-1">
              <h4 className="mb-4 text-lg font-bold text-white">Resources</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-[#A7C957]">Communities</Link></li>
                <li><Link href="#" className="hover:text-[#A7C957]">Suppliers</Link></li>
                <li><Link href="#" className="hover:text-[#A7C957]">Blog</Link></li>
              </ul>
            </div>

            <div className="flex-1">
              <h4 className="mb-4 text-lg font-bold text-white">Contacts</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-[#A7C957]">Terms of Use</Link></li>
                <li><Link href="#" className="hover:text-[#A7C957]">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/60">
            &copy; 2026 All rights reserved AddisFarmers.org
          </div>
        </div>
      </footer>
    </div>
  );
}
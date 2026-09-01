const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://next-js-1st-1.onrender.com/api/v1';

export interface CropProduct {
  id: number;
  title: string;
  category: string;
  location: string;
  price: string;
  farmer: string;
  imageUrl: string;
  status: 'Active' | 'Pending';
}

export interface CropPayload {
  name: string;
  farmer: string;
  location: string;
  category?: string;
  price?: string;
  imageUrl?: string;
  status?: 'Active' | 'Pending';
}

// Fetch Marketplace Products (Supports Dynamic Filtering)
export async function getMarketplaceProducts(
  search = '',
  category = 'All',
  location = 'All'
): Promise<CropProduct[]> {
  const query = new URLSearchParams();
  if (search.trim()) query.append('search', search.trim());
  if (category !== 'All') query.append('category', category);
  if (location !== 'All') query.append('location', location);

  const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch marketplace products');
  return res.json();
}

// Fetch Admin Crops List
export async function getAdminCrops(): Promise<CropProduct[]> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const res = await fetch(`${API_BASE_URL}/admin/crops`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch admin crops');
  return res.json();
}

// Create New Crop Listing
export async function createCrop(payload: CropPayload): Promise<CropProduct> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const res = await fetch(`${API_BASE_URL}/admin/crops`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to create crop');
  return res.json();
}

// Update Existing Crop Listing
export async function updateCrop(id: number, payload: CropPayload): Promise<CropProduct> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const res = await fetch(`${API_BASE_URL}/admin/crops/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to update crop');
  return res.json();
}

// Delete Crop Listing
export async function deleteCrop(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/crops/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error('Failed to delete crop');
  return res.json();
}
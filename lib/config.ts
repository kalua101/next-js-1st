// API Configuration
// This is safe to be public - it's just the backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://next-js-1st-1.onrender.com/api/v1';

export default API_URL;

// For development, you can override this in .env.local with:
// NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1

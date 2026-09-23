/**
 * Grocery Choice Customer API Service
 * Centralized REST client connecting to Spring Boot backend.
 */

const RAW_API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:8080';

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

/**
 * Standard fetch wrapper with standardized error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('grocery_choice_token') : null;
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    if (!res.ok) {
      let errorMessage = `Server error (${res.status})`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const text = await res.text();
        if (text) errorMessage = text;
      }
      const err = new Error(errorMessage);
      err.status = res.status;
      throw err;
    }

    if (res.status === 204) {
      return null;
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to Grocery Choice server.');
    }
    throw err;
  }
}

/**
 * Category REST endpoints
 */
export const categoryApi = {
  // GET /api/categories (returns active categories)
  getAll: async () => {
    const data = await request('/api/categories');
    return (Array.isArray(data) ? data : []).map(normalizeCategory);
  },

  // GET /api/categories/{id}
  getById: async (id) => {
    const data = await request(`/api/categories/${id}`);
    return normalizeCategory(data);
  }
};

/**
 * Product REST endpoints
 */
export const productApi = {
  // GET /api/products (returns active products)
  getAll: async () => {
    const data = await request('/api/products');
    return (Array.isArray(data) ? data : []).map(normalizeProduct);
  },

  // GET /api/products/{id}
  getById: async (id) => {
    const data = await request(`/api/products/${id}`);
    return normalizeProduct(data);
  },

  // GET /api/products/category/{categoryId}
  getByCategory: async (categoryId) => {
    const data = await request(`/api/products/category/${categoryId}`);
    return (Array.isArray(data) ? data : []).map(normalizeProduct);
  },

  // GET /api/products/search?query={query}
  search: async (query) => {
    const data = await request(`/api/products/search?query=${encodeURIComponent(query)}`);
    return (Array.isArray(data) ? data : []).map(normalizeProduct);
  }
};

/**
 * Authentication & OTP REST endpoints
 */
export const authApi = {
  // POST /api/auth/send-otp
  sendOtp: async (identifier, purpose = 'LOGIN') => {
    return await request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, purpose })
    });
  },

  // POST /api/auth/verify-otp
  verifyOtp: async (identifier, otp, name = '') => {
    return await request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp, name })
    });
  },

  // GET /api/auth/me
  getProfile: async () => {
    return await request('/api/auth/me');
  },

  // GET /api/auth/dev-otp/{identifier} (Dev/Testing only)
  getDevOtp: async (identifier) => {
    return await request(`/api/auth/dev-otp/${encodeURIComponent(identifier)}`);
  }
};

/**
 * Customer Address REST endpoints
 */
export const addressApi = {
  // GET /api/addresses
  getAll: async () => {
    const data = await request('/api/addresses');
    return Array.isArray(data) ? data : [];
  },

  // GET /api/addresses/{id}
  getById: async (id) => {
    return await request(`/api/addresses/${id}`);
  },

  // POST /api/addresses
  create: async (addressPayload) => {
    return await request('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(addressPayload)
    });
  },

  // PUT /api/addresses/{id}
  update: async (id, addressPayload) => {
    return await request(`/api/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(addressPayload)
    });
  },

  // DELETE /api/addresses/{id}
  delete: async (id) => {
    return await request(`/api/addresses/${id}`, {
      method: 'DELETE'
    });
  },

  // PATCH /api/addresses/{id}/default
  setDefault: async (id) => {
    return await request(`/api/addresses/${id}/default`, {
      method: 'PATCH'
    });
  }
};

/**
 * Order REST endpoints
 */
export const orderApi = {
  // POST /api/orders
  create: async (orderPayload) => {
    return await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
  },

  // GET /api/orders/my-orders
  getMyOrders: async () => {
    const data = await request('/api/orders/my-orders');
    return Array.isArray(data) ? data : [];
  },

  // GET /api/orders/{id}
  getById: async (id) => {
    return await request(`/api/orders/${id}`);
  },

  // GET /api/orders/number/{orderNumber}
  getByNumber: async (orderNumber) => {
    return await request(`/api/orders/number/${encodeURIComponent(orderNumber)}`);
  },

  // GET /api/orders/customer/{customerId}
  getByCustomerId: async (customerId = 1) => {
    const data = await request(`/api/orders/customer/${customerId}`);
    return Array.isArray(data) ? data : [];
  },

  // POST /api/orders/{id}/cancel
  cancel: async (id) => {
    return await request(`/api/orders/${id}/cancel`, {
      method: 'POST'
    });
  }
};

/**
 * Payment Gateway (Razorpay Test Mode) REST endpoints
 */
export const paymentApi = {
  // POST /api/payments/create-order
  createOrder: async (orderId) => {
    return await request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });
  },

  // POST /api/payments/verify
  verifyPayment: async ({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    return await request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
      })
    });
  }
};


/**
 * Normalizes product record from backend into Customer UI compatible model
 */
export function normalizeProduct(p) {
  if (!p) return null;

  const stockQuantity = p.stockQuantity !== undefined && p.stockQuantity !== null ? Number(p.stockQuantity) : 0;
  const isAvailable = p.active !== false && stockQuantity > 0;
  const stockStatus = isAvailable
    ? stockQuantity <= 10
      ? 'low_stock'
      : 'in_stock'
    : 'out_of_stock';

  const mrp = p.mrp !== undefined && p.mrp !== null ? Number(p.mrp) : 0;
  const sellingPrice = p.sellingPrice !== undefined && p.sellingPrice !== null ? Number(p.sellingPrice) : mrp;
  const discountPercentage = mrp > sellingPrice && mrp > 0
    ? Math.round(((mrp - sellingPrice) / mrp) * 100)
    : 0;

  const categoryId =
    p.categoryId !== undefined && p.categoryId !== null
      ? p.categoryId
      : (typeof p.category === 'object' && p.category?.id !== undefined ? p.category.id : null);

  const rawCatName =
    (typeof p.category === 'object' && p.category?.name)
      ? p.category.name
      : (p.categoryName || (typeof p.category === 'string' && p.category !== 'general' ? p.category : 'General'));

  const categoryName = rawCatName || 'General';
  const categorySlug =
    p.categorySlug ||
    categoryName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-');

  return {
    ...p,
    id: p.id,
    name: p.name,
    description: p.description || '',
    sku: p.sku || '',
    category: categorySlug,
    categoryId,
    categoryName,
    categorySlug,
    unit: p.unit || 'PIECE',
    mrp,
    sellingPrice,
    price: sellingPrice,
    originalPrice: mrp,
    discountPrice: sellingPrice,
    discountPercentage,
    stockQuantity,
    stockCount: stockQuantity,
    stockStatus,
    inStock: isAvailable,
    active: p.active !== false,
    image: p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    imageUrl: p.imageUrl || '',
    rating: p.rating || 4.8,
    reviewCount: p.reviewCount || 42,
    isPopular: true,
    isDeal: discountPercentage > 0,
    isHousehold: categorySlug.includes('household') || categorySlug.includes('clean')
  };
}


/**
 * Normalizes category record from backend into Customer UI compatible model
 */
export function normalizeCategory(c) {
  if (!c) return null;

  const slug = c.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');

  return {
    ...c,
    id: c.id,
    name: c.name,
    shortName: c.name.split('&')[0].trim(),
    description: c.description || '',
    image: c.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    imageUrl: c.imageUrl || '',
    active: c.active !== false,
    slug,
    itemCount: 'Catalog items'
  };
}

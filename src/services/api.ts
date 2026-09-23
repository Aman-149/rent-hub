const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('renthub_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (data: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (data: any) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: any) => apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data: any) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),

  // Properties
  getProperties: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString();
    return apiRequest(`/properties${query ? `?${query}` : ''}`);
  },
  getProperty: (id: string) => apiRequest(`/properties/${id}`),
  getPopularLocations: () => apiRequest('/properties/locations'),
  getMyListings: () => apiRequest('/properties/my-listings'),
  createProperty: (data: any) => apiRequest('/properties', { method: 'POST', body: JSON.stringify(data) }),
  updateProperty: (id: string, data: any) => apiRequest(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProperty: (id: string) => apiRequest(`/properties/${id}`, { method: 'DELETE' }),
  updatePropertyStatus: (id: string, status: string) =>
    apiRequest(`/properties/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Favorites
  getFavorites: () => apiRequest('/favorites'),
  toggleFavorite: (propertyId: string) => apiRequest(`/favorites/${propertyId}`, { method: 'POST' }),
  removeFavorite: (propertyId: string) => apiRequest(`/favorites/${propertyId}`, { method: 'DELETE' }),

  // Conversations & Messages
  getConversations: () => apiRequest('/conversations'),
  startConversation: (data: { landlordId: string; propertyId?: string; initialMessage?: string }) =>
    apiRequest('/conversations/start', { method: 'POST', body: JSON.stringify(data) }),
  getMessages: (conversationId: string) => apiRequest(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    apiRequest(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Inquiries
  getInquiries: () => apiRequest('/inquiries'),
  createInquiry: (data: any) => apiRequest('/inquiries', { method: 'POST', body: JSON.stringify(data) }),
  updateInquiry: (id: string, data: any) => apiRequest(`/inquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Reports
  createReport: (data: any) => apiRequest('/reports', { method: 'POST', body: JSON.stringify(data) }),
  getAdminReports: () => apiRequest('/reports/admin'),
  updateAdminReport: (id: string, data: any) => apiRequest(`/reports/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Admin
  getAdminStats: () => apiRequest('/admin/stats'),
  getAdminUsers: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${q ? `?${q}` : ''}`);
  },
  updateUserStatus: (id: string, status: string) =>
    apiRequest(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAdminProperties: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/properties${q ? `?${q}` : ''}`);
  },
  adminUpdatePropertyStatus: (id: string, data: any) =>
    apiRequest(`/admin/properties/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteProperty: (id: string) => apiRequest(`/admin/properties/${id}`, { method: 'DELETE' }),

  // Stats
  getLandlordStats: () => apiRequest('/stats/landlord'),
  getRenterStats: () => apiRequest('/stats/renter'),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),

  // Media
  getPresetImages: () => apiRequest('/media/preset-images'),
  uploadImage: (imageBase64: string, filename?: string) =>
    apiRequest('/media/upload', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, filename })
    }),

  // Reviews
  getPropertyReviews: (propertyId: string) => apiRequest(`/properties/${propertyId}/reviews`),
  createPropertyReview: (propertyId: string, data: { rating: number; comment: string }) =>
    apiRequest(`/properties/${propertyId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Database Management & Health
  getHealth: () => apiRequest('/health'),
  getDatabaseStatus: () => apiRequest('/admin/database/status'),
  exportDatabase: () => apiRequest('/admin/database/export'),
  importDatabase: (data: any) =>
    apiRequest('/admin/database/import', {
      method: 'POST',
      body: JSON.stringify({ data })
    }),
  clearDatabase: () =>
    apiRequest('/admin/database/clear', {
      method: 'POST'
    }),
  getDatabaseSchema: () => apiRequest('/admin/database/schema')
};

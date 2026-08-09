import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Store, RefreshCw, AlertTriangle, CheckCircle, X, LogOut } from 'lucide-react';
import StatsOverview from './components/StatsOverview';
import ItemForm from './components/ItemForm';
import InventoryTable from './components/InventoryTable';
import { supabase } from './supabaseClient';
import ProtectedRoute from './components/ProtectedRoute';

const API_BASE_URL = 'http://localhost:8000/api';

const App = () => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total_items: 0,
    low_stock_count: 0,
    total_valuation: 0.0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }
  const [backendConnected, setBackendConnected] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  // Auth listener
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        fetchRole(session.user.id, session.user.email);
      } else {
        setAuthLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchRole(session.user.id, session.user.email);
      } else {
        setUserRole(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (!error && data?.role) {
        setUserRole(data.role);
      } else if (userEmail === 'demo@solaris.com' || userEmail === 'demo@grovio.com') {
        setUserRole('admin');
      }
    } catch (err) {
      console.error('Error fetching role:', err);
      if (userEmail === 'demo@solaris.com' || userEmail === 'demo@grovio.com') {
        setUserRole('admin');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Add axios interceptor to attach JWT
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (session?.access_token) {
          config.headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [session]);

  // Toast notification helper
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check backend connection status
  const checkBackendConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory`, {
        timeout: 5000 // 5 second timeout
      });
      setBackendConnected(true);
      setConnectionError(null);
      return true;
    } catch (err) {
      console.error('Backend connection check failed:', err);

      // Determine specific error type
      let errorMessage = 'Failed to connect to backend server.';
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Connection to backend timed out. Please check if the backend server is running.';
      } else if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.detail || `Backend error: ${err.response.status}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from backend server. Please check if the backend is running.';
      } else {
        // Other errors (network issues, etc.)
        errorMessage = 'Network error: Could not connect to backend server.';
      }

      setBackendConnected(false);
      setConnectionError(errorMessage);
      return false;
    }
  };

  // Fetch inventory list & stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // First check if backend is connected
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        throw new Error(connectionError || 'Backend connection failed');
      }

      const [itemsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/inventory`),
        axios.get(`${API_BASE_URL}/inventory/stats`),
      ]);
      setItems(itemsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('API Fetch error:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Failed to connect to backend server.';
      showToast('error', errMsg);
    } finally {
      setLoading(false);
    }
  }, [connectionError]);

  // Initial data fetch and connection check
  useEffect(() => {
    fetchData();

    // Set up periodic connection check
    const connectionCheckInterval = setInterval(() => {
      checkBackendConnection();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(connectionCheckInterval);
  }, [fetchData]);

  // Add / Update item handler
  const handleSubmitItem = async (payload, id, resetFormCallback) => {
    // Check connection before attempting to submit
    const isConnected = await checkBackendConnection();
    if (!isConnected) {
      showToast('error', connectionError || 'Cannot submit: Backend is not connected');
      return;
    }

    setSubmitting(true);
    try {
      if (id) {
        // Update existing item
        await axios.put(`${API_BASE_URL}/inventory/${id}`, {
          name: payload.name,
          quantity: payload.quantity,
          price: payload.price,
          category: payload.category,
        });
        showToast('success', `Item "${payload.name}" updated successfully.`);
        setEditingItem(null);
      } else {
        // Create new item
        await axios.post(`${API_BASE_URL}/inventory`, payload);
        showToast('success', `Item "${payload.name}" created successfully.`);
        resetFormCallback();
      }
      // Refresh inventory & stats
      await fetchData();
    } catch (err) {
      console.error('Item Save Error:', err);
      const errMsg = err.response?.data?.detail || 'An unexpected error occurred while saving.';
      showToast('error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete item handler
  const handleDeleteItem = async (itemId) => {
    // Check connection before attempting to delete
    const isConnected = await checkBackendConnection();
    if (!isConnected) {
      showToast('error', connectionError || 'Cannot delete: Backend is not connected');
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/inventory/${itemId}`);
      showToast('success', 'Inventory item deleted successfully.');
      if (editingItem && editingItem.id === itemId) {
        setEditingItem(null);
      }
      await fetchData();
    } catch (err) {
      console.error('Delete Error:', err);
      const errMsg = err.response?.data?.detail || 'Failed to delete inventory item.';
      showToast('error', errMsg);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  return (
    <ProtectedRoute session={session} userRole={userRole}>
      <div className="min-h-screen bg-white text-slate-900 flex flex-col">
        {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-bounce-short">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-50/90 border-red-300/50 text-red-800'
                : 'bg-emerald-50/90 border-emerald-300/50 text-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <p className="text-sm font-medium pr-2">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="text-slate-500 hover:text-slate-700 p-0.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Backend Connection Error Banner */}
      {!backendConnected && connectionError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border-2 border-red-300 bg-red-50/95 backdrop-blur-md">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Backend Connection Error</p>
              <p className="text-xs text-red-700 mt-0.5">{connectionError}</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 transition-all duration-150 disabled:opacity-50"
              title="Retry Connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
            <button
              onClick={() => setConnectionError(null)}
              className="text-red-500 hover:text-red-700 p-0.5 rounded-lg ml-1"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-slate-200 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-300/30 text-indigo-600">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Grovio Portal
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Real-time inventory management & operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all duration-150 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all duration-150"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Dashboard Stats Bar */}
        <StatsOverview stats={stats} loading={loading} />

        {/* 2-Column Responsive Layout (Left: Form, Right: Inventory Table) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form (4 cols desktop) */}
          <div className="lg:col-span-4">
            <ItemForm
              onSubmit={handleSubmitItem}
              editingItem={editingItem}
              onCancelEdit={() => setEditingItem(null)}
              submitting={submitting}
              backendConnected={backendConnected}
            />
          </div>

          {/* Right Column: Inventory Table (8 cols desktop) */}
          <div className="lg:col-span-8">
            <InventoryTable
              items={items}
              loading={loading}
              onEditItem={(item) => setEditingItem(item)}
              onDeleteItem={handleDeleteItem}
              editingItemId={editingItem?.id}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100/60 border-t border-slate-200/80 py-4 text-center text-xs text-slate-600">
        <p>Built with FastAPI, asyncpg, Supabase PostgreSQL, and React + Tailwind CSS</p>
      </footer>
    </div>
    </ProtectedRoute>
  );
};

export default App;

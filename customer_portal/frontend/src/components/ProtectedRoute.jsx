import React from 'react';
import LoginPage from './LoginPage';
import { AlertOctagon, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ProtectedRoute = ({ children, session, userRole }) => {
  if (!session) {
    return <LoginPage />;
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-white shadow-xl shadow-slate-200/50 rounded-3xl p-8 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-8">
            You do not have the required administrator privileges to access this dashboard.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

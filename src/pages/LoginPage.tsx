import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Mail, Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../store/authContext';
import { useToast } from '../components/common/Toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, quickLogin, isLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const u = await login(email, password);
      showToast(`Welcome back, ${u.name}!`, 'success');
      if (u.role === 'landlord') navigate('/dashboard/landlord');
      else if (u.role === 'admin') navigate('/dashboard/admin');
      else navigate('/dashboard/renter');
    } catch (err: any) {
      showToast(err.message || 'Invalid email or password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuick = async (role: 'landlord' | 'renter' | 'admin') => {
    try {
      const u = await quickLogin(role);
      showToast(`Logged in as ${u.name} (${u.role.toUpperCase()})`, 'success');
      if (u.role === 'landlord') navigate('/dashboard/landlord');
      else if (u.role === 'admin') navigate('/dashboard/admin');
      else navigate('/dashboard/renter');
    } catch (err: any) {
      showToast(err.message || 'Demo login failed', 'error');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50/50">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-zinc-900 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <span>
              Rent<span className="text-emerald-600">Hub</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-zinc-900">Sign in to your account</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Access your saved houses, direct messages, and listings.
          </p>
        </div>

        {/* Demo Fast Logins */}
        <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>1-Click Demo Login</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="demo-login-landlord"
              type="button"
              onClick={() => handleQuick('landlord')}
              className="py-1.5 px-2 bg-white text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 shadow-sm hover:bg-emerald-100 transition-colors"
            >
              Landlord
            </button>
            <button
              id="demo-login-renter"
              type="button"
              onClick={() => handleQuick('renter')}
              className="py-1.5 px-2 bg-white text-sky-800 text-[11px] font-bold rounded-lg border border-sky-200 shadow-sm hover:bg-sky-50 transition-colors"
            >
              Renter
            </button>
            <button
              id="demo-login-admin"
              type="button"
              onClick={() => handleQuick('admin')}
              className="py-1.5 px-2 bg-white text-purple-800 text-[11px] font-bold rounded-lg border border-purple-200 shadow-sm hover:bg-purple-50 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-emerald-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  required
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-emerald-700 hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

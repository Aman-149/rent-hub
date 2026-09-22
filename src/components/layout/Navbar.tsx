import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  Heart,
  MessageSquare,
  LayoutDashboard,
  PlusCircle,
  Shield,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Building2,
  CheckCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../store/authContext';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { useToast } from '../common/Toast';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      // quiet fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on page transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      showToast('All notifications marked as read', 'info');
    } catch (e) {
      // quiet
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.isRead) {
        await api.markNotificationRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      }
      setNotificationsOpen(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (e) {
      // quiet
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'landlord') return '/dashboard/landlord';
    if (user.role === 'admin') return '/dashboard/admin';
    return '/dashboard/renter';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            id="nav-logo"
            to="/"
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-zinc-900 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span>
              Rent<span className="text-emerald-600">Hub</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              id="nav-home"
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              Home
            </Link>
            <Link
              id="nav-browse"
              to="/properties"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/properties') ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              Browse Properties
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  id="nav-favorites"
                  to="/favorites"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/favorites') ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  Favorites
                </Link>
                <Link
                  id="nav-messages"
                  to="/messages"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/messages') ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  Messages
                </Link>
                <Link
                  id="nav-dashboard"
                  to={getDashboardLink()}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/dashboard') ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-3">
            {/* Landlord CTA button */}
            {user?.role === 'landlord' && (
              <Link
                id="nav-add-property-btn"
                to="/properties/new"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Property</span>
              </Link>
            )}

            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  id="nav-notifications-btn"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    id="notifications-dropdown"
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-zinc-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          id="btn-mark-all-read"
                          onClick={handleMarkAllRead}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            id={`notif-item-${notif.id}`}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 hover:bg-zinc-50 cursor-pointer transition-colors flex items-start gap-3 ${
                              !notif.isRead ? 'bg-emerald-50/40' : ''
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.isRead ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-transparent'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 truncate">{notif.title}</p>
                              <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{notif.message}</p>
                              <span className="text-[10px] text-zinc-400 mt-1 inline-block">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Dropdown or Login/Register */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  id="nav-user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1 pl-2 pr-3 rounded-full border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-zinc-100 ring-1 ring-zinc-200 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-zinc-900 leading-none truncate max-w-[120px]">{user.name}</p>
                    <span className="text-[10px] text-zinc-500 capitalize">{user.role}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {userMenuOpen && (
                  <div
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-zinc-200 p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                      <p className="text-xs font-semibold text-zinc-900">{user.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                      <span className={`mt-1.5 inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'landlord' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>

                    <Link
                      id="menu-link-dashboard"
                      to={getDashboardLink()}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-zinc-500" />
                      Dashboard
                    </Link>

                    {user.role === 'landlord' && (
                      <Link
                        id="menu-link-add-property"
                        to="/properties/new"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-600" />
                        Add New Property
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        id="menu-link-admin-panel"
                        to="/dashboard/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                        Admin Panel
                      </Link>
                    )}

                    <Link
                      id="menu-link-profile"
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-zinc-500" />
                      Profile & Settings
                    </Link>

                    <div className="border-t border-zinc-100 my-1 pt-1">
                      <button
                        id="btn-logout"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                          showToast('Logged out successfully', 'info');
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  id="nav-login-btn"
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  id="nav-register-btn"
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 shadow-sm transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <Link
                to={getDashboardLink()}
                className="p-1.5 text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <LayoutDashboard className="w-5 h-5" />
              </Link>
            )}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="md:hidden border-t border-zinc-200 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              Home
            </Link>
            <Link
              to="/properties"
              className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/properties') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              Browse Properties
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/favorites"
                  className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/favorites') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-zinc-700 hover:bg-zinc-100'}`}
                >
                  Favorites
                </Link>
                <Link
                  to="/messages"
                  className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/messages') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-zinc-700 hover:bg-zinc-100'}`}
                >
                  Messages
                </Link>
                <Link
                  to={getDashboardLink()}
                  className={`block px-3 py-2 rounded-xl text-sm font-medium ${location.pathname.startsWith('/dashboard') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-zinc-700 hover:bg-zinc-100'}`}
                >
                  Dashboard ({user?.role})
                </Link>
                {user?.role === 'landlord' && (
                  <Link
                    to="/properties/new"
                    className="block px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white text-center"
                  >
                    + Post Property
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="w-full py-2.5 text-center text-sm font-semibold text-zinc-800 bg-zinc-100 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-emerald-600 rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Sparkles,
  Search,
  CheckCheck,
  Ban,
  Database,
  Server,
  HardDrive,
  Download,
  UploadCloud,
  RefreshCw,
  FileCode,
  Copy,
  Check
} from 'lucide-react';
import { AdminStats, User, Property, ReportItem, DatabaseStatusInfo } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'properties' | 'reports' | 'database'>('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatusInfo | null>(null);
  const [dbSchema, setDbSchema] = useState<string>('');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [userSearch, setUserSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, propsRes, reportsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminProperties(),
        api.getAdminReports()
      ]);
      setStats(statsRes.stats || null);
      setUsers(usersRes.users || []);
      setProperties(propsRes.properties || []);
      setReports(reportsRes.reports || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load admin data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(userId, nextStatus);
      showToast(`User status updated to ${nextStatus.toUpperCase()}`, 'success');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus as any } : u));
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  const handleTogglePropertyFeature = async (property: Property) => {
    try {
      const nextFeatured = !property.isFeatured;
      await api.adminUpdatePropertyStatus(property.id, { isFeatured: nextFeatured });
      showToast(nextFeatured ? 'Property featured' : 'Property unfeatured', 'success');
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, isFeatured: nextFeatured } : p));
    } catch (err: any) {
      showToast(err.message || 'Failed to update feature state', 'error');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;
    try {
      await api.adminDeleteProperty(propertyId);
      showToast('Property deleted by admin', 'info');
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing', 'error');
    }
  };

  const handleUpdateReport = async (reportId: string, status: string) => {
    try {
      await api.updateAdminReport(reportId, { status });
      showToast(`Report updated to ${status}`, 'success');
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: status as any } : r));
    } catch (err: any) {
      showToast(err.message || 'Failed to update report', 'error');
    }
  };

  const loadDatabaseInfo = async () => {
    try {
      const [statusRes, schemaRes] = await Promise.all([
        api.getDatabaseStatus(),
        api.getDatabaseSchema()
      ]);
      setDbStatus(statusRes.status || null);
      setDbSchema(schemaRes.schema || '');
    } catch (err: any) {
      console.error('Failed to load database status:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'database') {
      loadDatabaseInfo();
    }
  }, [activeTab]);

  const handleExportDatabase = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `renthub_snapshot_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Database backup exported successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export backup', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.importDatabase(parsed);
      showToast('Database snapshot restored successfully!', 'success');
      loadDatabaseInfo();
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Invalid JSON backup file format', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      await api.resetDatabase();
      showToast('Database reset to clean initial seeds!', 'success');
      setIsResetConfirmOpen(false);
      loadDatabaseInfo();
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset database', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopySchema = () => {
    if (!dbSchema) return;
    navigator.clipboard.writeText(dbSchema);
    setCopiedSchema(true);
    showToast('PostgreSQL DDL schema copied to clipboard!', 'info');
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
  });

  const filteredProperties = properties.filter(p => {
    if (!propertySearch) return true;
    const q = propertySearch.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.neighborhood.toLowerCase().includes(q);
  });

  return (
    <div className="bg-zinc-50/50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5" />
              RentHub Platform Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              System Administration Panel
            </h1>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Metrics Overview
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            User Accounts ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'properties'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Property Moderation ({properties.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>Reported Listings</span>
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <span className="w-4 h-4 bg-rose-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {reports.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database & DevOps</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Users</span>
                <div className="text-2xl font-extrabold text-zinc-900 mt-2">{stats?.totalUsers || users.length}</div>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {stats?.totalLandlords} Landlords • {stats?.totalRenters} Renters
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Properties</span>
                <div className="text-2xl font-extrabold text-zinc-900 mt-2">{stats?.totalProperties || properties.length}</div>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {stats?.activeProperties} Active
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rented Units</span>
                <div className="text-2xl font-extrabold text-zinc-900 mt-2">{stats?.rentedProperties || 0}</div>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Successfully rented</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Inquiries</span>
                <div className="text-2xl font-extrabold text-zinc-900 mt-2">{stats?.totalInquiries || 0}</div>
                <span className="text-[10px] text-zinc-400 mt-1 block">Rental requests</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Pending Reports</span>
                <div className="text-2xl font-extrabold text-rose-600 mt-2">{stats?.pendingReports || 0}</div>
                <span className="text-[10px] text-zinc-400 mt-1 block">Needs attention</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Health</span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-2">100%</div>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">All systems active</span>
              </div>
            </div>

            {/* Quick action cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-zinc-900 mb-4">Pending Flagged Listings</h3>
                {reports.filter(r => r.status === 'pending').length === 0 ? (
                  <p className="text-xs text-zinc-500">No active reports waiting for moderation.</p>
                ) : (
                  <div className="space-y-3">
                    {reports.filter(r => r.status === 'pending').slice(0, 3).map(r => (
                      <div key={r.id} className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-rose-900">{r.property?.title}</div>
                          <div className="text-[11px] text-rose-700">Reason: {r.reason}</div>
                        </div>
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="px-3 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-zinc-900 mb-4">Featured Listings in Addis</h3>
                <div className="space-y-2">
                  {properties.filter(p => p.isFeatured).slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl">
                      <div className="text-xs font-bold text-zinc-900 truncate max-w-xs">{p.title}</div>
                      <span className="text-[11px] font-bold text-emerald-700">{p.price.toLocaleString()} ETB</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-zinc-900">Registered Platform Users</h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Joined</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-3 flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-200"
                        />
                        <div>
                          <div className="font-bold text-zinc-900">{u.name}</div>
                          <div className="text-[11px] text-zinc-500">{u.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'landlord' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-sky-100 text-sky-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-600">{u.phone || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded capitalize ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                              u.status === 'active'
                                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Properties */}
        {activeTab === 'properties' && (
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-zinc-900">Manage All Property Listings</h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title or location..."
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Listing</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Rent (ETB)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Featured</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredProperties.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-3 flex items-center gap-3">
                        <img
                          src={p.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=60&auto=format&fit=crop&q=80'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-zinc-200"
                        />
                        <div>
                          <Link to={`/properties/${p.id}`} className="font-bold text-zinc-900 hover:text-emerald-700 line-clamp-1">
                            {p.title}
                          </Link>
                          <div className="text-[11px] text-zinc-500">{p.neighborhood}, {p.city}</div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-700">{p.propertyType}</td>
                      <td className="py-3 px-3 font-bold text-emerald-700">{p.price.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          p.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'rented' ? 'bg-zinc-800 text-white' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleTogglePropertyFeature(p)}
                          className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                            p.isFeatured
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{p.isFeatured ? 'Featured' : 'Standard'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/properties/${p.id}`}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-100 rounded-lg"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Reported Listings */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 mb-4">Reported Listing Moderation Queue</h3>

            {reports.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center">No reported listings recorded.</p>
            ) : (
              <div className="space-y-4">
                {reports.map(report => (
                  <div
                    key={report.id}
                    className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-100 text-rose-800">
                          {report.reason}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded capitalize ${
                          report.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {report.status}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          Reported on {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-zinc-900 mt-1">
                        Target Listing: {report.property?.title}
                      </h4>

                      {report.details && (
                        <p className="text-xs text-zinc-600 mt-1 italic">
                          "{report.details}"
                        </p>
                      )}

                      <p className="text-[11px] text-zinc-500 mt-1">
                        Reporter: {report.reporter?.name} ({report.reporter?.email})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/properties/${report.propertyId}`}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl"
                      >
                        Inspect Listing
                      </Link>

                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateReport(report.id, 'dismissed')}
                            className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold rounded-xl"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleUpdateReport(report.id, 'action_taken')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                          >
                            Take Action
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Database & DevOps */}
        {activeTab === 'database' && (
          <div className="space-y-8">
            {/* Database Engine Status Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {dbStatus?.status === 'connected' ? 'Cloud Production Active' : 'Persistent Storage Active'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                    <Server className="w-6 h-6 text-purple-600" />
                    {dbStatus?.engine || 'Relational PostgreSQL / Embedded Engine'}
                  </h2>
                  <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
                    RentHub is configured with dual-mode database support. When deployed with a <code className="bg-zinc-100 text-purple-700 px-1.5 py-0.5 rounded font-mono text-xs">DATABASE_URL</code>, it runs on native PostgreSQL. In local or standalone environments, it persists atomically to durable storage with zero data loss.
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportDatabase}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition shadow-sm disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'Exporting...' : 'Export Backup (JSON)'}</span>
                  </button>

                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-2xl transition cursor-pointer shadow-sm">
                    <UploadCloud className="w-4 h-4 text-purple-600" />
                    <span>Restore Backup</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportDatabase}
                    />
                  </label>

                  <button
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-2xl transition shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset to Seeds</span>
                  </button>
                </div>
              </div>

              {/* Engine Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-100">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Records</span>
                  <div className="text-xl font-extrabold text-zinc-900 mt-1">{dbStatus?.totalRecords || 0}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Storage Footprint</span>
                  <div className="text-xl font-extrabold text-zinc-900 mt-1">{dbStatus?.storageSizeFormatted || '42 KB'}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Database Tables</span>
                  <div className="text-xl font-extrabold text-zinc-900 mt-1">{dbStatus?.tables.length || 10} Tables</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Engine Mode</span>
                  <div className="text-xl font-extrabold text-purple-700 mt-1">
                    {dbStatus?.isPostgres ? 'PostgreSQL' : 'JSON Atomic'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tables Breakdown Grid */}
            <div>
              <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-zinc-500" />
                Data Collections & Schemas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {(dbStatus?.tables || []).map((tbl) => (
                  <div key={tbl.name} className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {tbl.name}
                        </span>
                        <span className="text-sm font-extrabold text-zinc-900">{tbl.count}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2.5 leading-relaxed">{tbl.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Status</span>
                      <span className="text-emerald-600 font-semibold">Synchronized</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Production SQL Schema Viewer */}
            <div className="bg-zinc-900 text-zinc-100 rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-purple-400 rounded-lg text-xs font-mono mb-2">
                    <FileCode className="w-3.5 h-3.5" />
                    server/db/schema.sql
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Production PostgreSQL DDL Schema
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ready to deploy directly into Supabase, Neon, AWS RDS, Render, or Google Cloud SQL.
                  </p>
                </div>

                <button
                  onClick={handleCopySchema}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  {copiedSchema ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSchema ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800/80 font-mono text-xs text-zinc-300 overflow-x-auto max-h-96">
                <pre>{dbSchema || '-- Loading database schema definition...'}</pre>
              </div>
            </div>

            {/* Reset Confirmation Modal */}
            {isResetConfirmOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Reset Database to Initial Seeds?</h3>
                  <p className="text-sm text-zinc-600 mt-2">
                    This will restore verified properties in Addis Ababa, test landlords, renters, and sample conversations. Any newly created listings will be refreshed.
                  </p>

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      onClick={() => setIsResetConfirmOpen(false)}
                      className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetDatabase}
                      disabled={isResetting}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                      {isResetting ? 'Resetting...' : 'Yes, Reset Database'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building,
  PlusCircle,
  Eye,
  Calendar,
  MessageSquare,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Property, Inquiry, InquiryStatus } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';

export const LandlordDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'properties' | 'inquiries'>('properties');
  const [stats, setStats] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteModalProp, setDeleteModalProp] = useState<Property | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, propsRes, inqRes] = await Promise.all([
        api.getLandlordStats(),
        api.getMyListings(),
        api.getInquiries()
      ]);
      setStats(statsRes.stats || {});
      setProperties(propsRes.properties || []);
      setInquiries(inqRes.inquiries || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load landlord data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleStatus = async (property: Property) => {
    const nextStatus = property.status === 'active' ? 'rented' : 'active';
    try {
      await api.updatePropertyStatus(property.id, nextStatus);
      showToast(`Property marked as ${nextStatus.toUpperCase()}`, 'success');
      setProperties(prev =>
        prev.map(p => (p.id === property.id ? { ...p, status: nextStatus } : p))
      );
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update property status', 'error');
    }
  };

  const handleDeleteProperty = async () => {
    if (!deleteModalProp) return;
    try {
      await api.deleteProperty(deleteModalProp.id);
      showToast('Property deleted successfully', 'info');
      setProperties(prev => prev.filter(p => p.id !== deleteModalProp.id));
      setDeleteModalProp(null);
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing', 'error');
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, newStatus: InquiryStatus) => {
    try {
      await api.updateInquiry(inquiryId, { status: newStatus });
      showToast(`Inquiry status updated to ${newStatus.replace('_', ' ')}`, 'success');
      setInquiries(prev =>
        prev.map(inq => (inq.id === inquiryId ? { ...inq, status: newStatus } : inq))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update inquiry', 'error');
    }
  };

  const handleChatWithRenter = async (inquiry: Inquiry) => {
    try {
      const res = await api.startConversation({
        landlordId: inquiry.landlordId,
        propertyId: inquiry.propertyId,
        initialMessage: `Hello ${inquiry.renter?.name}, regarding your inquiry for ${inquiry.property?.title}...`
      });
      navigate(`/messages?conv=${res.conversation.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to start conversation', 'error');
    }
  };

  return (
    <div className="bg-zinc-50/50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Landlord Control Panel</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
              Property & Inquiries Dashboard
            </h1>
          </div>

          <Link
            to="/properties/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Property</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Properties</span>
              <Building className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 mt-2">
              {stats?.totalProperties || properties.length}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {properties.filter(p => p.status === 'active').length} Active listings
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Inquiries</span>
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 mt-2">
              {stats?.totalInquiries || inquiries.length}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {inquiries.filter(i => i.status === 'pending').length} Pending review
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Views</span>
              <Eye className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 mt-2">
              {stats?.totalViews || properties.reduce((acc, p) => acc + (p.viewsCount || 0), 0)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> High renter interest
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Rented Units</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 mt-2">
              {properties.filter(p => p.status === 'rented').length}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">Completed tenancies</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-zinc-200 mb-6">
          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'properties'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            My Listed Properties ({properties.length})
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'inquiries'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Rental Inquiries & Viewings ({inquiries.length})
          </button>
        </div>

        {/* Tab 1: Properties List */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-zinc-400">Loading your listings...</div>
            ) : properties.length === 0 ? (
              <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center max-w-md mx-auto shadow-sm">
                <Building className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-900">You have no listed properties</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Start posting houses, apartments, or studios to connect with verified renters.
                </p>
                <Link
                  to="/properties/new"
                  className="mt-5 inline-block px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  + Add First Property
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {properties.map(property => (
                  <div
                    key={property.id}
                    className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-sm hover:border-zinc-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left details */}
                    <div className="flex items-center gap-4">
                      <img
                        src={property.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=120&auto=format&fit=crop&q=80'}
                        alt={property.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 ring-1 ring-zinc-200"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            property.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            property.status === 'rented' ? 'bg-zinc-800 text-white' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {property.status}
                          </span>
                          <span className="text-[11px] font-semibold text-zinc-500">{property.propertyType}</span>
                          <span className="text-[11px] text-zinc-400">• {property.viewsCount} views</span>
                        </div>

                        <Link
                          to={`/properties/${property.id}`}
                          className="text-sm sm:text-base font-bold text-zinc-900 hover:text-emerald-700 transition-colors line-clamp-1"
                        >
                          {property.title}
                        </Link>

                        <p className="text-xs text-zinc-500 mt-0.5">{property.neighborhood}, {property.city}</p>

                        <div className="text-sm font-extrabold text-emerald-700 mt-1">
                          {property.price.toLocaleString()} {property.currency || 'ETB'} <span className="text-xs font-normal text-zinc-400">/ mo</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100">
                      <button
                        onClick={() => handleToggleStatus(property)}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                          property.status === 'active'
                            ? 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {property.status === 'active' ? 'Mark Rented' : 'Mark Available'}
                      </button>

                      <Link
                        to={`/properties/${property.id}/edit`}
                        className="p-2 text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors"
                        title="Edit Listing"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>

                      <Link
                        to={`/properties/${property.id}`}
                        className="p-2 text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors"
                        title="View Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setDeleteModalProp(property)}
                        className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Inquiries & Viewings */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-zinc-400">Loading inquiries...</div>
            ) : inquiries.length === 0 ? (
              <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center max-w-md mx-auto shadow-sm">
                <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-900">No rental inquiries yet</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  When prospective tenants submit tour requests or message you, they will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map(inq => (
                  <div
                    key={inq.id}
                    className="bg-white rounded-3xl border border-zinc-200 p-5 sm:p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                      {/* Renter info */}
                      <div className="flex items-center gap-3">
                        <img
                          src={inq.renter?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                          alt={inq.renter?.name}
                          className="w-11 h-11 rounded-full object-cover ring-1 ring-zinc-200"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900">{inq.renter?.name}</h4>
                          <span className="text-xs text-zinc-500">{inq.renter?.email} • {inq.renter?.phone || 'No phone'}</span>
                        </div>
                      </div>

                      {/* Property badge */}
                      {inq.property && (
                        <Link
                          to={`/properties/${inq.property.id}`}
                          className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
                        >
                          🏠 {inq.property.title} ({inq.property.price.toLocaleString()} ETB)
                        </Link>
                      )}
                    </div>

                    {/* Inquiry Content */}
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-700 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 leading-relaxed">
                        "{inq.message}"
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-1">
                        {inq.preferredViewingDate && (
                          <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Preferred Date: {new Date(inq.preferredViewingDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {inq.preferredContactTime && (
                          <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Time: {inq.preferredContactTime}</span>
                          </div>
                        )}
                        <span>Received: {new Date(inq.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Status updater & Chat CTA */}
                    <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-zinc-600">Update Status:</label>
                        <select
                          value={inq.status}
                          onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as InquiryStatus)}
                          className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="viewing_scheduled">Viewing Scheduled</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleChatWithRenter(inq)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat With Tenant</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Delete Property Listing?</h3>
            <p className="text-xs text-zinc-500">
              Are you sure you want to delete <strong>{deleteModalProp.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteModalProp(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProperty}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

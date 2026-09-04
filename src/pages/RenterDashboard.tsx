import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Calendar,
  MessageSquare,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Eye
} from 'lucide-react';
import { Inquiry, Property, RenterStats } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import { PropertyCard } from '../components/properties/PropertyCard';

export const RenterDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<RenterStats | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRenterData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, inqRes, favRes] = await Promise.all([
        api.getRenterStats(),
        api.getInquiries(),
        api.getFavorites()
      ]);
      setStats(statsRes.stats || null);
      setInquiries(inqRes.inquiries || []);
      setFavorites(favRes.favorites || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load renter dashboard', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRenterData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'viewing_scheduled':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-100 text-indigo-800">
            <Calendar className="w-3 h-3" /> Viewing Scheduled
          </span>
        );
      case 'contacted':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-100 text-sky-800">
            <MessageSquare className="w-3 h-3" /> Landlord Contacted
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" /> Declined
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="bg-zinc-50/50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Renter Activity Hub</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
              Your Rental Applications & Viewings
            </h1>
          </div>

          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors self-start sm:self-auto"
          >
            <span>Browse More Houses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sent Inquiries</span>
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 mt-2">
              {stats?.totalInquiries ?? inquiries.length}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">Active applications</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Scheduled Tours</span>
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 mt-2">
              {stats?.scheduledViewings ?? inquiries.filter(i => i.status === 'viewing_scheduled').length}
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">Upcoming visits</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Saved Homes</span>
              <Heart className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 mt-2">
              {stats?.favoritesCount ?? favorites.length}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">Shortlisted properties</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Messages</span>
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 mt-2">
              {stats?.conversationsCount ?? 1}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">Direct landlord chats</span>
          </div>
        </div>

        {/* Section 1: Inquiries & Tour Status */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-8 mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Rental Inquiries & Viewing Requests</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Track landlord responses and scheduled appointment times.</p>
            </div>
            <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-xl">
              {inquiries.length} Inquiries
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-400">Loading your inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs">You have not submitted any inquiries yet.</p>
              <Link
                to="/properties"
                className="mt-3 inline-block text-xs font-semibold text-emerald-700 hover:underline"
              >
                Browse available homes
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {inquiries.map(inq => (
                <div key={inq.id} className="py-4.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Property & Landlord */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={inq.property?.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 ring-1 ring-zinc-200"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(inq.status)}
                        <span className="text-xs font-bold text-emerald-700">{inq.property?.price.toLocaleString()} ETB / mo</span>
                      </div>

                      <Link
                        to={`/properties/${inq.propertyId}`}
                        className="text-xs sm:text-sm font-bold text-zinc-900 hover:text-emerald-700 transition-colors line-clamp-1"
                      >
                        {inq.property?.title}
                      </Link>

                      <p className="text-xs text-zinc-500 mt-0.5">
                        Landlord: <strong>{inq.landlord?.name}</strong> • Sent on {new Date(inq.createdAt).toLocaleDateString()}
                      </p>

                      {inq.preferredViewingDate && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-700 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tour Date: {new Date(inq.preferredViewingDate).toLocaleDateString()} ({inq.preferredContactTime})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <Link
                      to={`/messages`}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat Landlord</span>
                    </Link>

                    <Link
                      to={`/properties/${inq.propertyId}`}
                      className="p-2 text-zinc-600 hover:text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl transition-colors"
                      title="View Property"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Saved Favorites Quick View */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>Saved Favorites ({favorites.length})</span>
              </h2>
              <Link to="/favorites" className="text-xs font-bold text-emerald-700 hover:underline">
                View all favorites &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.slice(0, 3).map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

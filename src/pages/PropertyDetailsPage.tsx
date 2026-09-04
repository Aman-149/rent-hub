import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Bed,
  Bath,
  Maximize2,
  MapPin,
  Calendar,
  Heart,
  Share2,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Wifi,
  Car,
  Zap,
  Droplets,
  Shield,
  Layers,
  Phone,
  CheckCircle,
  Eye,
  ArrowLeft,
  Star,
  StarHalf
} from 'lucide-react';
import { Property, Review } from '../types';
import { api } from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../components/common/Toast';
import { PropertyCard } from '../components/properties/PropertyCard';
import { InquiryModal } from '../components/inquiries/InquiryModal';
import { ReportModal } from '../components/inquiries/ReportModal';

export const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Modals
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [res, reviewsRes] = await Promise.all([
          api.getProperty(id),
          api.getPropertyReviews(id).catch(() => ({ reviews: [] }))
        ]);
        setProperty(res.property);
        setIsFavorite(res.property.isFavorite || false);
        setSimilarProperties(res.similarProperties || []);
        setActiveImageIndex(0);
        setReviews(reviewsRes.reviews || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load property details', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadProperty();
    window.scrollTo(0, 0);
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    if (!isAuthenticated) {
      showToast('Please log in to write a review', 'info');
      navigate('/login');
      return;
    }
    if (!newComment.trim()) {
      showToast('Please share your thoughts or rental experience in the review', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await api.createPropertyReview(property.id, {
        rating: newRating,
        comment: newComment.trim()
      });
      showToast('Review submitted successfully! Thank you for your feedback.', 'success');
      setReviews(prev => [res.review, ...prev]);
      setNewComment('');
      setNewRating(5);
      if (res.averageRating && res.reviewCount) {
        setProperty(prev => prev ? {
          ...prev,
          averageRating: res.averageRating,
          reviewCount: res.reviewCount
        } : prev);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!property) return;
    if (!isAuthenticated) {
      showToast('Please log in to save favorites', 'info');
      navigate('/login');
      return;
    }

    try {
      const nextFav = !isFavorite;
      setIsFavorite(nextFav);
      const res = await api.toggleFavorite(property.id);
      setIsFavorite(res.isFavorite);
      showToast(res.isFavorite ? 'Property saved to favorites' : 'Removed from favorites', 'info');
    } catch (err: any) {
      setIsFavorite(!isFavorite);
      showToast(err.message || 'Failed to update favorite', 'error');
    }
  };

  const handleStartChat = async () => {
    if (!property) return;
    if (!isAuthenticated) {
      showToast('Please log in to chat with the landlord', 'info');
      navigate('/login');
      return;
    }

    if (user?.id === property.landlordId) {
      showToast('You cannot start a conversation with yourself.', 'info');
      return;
    }

    try {
      const res = await api.startConversation({
        landlordId: property.landlordId,
        propertyId: property.id,
        initialMessage: `Hi, I am inquiring about "${property.title}". Is it available?`
      });
      navigate(`/messages?conv=${res.conversation.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to initiate conversation', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: `Check out this rental property in ${property?.neighborhood}: ${property?.title}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Listing link copied to clipboard!', 'success');
    }
  };

  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) return <Wifi className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('park')) return <Car className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('generator') || lower.includes('power') || lower.includes('electricity')) return <Zap className="w-4 h-4 text-amber-600" />;
    if (lower.includes('water') || lower.includes('tank')) return <Droplets className="w-4 h-4 text-sky-600" />;
    if (lower.includes('security')) return <Shield className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('elevator')) return <Layers className="w-4 h-4 text-indigo-600" />;
    return <CheckCircle className="w-4 h-4 text-emerald-600" />;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-zinc-200 text-center shadow-sm">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-zinc-900">Property Not Found</h2>
        <p className="text-xs text-zinc-500 mt-2">This listing might have been removed or is no longer accessible.</p>
        <Link
          to="/properties"
          className="mt-6 inline-block px-5 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
        >
          Return to Properties
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === property.landlordId;
  const isRented = property.status === 'rented';

  return (
    <div className="bg-zinc-50/40 min-h-screen pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link
            to="/properties"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={handleFavoriteToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Title & Location Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-zinc-900 text-white rounded-md">
                {property.propertyType}
              </span>
              {property.isFeatured && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}
              {isRented && (
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 rounded-md">
                  Currently Rented
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Eye className="w-3.5 h-3.5" /> {property.viewsCount} views
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              {property.title}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-zinc-600 mt-1">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{property.address || `${property.neighborhood}, ${property.city}`}</span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-3xl font-extrabold text-zinc-900">
              {property.price.toLocaleString()}{' '}
              <span className="text-sm font-bold text-emerald-700">{property.currency || 'ETB'}</span>
              <span className="text-xs font-normal text-zinc-500"> / month</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Available from: {property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : 'Immediate'}
            </p>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Main Large Image */}
          <div className="lg:col-span-2 aspect-[16/10] rounded-3xl overflow-hidden bg-zinc-900 relative shadow-sm border border-zinc-200">
            <img
              src={property.images[activeImageIndex]?.imageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80'}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            {property.images[activeImageIndex]?.caption && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-medium">
                {property.images[activeImageIndex].caption}
              </div>
            )}
          </div>

          {/* Thumbnails list */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 overflow-y-auto max-h-[480px]">
            {property.images && property.images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative aspect-[16/10] rounded-2xl overflow-hidden border-2 transition-all ${
                  activeImageIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-600/30' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={`View ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout: Details & Action Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details, Specs, Amenities, Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Specs Card */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                <Bed className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs text-zinc-500 block">Bedrooms</span>
                <span className="text-sm font-bold text-zinc-900">{property.bedrooms} Bed</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                <Bath className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs text-zinc-500 block">Bathrooms</span>
                <span className="text-sm font-bold text-zinc-900">{property.bathrooms} Bath</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                <Maximize2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs text-zinc-500 block">Size Area</span>
                <span className="text-sm font-bold text-zinc-900">{property.sizeSqFt ? `${property.sizeSqFt} m²` : 'Spacious'}</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                <Calendar className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-xs text-zinc-500 block">Furnished</span>
                <span className="text-sm font-bold text-zinc-900">{property.isFurnished ? 'Fully Furnished' : 'Unfurnished'}</span>
              </div>
            </div>

            {/* Property Description */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-zinc-900">About this Property</h3>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-zinc-900">Amenities & Features</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {(property.amenities && property.amenities.length > 0 ? property.amenities : ['Wi-Fi', 'Water Tank', 'Backup Generator', 'Parking', 'Security 24/7']).map(amenity => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-semibold text-zinc-800"
                  >
                    {getAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location & Neighborhood Info */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-zinc-900">Location Highlights</h3>
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>{property.neighborhood}, Addis Ababa</span>
                </div>
                <p className="text-xs text-emerald-950/80 leading-relaxed">
                  Located in a prime residential area with easy access to major roads, public transit, supermarkets, and essential utilities.
                </p>
              </div>
            </div>

            {/* Tenant Ratings & Reviews Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Tenant Ratings & Reviews</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Authentic feedback from verified renters and guests.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          (property.averageRating || 5) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-extrabold text-zinc-900">
                    {(property.averageRating || 5.0).toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <Star className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-zinc-600">No reviews yet for this listing</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Be the first to share your rental inspection or tenancy experience!
                    </p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-zinc-50/80 rounded-2xl border border-zinc-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rev.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={rev.user?.name || 'Tenant'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <h5 className="text-xs font-bold text-zinc-900">{rev.user?.name || 'Verified Tenant'}</h5>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${rev.rating >= s ? 'fill-amber-400' : 'text-zinc-200'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-700 leading-relaxed pl-10">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Submit Review Form */}
              <div className="pt-4 border-t border-zinc-100">
                <h4 className="text-sm font-bold text-zinc-900 mb-3">Leave a Review</h4>
                {!isAuthenticated ? (
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                    <span className="text-xs text-zinc-600">Please sign in to write a review.</span>
                    <Link
                      to="/login"
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-600">Your Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                newRating >= star ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your honest review about this property, landlord communication, building amenities..."
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
                      required
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Landlord & Inquiries Action Box */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-md sticky top-24 space-y-6">
              {/* Rent summary */}
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Rent</span>
                <div className="text-2xl font-black text-zinc-900 mt-0.5">
                  {property.price.toLocaleString()} {property.currency || 'ETB'}
                </div>
                <span className="text-[11px] text-zinc-500">Contact preference: {property.contactPreference || 'Platform Chat'}</span>
              </div>

              {/* Landlord Card */}
              {property.landlord && (
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={property.landlord.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                      alt={property.landlord.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-zinc-900 truncate">{property.landlord.name}</h4>
                        {property.landlord.isVerified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Verified Landlord" />
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 block">Property Owner</span>
                    </div>
                  </div>

                  {property.landlord.bio && (
                    <p className="text-xs text-zinc-600 line-clamp-2 leading-snug">
                      "{property.landlord.bio}"
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {isOwner ? (
                  <Link
                    to={`/properties/${property.id}/edit`}
                    className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    Edit This Listing
                  </Link>
                ) : (
                  <>
                    <button
                      id="btn-open-inquiry"
                      disabled={isRented}
                      onClick={() => {
                        if (!isAuthenticated) {
                          showToast('Please log in to send inquiries', 'info');
                          navigate('/login');
                        } else {
                          setIsInquiryOpen(true);
                        }
                      }}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{isRented ? 'Currently Rented' : 'Send Inquiry / Schedule Tour'}</span>
                    </button>

                    <button
                      id="btn-direct-chat"
                      onClick={handleStartChat}
                      className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Message Landlord Directly</span>
                    </button>
                  </>
                )}
              </div>

              {/* Safety & Report links */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  RentHub Verified
                </span>

                <button
                  onClick={() => setIsReportOpen(true)}
                  className="text-zinc-400 hover:text-rose-600 font-medium transition-colors flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Report Listing
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <div className="mt-16 pt-12 border-t border-zinc-200">
            <h3 className="text-xl font-bold text-zinc-900 mb-6">
              Similar Properties in {property.neighborhood}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map(sim => (
                <PropertyCard key={sim.id} property={sim} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Modal */}
      <InquiryModal
        property={property}
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
      />

      {/* Report Modal */}
      <ReportModal
        property={property}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Building,
  ShieldCheck,
  Key,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Home,
  MessageSquare
} from 'lucide-react';
import { Property } from '../types';
import { api } from '../services/api';
import { PropertyCard } from '../components/properties/PropertyCard';
import { useAuth } from '../store/authContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, quickLogin } = useAuth();

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [locations, setLocations] = useState<Array<{ name: string; count: number; avgPrice: number; image: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hero search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featuredRes, recentRes, locRes] = await Promise.all([
          api.getProperties({ featured: 'true', limit: 3 }),
          api.getProperties({ sort: 'newest', limit: 6 }),
          api.getPopularLocations()
        ]);
        setFeaturedProperties(featuredRes.properties || []);
        setRecentProperties(recentRes.properties || []);
        setLocations(locRes.locations || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedNeighborhood && selectedNeighborhood !== 'all') params.append('neighborhood', selectedNeighborhood);
    if (selectedType && selectedType !== 'all') params.append('propertyType', selectedType);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);

    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-zinc-950 text-white pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80"
            alt="Modern Residence"
            className="w-full h-full object-cover opacity-25 scale-105 transform"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Trusted Addis Ababa Rental Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Find a place you'll <span className="text-emerald-400 underline decoration-emerald-500/40">love to live</span>.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Explore verified apartments, villas, studios, and condominiums across Bole, Kazanchis, CMC, and Old Airport. Direct landlord messaging and transparent pricing.
            </p>
          </div>

          {/* Search Box Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/20 text-zinc-900 max-w-4xl mx-auto">
            <form onSubmit={handleHeroSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Keyword */}
                <div className="lg:col-span-1">
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                    Keywords / Address
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="hero-input-q"
                      type="text"
                      placeholder="e.g. Near Medhanialem..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                    Neighborhood
                  </label>
                  <select
                    id="hero-select-neighborhood"
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  >
                    <option value="all">All Addis Locations</option>
                    <option value="Bole">Bole</option>
                    <option value="Kazanchis">Kazanchis</option>
                    <option value="CMC">CMC</option>
                    <option value="Old Airport">Old Airport</option>
                    <option value="Ayat">Ayat</option>
                    <option value="Gerji">Gerji</option>
                    <option value="Megenagna">Megenagna</option>
                    <option value="Saris">Saris</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                    Property Type
                  </label>
                  <select
                    id="hero-select-type"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa / House</option>
                    <option value="Studio">Studio</option>
                    <option value="Condominium">Condominium</option>
                    <option value="Room">Private Room</option>
                  </select>
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                    Max Rent (ETB)
                  </label>
                  <input
                    id="hero-input-max-price"
                    type="number"
                    placeholder="e.g. 50000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Submit Action & Quick Neighborhood tags */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  <span className="font-semibold text-zinc-400">Popular:</span>
                  {['Bole', 'Kazanchis', 'CMC', 'Old Airport'].map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setSelectedNeighborhood(loc);
                      }}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      {loc}
                    </button>
                  ))}
                </div>

                <button
                  id="hero-submit-search-btn"
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Properties</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Properties Showcase */}
      {featuredProperties.length > 0 && (
        <section className="py-16 bg-zinc-50 border-b border-zinc-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Handpicked Luxury & Comfort
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                  Featured Properties in Addis
                </h2>
              </div>
              <Link
                to="/properties?featured=true"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                View all featured <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Neighborhoods Bento Grid */}
      {locations.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Addis Ababa Enclaves</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-1">
                Explore Popular Neighborhoods
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Discover the best residential zones tailored to your lifestyle, commute, and amenities.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {locations.slice(0, 8).map(loc => (
                <Link
                  key={loc.name}
                  to={`/properties?neighborhood=${encodeURIComponent(loc.name)}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-zinc-200 shadow-sm hover:shadow-md transition-all"
                >
                  <img
                    src={loc.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80'}
                    alt={loc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold mb-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{loc.count} {loc.count === 1 ? 'Listing' : 'Listings'}</span>
                    </div>
                    <h3 className="text-base font-bold truncate group-hover:text-emerald-300 transition-colors">
                      {loc.name}
                    </h3>
                    <p className="text-[11px] text-zinc-300 font-medium">
                      Avg: {loc.avgPrice.toLocaleString()} ETB
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Added Properties */}
      <section className="py-16 bg-zinc-50 border-t border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Fresh on Market</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight mt-1">
                Recently Added Listings
              </h2>
            </div>
            <Link
              to="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Browse all properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Seamless Experience</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-1">
              How RentHub Works
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              Whether you are listing an investment property or searching for your next home in Addis Ababa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {/* For Renters */}
            <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-200/80 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-lg mb-4">
                  <Users className="w-3.5 h-3.5" />
                  For Renters / Tenants
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-6">Find & Tour Your Dream Home</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">Browse & Filter</h4>
                      <p className="text-xs text-zinc-500">Filter by neighborhood, price range, bedrooms, generator/water tank amenities.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">Direct Landlord Contact</h4>
                      <p className="text-xs text-zinc-500">Submit a structured viewing inquiry or chat live through RentHub's secure messenger.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">Schedule & Move In</h4>
                      <p className="text-xs text-zinc-500">Track viewing appointments directly from your renter dashboard.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-200">
                <Link
                  to="/properties"
                  className="inline-flex items-center justify-center w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Start Browsing Houses
                </Link>
              </div>
            </div>

            {/* For Landlords */}
            <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-200/80 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg mb-4">
                  <Building className="w-3.5 h-3.5" />
                  For Property Owners / Landlords
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-6">List & Manage Properties with Ease</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">Create Listings with Photos</h4>
                      <p className="text-xs text-zinc-500">Upload multiple photos, specify amenities, rent in ETB, and set availability.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">Receive Real-Time Inquiries</h4>
                      <p className="text-xs text-zinc-500">Get notified when qualified tenants request viewings or message you.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">Manage Status & Tenants</h4>
                      <p className="text-xs text-zinc-500">Update inquiry states, schedule visits, and mark properties as rented.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-200">
                <Link
                  to={user?.role === 'landlord' ? '/properties/new' : '/register?role=landlord'}
                  className="inline-flex items-center justify-center w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Post Your Property Today
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantees Strip */}
      <section className="py-12 bg-emerald-950 text-emerald-50 border-t border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-900/60 border border-emerald-800 rounded-2xl shrink-0 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Verified Listings & Landlords</h4>
                <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                  Real photos, verified host identities, and active community moderation to prevent scams.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-900/60 border border-emerald-800 rounded-2xl shrink-0 text-emerald-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Direct In-App Messaging</h4>
                <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                  Chat directly with owners, arrange viewings safely, and keep all communication organized.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-900/60 border border-emerald-800 rounded-2xl shrink-0 text-emerald-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Zero Hidden Broker Fees</h4>
                <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                  Clear, transparent monthly rates set directly by property owners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-20 bg-gradient-to-tr from-zinc-900 via-zinc-900 to-emerald-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to find or list your next property?
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join thousands of tenants and landlords in Addis Ababa enjoying seamless housing searches and management on RentHub.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/properties"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-colors"
            >
              Browse All Properties
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-xl border border-zinc-700 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building, LayoutGrid, List, SearchX } from 'lucide-react';
import { Property } from '../types';
import { api } from '../services/api';
import { PropertyCard } from '../components/properties/PropertyCard';
import { PropertyFilter } from '../components/properties/PropertyFilter';

export const BrowsePropertiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter state
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    neighborhood: searchParams.get('neighborhood') || 'all',
    propertyType: searchParams.get('propertyType') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || 'any',
    bathrooms: searchParams.get('bathrooms') || 'any',
    isFurnished: searchParams.get('isFurnished') || '',
    amenities: searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : [],
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1', 10)
  });

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        sort: filters.sort,
        page: filters.page,
        limit: 12
      };

      if (filters.q) params.q = filters.q;
      if (filters.neighborhood && filters.neighborhood !== 'all') params.neighborhood = filters.neighborhood;
      if (filters.propertyType && filters.propertyType !== 'all') params.propertyType = filters.propertyType;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.bedrooms && filters.bedrooms !== 'any') params.bedrooms = filters.bedrooms;
      if (filters.bathrooms && filters.bathrooms !== 'any') params.bathrooms = filters.bathrooms;
      if (filters.isFurnished) params.isFurnished = filters.isFurnished;
      if (filters.amenities && filters.amenities.length > 0) params.amenities = filters.amenities.join(',');

      const res = await api.getProperties(params);
      setProperties(res.properties || []);
      setTotalCount(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...newFilters, page: 1 });
    const newParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (key === 'amenities' && Array.isArray(val) && val.length > 0) {
        newParams.append('amenities', val.join(','));
      } else if (val !== '' && val !== 'all' && val !== 'any' && key !== 'amenities') {
        newParams.append(key, String(val));
      }
    });
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    const resetState = {
      q: '',
      neighborhood: 'all',
      propertyType: 'all',
      minPrice: '',
      maxPrice: '',
      bedrooms: 'any',
      bathrooms: 'any',
      isFurnished: '',
      amenities: [],
      sort: 'newest',
      page: 1
    };
    setFilters(resetState);
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-zinc-50/50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Properties for Rent in Addis Ababa
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Browse apartments, houses, and studios with up-to-date pricing and verified hosts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-colors ${
                viewMode === 'list'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <PropertyFilter
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalResults={totalCount}
        />

        {/* Results List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-zinc-200 p-4 h-96 animate-pulse flex flex-col justify-between">
                <div className="w-full h-48 bg-zinc-200 rounded-xl" />
                <div className="space-y-2.5 mt-4">
                  <div className="h-5 bg-zinc-200 rounded w-1/3" />
                  <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="h-3 bg-zinc-200 rounded w-1/2" />
                </div>
                <div className="h-8 bg-zinc-100 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center max-w-lg mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 mx-auto mb-4">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">No properties found</h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              We couldn't find any listings matching your active filters. Try broadening your price range or clearing some amenities.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {properties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                      filters.page === p
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  disabled={filters.page >= totalPages}
                  onClick={() => handlePageChange(filters.page + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { PropertyType } from '../../types';

interface FilterState {
  q: string;
  neighborhood: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  isFurnished: string;
  amenities: string[];
  sort: string;
}

interface PropertyFilterProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  totalResults?: number;
}

const NEIGHBORHOODS = [
  'All',
  'Bole',
  'Kazanchis',
  'CMC',
  'Old Airport',
  'Ayat',
  'Gerji',
  'Megenagna',
  'Saris'
];

const PROPERTY_TYPES: Array<'all' | PropertyType> = [
  'all',
  'Apartment',
  'House',
  'Villa',
  'Studio',
  'Condominium',
  'Room'
];

const ALL_AMENITIES = [
  'Wi-Fi',
  'Parking',
  'Water Tank',
  'Backup Generator',
  'Security 24/7',
  'Balcony',
  'Elevator',
  'Furnished',
  'Pet Friendly',
  'Air Conditioning',
  'Gym Access'
];

export const PropertyFilter: React.FC<PropertyFilterProps> = ({
  filters,
  onChange,
  onReset,
  totalResults
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof FilterState, value: any) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    handleInputChange('amenities', updated);
  };

  const hasActiveFilters = Boolean(
    filters.q ||
    (filters.neighborhood && filters.neighborhood !== 'all') ||
    (filters.propertyType && filters.propertyType !== 'all') ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.bedrooms && filters.bedrooms !== 'any') ||
    (filters.bathrooms && filters.bathrooms !== 'any') ||
    filters.isFurnished ||
    (filters.amenities && filters.amenities.length > 0)
  );

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 sm:p-5 mb-8">
      {/* Search Bar + Primary Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-filter-search"
            type="text"
            placeholder="Search by keyword, address, or features..."
            value={filters.q}
            onChange={(e) => handleInputChange('q', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
          />
          {filters.q && (
            <button
              onClick={() => handleInputChange('q', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Location Dropdown */}
        <div className="w-full md:w-48">
          <select
            id="select-filter-neighborhood"
            value={filters.neighborhood}
            onChange={(e) => handleInputChange('neighborhood', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
          >
            <option value="all">All Locations</option>
            {NEIGHBORHOODS.filter(n => n !== 'All').map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Sort by */}
        <div className="w-full md:w-48">
          <select
            id="select-filter-sort"
            value={filters.sort}
            onChange={(e) => handleInputChange('sort', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Expand Advanced Filters Toggle */}
        <button
          id="btn-toggle-advanced-filters"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
            isExpanded || hasActiveFilters
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Property Type Pills */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-semibold text-zinc-400 shrink-0 uppercase tracking-wider mr-1">
          Type:
        </span>
        {PROPERTY_TYPES.map(type => {
          const isSelected = (filters.propertyType || 'all').toLowerCase() === type.toLowerCase();
          return (
            <button
              key={type}
              id={`filter-type-${type}`}
              onClick={() => handleInputChange('propertyType', type === 'all' ? 'all' : type)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          );
        })}
      </div>

      {/* Expanded Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Price Range (ETB / Month)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="input-min-price"
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleInputChange('minPrice', e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                />
                <span className="text-zinc-400">-</span>
                <input
                  id="input-max-price"
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Bedrooms
              </label>
              <select
                id="select-bedrooms"
                value={filters.bedrooms}
                onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              >
                <option value="any">Any Bedrooms</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
              </select>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Bathrooms
              </label>
              <select
                id="select-bathrooms"
                value={filters.bathrooms}
                onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              >
                <option value="any">Any Bathrooms</option>
                <option value="1">1 Bathroom</option>
                <option value="2">2 Bathrooms</option>
                <option value="3">3+ Bathrooms</option>
              </select>
            </div>

            {/* Furnished */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Furnished Status
              </label>
              <select
                id="select-furnished"
                value={filters.isFurnished}
                onChange={(e) => handleInputChange('isFurnished', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              >
                <option value="">Any Status</option>
                <option value="true">Furnished Only</option>
                <option value="false">Unfurnished Only</option>
              </select>
            </div>
          </div>

          {/* Amenities Checklist */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">
              Must-Have Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map(amenity => {
                const checked = (filters.amenities || []).includes(amenity);
                return (
                  <button
                    key={amenity}
                    id={`filter-amenity-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      checked
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                      checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300'
                    }`}>
                      {checked && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset & Stats Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <span className="text-xs text-zinc-500">
              {totalResults !== undefined ? `${totalResults} properties matched` : 'Showing available properties'}
            </span>

            {hasActiveFilters && (
              <button
                id="btn-reset-filters"
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

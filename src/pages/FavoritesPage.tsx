import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, SearchX, ArrowRight } from 'lucide-react';
import { Property } from '../types';
import { api } from '../services/api';
import { PropertyCard } from '../components/properties/PropertyCard';
import { useToast } from '../components/common/Toast';

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFavorites();
      setFavorites(res.favorites || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load favorites', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleFavoriteChange = (propertyId: string, isFav: boolean) => {
    if (!isFav) {
      setFavorites(prev => prev.filter(p => p.id !== propertyId));
    }
  };

  return (
    <div className="bg-zinc-50/50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2.5">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
              Saved Properties
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Your shortlisted houses and apartments in Addis Ababa.
            </p>
          </div>

          <span className="text-xs font-bold text-zinc-500 bg-white px-3 py-1.5 rounded-xl border border-zinc-200">
            {favorites.length} {favorites.length === 1 ? 'Saved Item' : 'Saved Items'}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-zinc-200 p-4 h-80 animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">No saved properties yet</h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              When you browse houses and apartments, tap the heart icon to save listings here for easy comparison.
            </p>
            <Link
              to="/properties"
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <span>Explore Listings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(property => (
              <PropertyCard
                key={property.id}
                property={{ ...property, isFavorite: true }}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

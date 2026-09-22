import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bed, Bath, Maximize2, MapPin, Heart, ShieldCheck, Sparkles, User as UserIcon } from 'lucide-react';
import { Property } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../store/authContext';
import { useToast } from '../common/Toast';

interface PropertyCardProps {
  property: Property;
  onFavoriteChange?: (propertyId: string, isFav: boolean) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onFavoriteChange }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState<boolean>(property.isFavorite || false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const mainImage = property.images && property.images.length > 0
    ? property.images[activeImgIndex]?.imageUrl || property.images[0].imageUrl
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80';

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please log in to save properties to favorites', 'info');
      navigate('/login');
      return;
    }

    try {
      const nextState = !isFavorite;
      setIsFavorite(nextState);
      const res = await api.toggleFavorite(property.id);
      setIsFavorite(res.isFavorite);
      showToast(res.isFavorite ? 'Saved to favorites' : 'Removed from favorites', 'info');
      if (onFavoriteChange) {
        onFavoriteChange(property.id, res.isFavorite);
      }
    } catch (err: any) {
      setIsFavorite(!isFavorite); // revert
      showToast(err.message || 'Failed to update favorites', 'error');
    }
  };

  const isRented = property.status === 'rented';

  return (
    <div
      id={`property-card-${property.id}`}
      className="group relative bg-white rounded-2xl border border-zinc-200/90 overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200 flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
        <Link to={`/properties/${property.id}`} className="block w-full h-full">
          <img
            src={mainImage}
            alt={property.title}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isRented ? 'grayscale-[40%] contrast-90' : 'group-hover:scale-105'
            }`}
            loading="lazy"
          />
        </Link>

        {/* Favorite Button */}
        <button
          id={`btn-fav-${property.id}`}
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 z-10 p-2.5 rounded-full backdrop-blur-md transition-transform active:scale-90 ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/30 hover:bg-black/50 text-white'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {isRented ? (
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-zinc-900 text-white rounded-lg shadow-sm">
              Rented
            </span>
          ) : property.isFeatured ? (
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg shadow-sm">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          ) : null}

          <span className="px-2.5 py-0.5 text-xs font-semibold bg-white/90 text-zinc-800 backdrop-blur-md rounded-lg shadow-sm w-fit">
            {property.propertyType}
          </span>
        </div>

        {/* Multi-image thumbnail dots */}
        {property.images && property.images.length > 1 && isHovered && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-full z-10">
            {property.images.slice(0, 4).map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImgIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeImgIndex === idx ? 'w-4 bg-white' : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`View photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Price */}
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="text-xl font-bold text-zinc-900">
              {property.price.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-emerald-700 uppercase">{property.currency || 'ETB'}</span>
              <span className="text-xs font-normal text-zinc-500"> / month</span>
            </div>
            {property.isFurnished && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Furnished
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/properties/${property.id}`} className="block group-hover:text-emerald-700 transition-colors">
            <h3 className="font-semibold text-zinc-900 line-clamp-1 text-base leading-snug">
              {property.title}
            </h3>
          </Link>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1 mb-3.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {property.neighborhood}, {property.city}
            </span>
          </div>

          {/* Amenities & Specs Bar */}
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-zinc-50 rounded-xl text-xs text-zinc-700 border border-zinc-100 mb-3">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>{property.sizeSqFt ? `${property.sizeSqFt} m²` : 'Spacious'}</span>
            </div>
          </div>
        </div>

        {/* Footer info: Landlord & View CTA */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
          {property.landlord ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-zinc-100 ring-1 ring-zinc-200 flex items-center justify-center shrink-0">
                <UserIcon className="w-3 h-3 text-zinc-500" />
              </div>
              <span className="text-zinc-600 truncate font-medium max-w-[110px]">
                {property.landlord.name}
              </span>
              {property.landlord.isVerified && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified Landlord" />
              )}
            </div>
          ) : (
            <span className="text-zinc-400">Owner listed</span>
          )}

          <Link
            to={`/properties/${property.id}`}
            className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

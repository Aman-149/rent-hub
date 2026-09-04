import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-900 text-zinc-300 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-white">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <span>
                Rent<span className="text-emerald-400">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Ethiopia's premier trusted house and apartment rental marketplace. Connecting verified landlords with quality tenants across Addis Ababa and beyond.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-zinc-700/50">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Listings & Safe Inquiries
              </span>
            </div>
          </div>

          {/* Popular Addis Locations */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Top Locations
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/properties?neighborhood=Bole" className="hover:text-white transition-colors">
                  Bole Apartments
                </Link>
              </li>
              <li>
                <Link to="/properties?neighborhood=Kazanchis" className="hover:text-white transition-colors">
                  Kazanchis Studios
                </Link>
              </li>
              <li>
                <Link to="/properties?neighborhood=CMC" className="hover:text-white transition-colors">
                  CMC Family Villas
                </Link>
              </li>
              <li>
                <Link to="/properties?neighborhood=Old%20Airport" className="hover:text-white transition-colors">
                  Old Airport Luxury
                </Link>
              </li>
              <li>
                <Link to="/properties?neighborhood=Ayat" className="hover:text-white transition-colors">
                  Ayat Condominiums
                </Link>
              </li>
              <li>
                <Link to="/properties?neighborhood=Gerji" className="hover:text-white transition-colors">
                  Gerji Townhouses
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/properties" className="hover:text-white transition-colors">
                  Browse All Properties
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=Apartment" className="hover:text-white transition-colors">
                  Apartments for Rent
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=Villa" className="hover:text-white transition-colors">
                  Houses & Villas
                </Link>
              </li>
              <li>
                <Link to="/properties?isFurnished=true" className="hover:text-white transition-colors">
                  Furnished Rentals
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Post Your Property
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Help */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Support & Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bole Medhanialem, Addis Ababa</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+251 911 000 000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@renthub.et</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} RentHub Ethiopia. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built for smooth landlord-renter transactions</span>
            <span className="flex items-center gap-1 text-zinc-400">
              Crafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Addis Ababa
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

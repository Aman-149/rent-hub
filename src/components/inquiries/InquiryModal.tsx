import React, { useState } from 'react';
import { X, Calendar, Clock, Send, ShieldCheck } from 'lucide-react';
import { Property } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../store/authContext';
import { useToast } from '../common/Toast';

interface InquiryModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [message, setMessage] = useState(
    `Hello Ato/Wzo ${property.landlord?.name || 'Landlord'}, I am interested in viewing this ${property.propertyType.toLowerCase()} in ${property.neighborhood}. Is it available for viewing?`
  );
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('Afternoon (2:00 PM - 5:00 PM)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Please enter an inquiry message', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createInquiry({
        propertyId: property.id,
        message: message.trim(),
        preferredViewingDate: preferredDate,
        preferredContactTime: preferredTime
      });

      showToast('Inquiry sent successfully to the landlord!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit inquiry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        id="inquiry-modal"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Schedule a Viewing / Send Inquiry</h3>
            <p className="text-xs text-zinc-500 truncate max-w-xs mt-0.5">
              {property.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Property snippet */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
            <img
              src={property.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100&auto=format&fit=crop&q=80'}
              alt={property.title}
              className="w-14 h-14 rounded-xl object-cover ring-1 ring-zinc-200"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-emerald-700">{property.price.toLocaleString()} ETB / mo</span>
              <h4 className="text-xs font-bold text-zinc-900 truncate">{property.title}</h4>
              <p className="text-[11px] text-zinc-500">{property.neighborhood}, {property.city}</p>
            </div>
          </div>

          {/* Preferred Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Preferred Viewing Date
              </label>
              <input
                type="date"
                value={preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Preferred Time
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
              >
                <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                <option value="Afternoon (2:00 PM - 5:00 PM)">Afternoon (2:00 PM - 5:00 PM)</option>
                <option value="Evening (5:00 PM - 7:00 PM)">Evening (5:00 PM - 7:00 PM)</option>
                <option value="Weekend Anytime">Weekend Anytime</option>
              </select>
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Your Message to Landlord
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide any details such as intended move-in date, occupancy, or questions..."
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none resize-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Your contact details and inquiries are safely communicated on RentHub.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending...' : 'Submit Inquiry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

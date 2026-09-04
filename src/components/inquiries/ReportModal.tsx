import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { Property } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';

interface ReportModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Fake property',
  'Wrong information',
  'Scam',
  'Inappropriate content',
  'Property no longer available',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  property,
  isOpen,
  onClose
}) => {
  const { showToast } = useToast();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createReport({
        propertyId: property.id,
        reason,
        details: details.trim()
      });
      showToast('Report submitted for admin review. Thank you for keeping RentHub safe.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-rose-50/40">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold">Report This Listing</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-zinc-600">
            If you noticed inaccurate details, suspected fraud, or improper content regarding <strong>{property.title}</strong>, please let our moderation team know.
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            >
              {REPORT_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue you encountered..."
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none"
            />
          </div>

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
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Send Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

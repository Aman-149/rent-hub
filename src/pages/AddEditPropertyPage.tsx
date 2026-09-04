import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Sparkles,
  ArrowLeft,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  UploadCloud,
  Star,
  Loader2
} from 'lucide-react';
import { Property, PropertyType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../components/common/Toast';

const PRESET_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1000&auto=format&fit=crop&q=80'
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
  'Gym Access',
  'Modern Kitchen',
  'Garden',
  'CCTV Surveillance'
];

const NEIGHBORHOODS = [
  'Bole',
  'Kazanchis',
  'CMC',
  'Old Airport',
  'Ayat',
  'Gerji',
  'Megenagna',
  'Saris',
  'Sarbet',
  'Summit',
  'Piazza',
  'Lebu'
];

export const AddEditPropertyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [city, setCity] = useState('Addis Ababa');
  const [neighborhood, setNeighborhood] = useState('Bole');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [sizeSqFt, setSizeSqFt] = useState('');
  const [isFurnished, setIsFurnished] = useState(true);
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().split('T')[0]);
  const [contactPreference, setContactPreference] = useState('RentHub Chat & Phone');
  const [amenities, setAmenities] = useState<string[]>(['Wi-Fi', 'Water Tank', 'Backup Generator', 'Parking']);
  const [images, setImages] = useState<string[]>([PRESET_PROPERTY_IMAGES[0]]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    async function loadListing() {
      if (!id) return;
      try {
        const res = await api.getProperty(id);
        const p: Property = res.property;
        setTitle(p.title);
        setDescription(p.description);
        setPropertyType(p.propertyType);
        setPrice(String(p.price));
        setCurrency(p.currency || 'ETB');
        setCity(p.city);
        setNeighborhood(p.neighborhood);
        setAddress(p.address || '');
        setBedrooms(String(p.bedrooms));
        setBathrooms(String(p.bathrooms));
        setSizeSqFt(p.sizeSqFt ? String(p.sizeSqFt) : '');
        setIsFurnished(p.isFurnished);
        setAvailableFrom(p.availableFrom ? p.availableFrom.split('T')[0] : new Date().toISOString().split('T')[0]);
        setContactPreference(p.contactPreference || 'RentHub Chat & Phone');
        setAmenities(p.amenities || []);
        setImages(p.images?.map(img => img.imageUrl) || [PRESET_PROPERTY_IMAGES[0]]);
      } catch (err: any) {
        showToast(err.message || 'Failed to load listing for editing', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadListing();
  }, [id]);

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingFiles(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        showToast(`Skipped ${file.name}: only images are supported.`, 'info');
        continue;
      }
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await api.uploadImage(base64, file.name);
        if (res.url) {
          setImages(prev => [...prev, res.url]);
          successCount++;
        }
      } catch (err: any) {
        showToast(`Failed to upload ${file.name}: ${err.message}`, 'error');
      }
    }

    if (successCount > 0) {
      showToast(`Uploaded ${successCount} photo(s) successfully!`, 'success');
    }
    setIsUploadingFiles(false);
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
    showToast('Cover photo updated', 'info');
  };

  const addImagePreset = (url: string) => {
    if (!images.includes(url)) {
      setImages(prev => [...prev, url]);
    }
  };

  const addCustomImage = () => {
    if (!customImageUrl.trim()) return;
    setImages(prev => [...prev, customImageUrl.trim()]);
    setCustomImageUrl('');
  };

  const removeImage = (index: number) => {
    if (images.length === 1) {
      showToast('You must have at least one photo for the listing', 'error');
      return;
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    if (images.length === 0) {
      showToast('Please add at least one photo of the property', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        propertyType,
        price: parseFloat(price),
        currency,
        city,
        neighborhood,
        address: address.trim() || `${neighborhood}, ${city}`,
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        sizeSqFt: sizeSqFt ? parseFloat(sizeSqFt) : undefined,
        isFurnished,
        availableFrom,
        contactPreference,
        amenities,
        images
      };

      if (isEditing) {
        await api.updateProperty(id!, payload);
        showToast('Property listing updated successfully!', 'success');
      } else {
        await api.createProperty(payload);
        showToast('Property listing created and live!', 'success');
      }

      navigate('/dashboard/landlord');
    } catch (err: any) {
      showToast(err.message || 'Failed to save property listing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-16 text-center text-xs text-zinc-500">Loading property details...</div>;
  }

  return (
    <div className="bg-zinc-50/50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/dashboard/landlord"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
            {isEditing ? 'Edit Mode' : 'New Listing'}
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
              {isEditing ? 'Edit Property Listing' : 'Post a New Property for Rent'}
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Provide thorough and accurate details to attract verified renters across Addis Ababa.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                1. Basic Property Information
              </h3>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Property Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern 2-Bedroom Luxury Apartment in Bole Medhanialem"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Villa">Villa</option>
                    <option value="Studio">Studio</option>
                    <option value="Condominium">Condominium</option>
                    <option value="Room">Private Room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Monthly Rent (ETB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Furnished Status
                  </label>
                  <select
                    value={String(isFurnished)}
                    onChange={(e) => setIsFurnished(e.target.value === 'true')}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="true">Fully Furnished</option>
                    <option value="false">Unfurnished</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Location & Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                2. Location Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Neighborhood in Addis Ababa
                  </label>
                  <select
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    {NEIGHBORHOODS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Specific Address / Landmark
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Near Edna Mall, Behind Medhanialem Church"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Specs & Availability */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                3. Specifications & Availability
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Size in Square Meters (m²)
                  </label>
                  <input
                    type="number"
                    value={sizeSqFt}
                    onChange={(e) => setSizeSqFt(e.target.value)}
                    placeholder="e.g. 110"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Available From Date
                  </label>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Contact Preference
                  </label>
                  <input
                    type="text"
                    value={contactPreference}
                    onChange={(e) => setContactPreference(e.target.value)}
                    placeholder="e.g. RentHub Chat & Phone"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Full Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the layout, neighborhood qualities, backup utilities, parking accessibility, and tenancy terms..."
                  className="w-full px-3.5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
                  required
                />
              </div>
            </div>

            {/* Section 4: Amenities */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                4. Amenities & Features
              </h3>

              <div className="flex flex-wrap gap-2">
                {ALL_AMENITIES.map(amenity => {
                  const isChecked = amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300'
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 5: Photos / Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="text-sm font-bold text-zinc-900">
                  5. Property Photos (Multiple)
                </h3>
                <span className="text-xs text-zinc-400 font-medium">
                  {images.length} photo{images.length !== 1 ? 's' : ''} added
                </span>
              </div>

              {/* Drag and drop upload box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesUpload(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                    : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300'
                }`}
              >
                <div className="max-w-md mx-auto flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    {isUploadingFiles ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900">
                    {isUploadingFiles ? 'Processing & Uploading...' : 'Drag & Drop property photos here'}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 mb-4">
                    Supports PNG, JPG, JPEG or WebP images from your computer or phone.
                  </p>

                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Browse Files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingFiles}
                      onChange={(e) => handleFilesUpload(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {/* Current photos preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 group bg-zinc-100">
                    <img src={imgUrl} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 ? (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        Primary Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(idx)}
                        className="absolute top-2 left-2 bg-black/60 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <Star className="w-2.5 h-2.5" /> Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Image URL input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="url"
                  placeholder="Or paste external image URL directly..."
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomImage}
                  className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800"
                >
                  + Add URL
                </button>
              </div>

              {/* Preset Image Gallery */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 mb-2">Or select from curated Addis Ababa sample photos:</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {PRESET_PROPERTY_IMAGES.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addImagePreset(preset)}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 shrink-0 hover:scale-105 transition-transform"
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Footer Buttons */}
            <div className="pt-6 border-t border-zinc-100 flex items-center justify-end gap-3">
              <Link
                to="/dashboard/landlord"
                className="px-5 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing...' : isEditing ? 'Update Listing' : 'Publish Property Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

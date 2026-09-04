import React, { useState } from 'react';
import { User, Phone, Mail, ShieldCheck, KeyRound, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../store/authContext';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'
];

export const UserProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || PRESET_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password update
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatar: customAvatar.trim() || avatar
      });
      showToast('Profile information updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsChangingPass(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-zinc-50/50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Account & Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Manage your personal profile, contact information, and security preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Preview Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <img
                  src={avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/20 shadow-md"
                />
                {user.isVerified && (
                  <div className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 rounded-full text-white ring-2 ring-white" title="Verified Member">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <h3 className="text-base font-bold text-zinc-900">{user.name}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
              
              <span className={`inline-block mt-3 px-3 py-1 text-xs font-bold rounded-full uppercase ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                user.role === 'landlord' ? 'bg-emerald-100 text-emerald-800' :
                'bg-sky-100 text-sky-800'
              }`}>
                {user.role} Member
              </span>

              <div className="mt-6 pt-6 border-t border-zinc-100 text-left text-xs space-y-2 text-zinc-600">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Account Status:</span>
                  <span className="font-semibold text-emerald-700 capitalize">{user.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Member Since:</span>
                  <span className="font-semibold text-zinc-700">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Forms */}
          <div className="md:col-span-2 space-y-6">
            {/* General Info */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 mb-4">Personal Information</h3>

              <form onSubmit={handleProfileSave} className="space-y-4">
                {/* Choose Avatar */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">
                    Choose Profile Photo
                  </label>
                  <div className="flex items-center gap-3">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatar(url);
                          setCustomAvatar('');
                        }}
                        className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                          avatar === url && !customAvatar ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105' : 'border-zinc-200 opacity-80'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        {avatar === url && !customAvatar && (
                          <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center text-white">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 911 000 000"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>

                {user.role === 'landlord' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Landlord Bio / Experience
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief note to renters about your properties or management standards..."
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
                    />
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Update */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-base mb-4">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Security & Password</span>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isChangingPass ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

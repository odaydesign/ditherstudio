'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Preset {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  id: string;
  email: string;
  plan: string;
  createdAt: string;
  presets: Preset[];
}

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const deletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    setDeleting(presetId);
    try {
      const response = await fetch(`/api/presets/${presetId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setProfile(prev => prev ? {
          ...prev,
          presets: prev.presets.filter(p => p.id !== presetId)
        } : null);
      }
    } catch (err) {
      alert('Failed to delete preset');
    } finally {
      setDeleting(null);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('This will permanently delete your account and all your presets. This action cannot be undone. Are you sure?')) {
      return;
    }

    setDeletingAccount(true);
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
      });
      if (response.ok) {
        await signOut();
        router.push('/');
      } else {
        alert('Failed to delete account');
      }
    } catch (err) {
      alert('Failed to delete account');
    } finally {
      setDeletingAccount(false);
      setShowDeleteAccount(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPlanLabel = (plan: string) => {
    const plans: Record<string, string> = {
      free: 'FREE',
      pro: 'PRO',
      studio: 'STUDIO',
    };
    return plans[plan] || plan.toUpperCase();
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[#e8e5dd] flex items-center justify-center">
        <div className="text-[13px] text-[#666]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8e5dd] text-[#2a2a2a] font-['JetBrains_Mono',monospace]">
      {/* Header */}
      <header className="border-b border-[#d0cdc4]">
        <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-medium tracking-wide hover:text-[#666] transition-colors">
            /DITHER.STUDIO
          </Link>
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/studio" className="text-[#666] hover:text-[#2a2a2a] transition-colors">
              /STUDIO
            </Link>
            <Link href="/showcase" className="text-[#666] hover:text-[#2a2a2a] transition-colors">
              /SHOWCASE
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-[11px] text-[#999] mb-2 tracking-wider">// ACCOUNT SETTINGS</p>
          <h1 className="text-2xl font-normal">Your Account</h1>
        </div>

        {loading ? (
          <div className="text-[13px] text-[#666]">Loading profile...</div>
        ) : error ? (
          <div className="text-[13px] text-red-600">{error}</div>
        ) : (
          <div className="space-y-8">
            {/* Profile Section */}
            <section className="border border-[#d0cdc4] p-6">
              <h2 className="text-[13px] font-medium mb-4 tracking-wide">/PROFILE</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {user.imageUrl && (
                    <img
                      src={user.imageUrl}
                      alt="Profile"
                      className="w-16 h-16 rounded-full border border-[#d0cdc4]"
                    />
                  )}
                  <div>
                    <div className="text-[14px] font-medium">
                      {user.fullName || user.username || 'User'}
                    </div>
                    <div className="text-[12px] text-[#666]">
                      {user.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[12px] pt-4 border-t border-[#d0cdc4]">
                  <div>
                    <div className="text-[#999] mb-1">MEMBER SINCE</div>
                    <div>{profile ? formatDate(profile.createdAt) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-[#999] mb-1">USER ID</div>
                    <div className="font-mono text-[11px] text-[#666] truncate">
                      {profile?.id || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Subscription Section */}
            <section className="border border-[#d0cdc4] p-6">
              <h2 className="text-[13px] font-medium mb-4 tracking-wide">/SUBSCRIPTION</h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px]">Current Plan:</span>
                    <span className="bg-[#2a2a2a] text-[#e8e5dd] px-3 py-1 text-[11px]">
                      {profile ? getPlanLabel(profile.plan) : '—'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#666] mt-2">
                    {profile?.plan === 'free'
                      ? 'Upgrade to Pro for unlimited presets and priority support.'
                      : profile?.plan === 'pro'
                      ? 'You have access to all Pro features.'
                      : 'You have access to all Studio features.'}
                  </p>
                </div>
                {profile?.plan === 'free' && (
                  <Link
                    href="/pricing"
                    className="border border-[#2a2a2a] text-[#2a2a2a] px-4 py-2 text-[11px] hover:bg-[#2a2a2a] hover:text-[#e8e5dd] transition-colors"
                  >
                    /UPGRADE
                  </Link>
                )}
              </div>
            </section>

            {/* Presets Section */}
            <section className="border border-[#d0cdc4] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-medium tracking-wide">/SAVED_PRESETS</h2>
                <span className="text-[11px] text-[#999]">
                  {profile?.presets.length || 0} preset{profile?.presets.length !== 1 ? 's' : ''}
                </span>
              </div>

              {profile?.presets.length === 0 ? (
                <div className="text-[12px] text-[#666] py-8 text-center border border-dashed border-[#d0cdc4]">
                  No presets saved yet. Create one in the{' '}
                  <Link href="/studio" className="underline hover:text-[#2a2a2a]">
                    studio
                  </Link>
                  .
                </div>
              ) : (
                <div className="space-y-2">
                  {profile?.presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between py-3 px-4 border border-[#d0cdc4] hover:border-[#2a2a2a] transition-colors"
                    >
                      <div>
                        <div className="text-[13px]">{preset.name}</div>
                        <div className="text-[11px] text-[#999]">
                          Created {formatDate(preset.createdAt)}
                          {preset.updatedAt !== preset.createdAt && (
                            <> · Updated {formatDate(preset.updatedAt)}</>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        disabled={deleting === preset.id}
                        className="text-[11px] text-[#999] hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {deleting === preset.id ? 'DELETING...' : '/DELETE'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Danger Zone */}
            <section className="border border-red-300 p-6">
              <h2 className="text-[13px] font-medium mb-4 tracking-wide text-red-600">/DANGER_ZONE</h2>

              {!showDeleteAccount ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px]">Delete Account</div>
                    <p className="text-[12px] text-[#666] mt-1">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteAccount(true)}
                    className="border border-red-500 text-red-500 px-4 py-2 text-[11px] hover:bg-red-500 hover:text-white transition-colors"
                  >
                    /DELETE_ACCOUNT
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[12px] text-red-600">
                    This action is irreversible. All your presets and data will be permanently deleted.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={deleteAccount}
                      disabled={deletingAccount}
                      className="bg-red-500 text-white px-4 py-2 text-[11px] hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingAccount ? 'DELETING...' : 'CONFIRM DELETE'}
                    </button>
                    <button
                      onClick={() => setShowDeleteAccount(false)}
                      className="border border-[#d0cdc4] text-[#666] px-4 py-2 text-[11px] hover:border-[#2a2a2a] hover:text-[#2a2a2a] transition-colors"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Sign Out */}
            <div className="pt-4">
              <button
                onClick={() => signOut(() => router.push('/'))}
                className="text-[12px] text-[#666] hover:text-[#2a2a2a] transition-colors"
              >
                /SIGN_OUT
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d0cdc4] mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-[11px] text-[#999]">
            <div>/DITHER.STUDIO — 2024</div>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-[#2a2a2a] transition-colors">/PRIVACY</Link>
              <Link href="/terms" className="hover:text-[#2a2a2a] transition-colors">/TERMS</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

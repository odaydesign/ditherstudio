'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useState } from 'react';

type ShowcaseItem = {
  id: string;
  title: string;
  algorithm: string;
  author: string;
  type: 'image' | 'video';
  thumbnail: string;
  src: string;
  colors: number;
  likes: number;
};

// Placeholder showcase items - in production these would come from a database
const showcaseItems: ShowcaseItem[] = [
  {
    id: '1',
    title: 'Urban Sunset',
    algorithm: 'Floyd-Steinberg',
    author: 'studio_user',
    type: 'image',
    thumbnail: '/api/placeholder/400/300',
    src: '/api/placeholder/1200/900',
    colors: 8,
    likes: 234,
  },
  {
    id: '2',
    title: 'Portrait Study',
    algorithm: 'Atkinson',
    author: 'dither_artist',
    type: 'image',
    thumbnail: '/api/placeholder/400/300',
    src: '/api/placeholder/1200/900',
    colors: 2,
    likes: 189,
  },
  {
    id: '3',
    title: 'Motion Loop',
    algorithm: 'Bayer 8x8',
    author: 'pixel_motion',
    type: 'video',
    thumbnail: '/api/placeholder/400/300',
    src: '/api/placeholder/video',
    colors: 16,
    likes: 456,
  },
  {
    id: '4',
    title: 'Nature Scene',
    algorithm: 'Blue Noise',
    author: 'organic_pixels',
    type: 'image',
    thumbnail: '/api/placeholder/400/300',
    src: '/api/placeholder/1200/900',
    colors: 32,
    likes: 312,
  },
  {
    id: '5',
    title: 'Retro Game Art',
    algorithm: 'Ordered 4x4',
    author: 'retro_dev',
    type: 'image',
    thumbnail: '/api/placeholder/400/300',
    src: '/api/placeholder/1200/900',
    colors: 4,
    likes: 567,
  },
  {
    id: '6',
    title: 'Glitch Animation',
    algorithm: 'Error Diffusion',
    author: 'glitch_lab',
    type: 'video',
    thumbnail: '/api/placeholder/400/300',
    src: '/api/placeholder/video',
    colors: 8,
    likes: 289,
  },
  {
    id: '7',
    title: 'Minimalist Portrait',
    algorithm: 'Threshold',
    author: 'mono_artist',
    type: 'image',
    thumbnail: '/api/placeholder/400/300',
    src: '/api/placeholder/1200/900',
    colors: 2,
    likes: 445,
  },
  {
    id: '8',
    title: 'Cityscape',
    algorithm: 'Jarvis-Judice-Ninke',
    author: 'urban_dither',
    type: 'image',
    thumbnail: '/api/placeholder/400/300',
    src: '/api/placeholder/1200/900',
    colors: 16,
    likes: 198,
  },
  {
    id: '9',
    title: 'Abstract Flow',
    algorithm: 'Sierra',
    author: 'abstract_io',
    type: 'video',
    thumbnail: '/api/placeholder/400/300',
    src: '/api/placeholder/video',
    colors: 8,
    likes: 623,
  },
];

const filters = ['All', 'Images', 'Videos', 'Popular', 'Recent'];
const algorithmFilters = ['All Algorithms', 'Error Diffusion', 'Ordered', 'Noise-Based', 'Threshold'];

export default function ShowcasePage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeAlgorithm, setActiveAlgorithm] = useState('All Algorithms');
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null);

  const filteredItems = showcaseItems.filter((item) => {
    if (activeFilter === 'Images' && item.type !== 'image') return false;
    if (activeFilter === 'Videos' && item.type !== 'video') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#e8e5dd] text-[#2a2a2a] font-['JetBrains_Mono',monospace]">
      {/* Header */}
      <header className="border-b border-[#d0cdc4]">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-medium tracking-wide hover:text-[#666] transition-colors">
            /DITHER.STUDIO
          </Link>
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/pricing" className="text-[#666] hover:text-[#2a2a2a] transition-colors">
              /PRICING
            </Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-[#2a2a2a] text-[#e8e5dd] px-4 py-2 text-[12px] hover:bg-[#1a1a1a] transition-colors">
                  /SIGN_IN
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/studio"
                className="bg-[#2a2a2a] text-[#e8e5dd] px-4 py-2 text-[12px] hover:bg-[#1a1a1a] transition-colors"
              >
                /OPEN_STUDIO
              </Link>
            </SignedIn>
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <div className="py-16 border-b border-[#d0cdc4]">
          <p className="text-[11px] text-[#999] mb-4 tracking-wider">// SHOWCASE</p>
          <h1 className="text-3xl md:text-4xl font-normal mb-4">
            Community Gallery
          </h1>
          <p className="text-[14px] text-[#666] max-w-xl">
            Explore dithered artwork created by our community. Images and videos
            processed with various algorithms and color palettes.
          </p>
        </div>

        {/* Filters */}
        <div className="py-6 border-b border-[#d0cdc4]">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 text-[11px] transition-colors ${
                    activeFilter === filter
                      ? 'bg-[#2a2a2a] text-[#e8e5dd]'
                      : 'border border-[#d0cdc4] text-[#666] hover:border-[#2a2a2a] hover:text-[#2a2a2a]'
                  }`}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
            <select
              value={activeAlgorithm}
              onChange={(e) => setActiveAlgorithm(e.target.value)}
              className="bg-transparent border border-[#d0cdc4] px-3 py-1.5 text-[11px] text-[#666] focus:border-[#2a2a2a] focus:outline-none"
            >
              {algorithmFilters.map((alg) => (
                <option key={alg} value={alg}>{alg}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="border border-[#d0cdc4] overflow-hidden group-hover:border-[#2a2a2a] transition-colors">
                  {/* Placeholder for image/video thumbnail */}
                  <div className="aspect-[4/3] bg-[#d0cdc4] relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-[#999]">
                      {item.type === 'video' && (
                        <div className="absolute top-3 left-3 bg-[#2a2a2a] text-[#e8e5dd] px-2 py-1 text-[10px]">
                          VIDEO
                        </div>
                      )}
                      <div className="text-[12px]">
                        {/* In production, this would be an actual image */}
                        <svg
                          className="w-12 h-12 mx-auto mb-2 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {item.title}
                      </div>
                    </div>
                    {/* Dither pattern overlay for visual effect */}
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%232a2a2a' fill-opacity='1'/%3E%3C/svg%3E")`,
                      }}
                    />
                  </div>
                  {/* Info */}
                  <div className="p-4 bg-[#f5f3ee]">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-[13px] font-medium">{item.title}</h3>
                      <span className="text-[10px] text-[#999]">♥ {item.likes}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#666]">
                      <span>/{item.algorithm.toLowerCase().replace(/\s+/g, '_')}</span>
                      <span>{item.colors} colors</span>
                    </div>
                    <div className="text-[10px] text-[#999] mt-2">
                      by @{item.author}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Load More */}
        <div className="py-8 text-center border-t border-[#d0cdc4]">
          <button className="border border-[#2a2a2a] text-[#2a2a2a] px-6 py-2 text-[12px] hover:bg-[#2a2a2a] hover:text-[#e8e5dd] transition-colors">
            /LOAD_MORE
          </button>
        </div>

        {/* Submit CTA */}
        <div className="py-16 border-t border-[#d0cdc4]">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] text-[#999] mb-4 tracking-wider">// SUBMIT YOUR WORK</p>
              <h2 className="text-2xl font-normal mb-4">Share your creations</h2>
              <p className="text-[13px] text-[#666] mb-6 leading-relaxed">
                Created something amazing with Dither Studio? Submit your work to be featured
                in our community gallery. We showcase the best dithered images and videos
                from creators around the world.
              </p>
              <SignedOut>
                <Link
                  href="/sign-up"
                  className="bg-[#2a2a2a] text-[#e8e5dd] px-6 py-3 text-[12px] hover:bg-[#1a1a1a] transition-colors inline-block"
                >
                  /SIGN_UP_TO_SUBMIT
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/studio"
                  className="bg-[#2a2a2a] text-[#e8e5dd] px-6 py-3 text-[12px] hover:bg-[#1a1a1a] transition-colors inline-block"
                >
                  /CREATE_AND_SUBMIT
                </Link>
              </SignedIn>
            </div>
            <div className="border border-[#d0cdc4] p-6">
              <h4 className="text-[13px] font-medium mb-4">Submission Guidelines</h4>
              <ul className="space-y-2 text-[12px] text-[#666]">
                <li className="flex gap-2">
                  <span className="text-[#2a2a2a]">+</span>
                  <span>Must be created with Dither Studio</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2a2a2a]">+</span>
                  <span>Original work only</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2a2a2a]">+</span>
                  <span>High quality exports (min 1080p)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2a2a2a]">+</span>
                  <span>Include algorithm and settings used</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#2a2a2a]">+</span>
                  <span>Videos: max 30 seconds, loop preferred</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="py-12 border-t border-[#d0cdc4]">
          <div className="grid grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-light mb-1">2,450+</div>
              <div className="text-[10px] text-[#999] tracking-wider">SUBMISSIONS</div>
            </div>
            <div>
              <div className="text-2xl font-light mb-1">890</div>
              <div className="text-[10px] text-[#999] tracking-wider">CREATORS</div>
            </div>
            <div>
              <div className="text-2xl font-light mb-1">45</div>
              <div className="text-[10px] text-[#999] tracking-wider">COUNTRIES</div>
            </div>
            <div>
              <div className="text-2xl font-light mb-1">150K+</div>
              <div className="text-[10px] text-[#999] tracking-wider">VIEWS</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d0cdc4]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-[11px] text-[#999]">
            <div>/DITHER.STUDIO — 2024</div>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-[#2a2a2a] transition-colors">/PRIVACY</Link>
              <Link href="/terms" className="hover:text-[#2a2a2a] transition-colors">/TERMS</Link>
              <Link href="/pricing" className="hover:text-[#2a2a2a] transition-colors">/PRICING</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal for selected item */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-[#2a2a2a]/80 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-[#e8e5dd] max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-[#d0cdc4]">
              <div>
                <h3 className="text-[15px] font-medium">{selectedItem.title}</h3>
                <p className="text-[11px] text-[#666]">by @{selectedItem.author}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-[#666] hover:text-[#2a2a2a] text-[20px]"
              >
                ×
              </button>
            </div>

            {/* Modal content */}
            <div className="aspect-video bg-[#d0cdc4] flex items-center justify-center">
              <div className="text-[#999] text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-[13px]">{selectedItem.type === 'video' ? 'Video Preview' : 'Full Resolution Image'}</p>
              </div>
            </div>

            {/* Modal info */}
            <div className="p-6 border-t border-[#d0cdc4]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-[10px] text-[#999] mb-1">ALGORITHM</div>
                  <div className="text-[13px]">/{selectedItem.algorithm.toLowerCase().replace(/\s+/g, '_')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#999] mb-1">COLORS</div>
                  <div className="text-[13px]">{selectedItem.colors}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#999] mb-1">TYPE</div>
                  <div className="text-[13px]">{selectedItem.type.toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#999] mb-1">LIKES</div>
                  <div className="text-[13px]">♥ {selectedItem.likes}</div>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-center">
                <button className="border border-[#2a2a2a] text-[#2a2a2a] px-4 py-2 text-[11px] hover:bg-[#2a2a2a] hover:text-[#e8e5dd] transition-colors">
                  /LIKE
                </button>
                <button className="border border-[#2a2a2a] text-[#2a2a2a] px-4 py-2 text-[11px] hover:bg-[#2a2a2a] hover:text-[#e8e5dd] transition-colors">
                  /SHARE
                </button>
                <button className="bg-[#2a2a2a] text-[#e8e5dd] px-4 py-2 text-[11px] hover:bg-[#1a1a1a] transition-colors">
                  /TRY_SETTINGS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

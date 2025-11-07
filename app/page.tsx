import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold">Dither Studio Pro</div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <Link href="/pricing" className="hover:text-gray-300">
                Pricing
              </Link>
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/studio" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
                Go to Studio
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6">
            Advanced Real-Time Dithering
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Professional-grade dithering with 50+ algorithms, GPU acceleration,
            and cutting-edge color processing
          </p>
          <div className="flex gap-4 justify-center">
            <SignedOut>
              <Link
                href="/sign-up"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-semibold"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg text-lg font-semibold"
              >
                View Pricing
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/studio"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-semibold"
              >
                Open Studio
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-3">50+ Algorithms</h3>
            <p className="text-gray-300">
              Floyd-Steinberg, Ostromoukhov, Bayer matrices, Blue Noise, and more
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-3">GPU Accelerated</h3>
            <p className="text-gray-300">
              Real-time processing with WebGL shaders for instant results
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Advanced Color</h3>
            <p className="text-gray-300">
              Oklab, CIEDE2000, gamma correction, and perceptual processing
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

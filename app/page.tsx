import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e8e5dd] text-[#2a2a2a] font-['JetBrains_Mono',monospace]">
      {/* Header */}
      <header className="border-b border-[#d0cdc4]">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-[13px] font-medium tracking-wide">/DITHER.STUDIO</div>
          <div className="flex items-center gap-6 text-[13px]">
            <SignedOut>
              <Link href="/showcase" className="text-[#666] hover:text-[#2a2a2a] transition-colors">
                /SHOWCASE
              </Link>
              <Link href="/pricing" className="text-[#666] hover:text-[#2a2a2a] transition-colors">
                /PRICING
              </Link>
              <SignInButton mode="modal">
                <button className="bg-[#2a2a2a] text-[#e8e5dd] px-4 py-2 text-[12px] hover:bg-[#1a1a1a] transition-colors">
                  /SIGN_IN
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/showcase" className="text-[#666] hover:text-[#2a2a2a] transition-colors">
                /SHOWCASE
              </Link>
              <Link href="/account" className="text-[#666] hover:text-[#2a2a2a] transition-colors">
                /ACCOUNT
              </Link>
              <Link
                href="/studio"
                className="bg-[#2a2a2a] text-[#e8e5dd] px-4 py-2 text-[12px] hover:bg-[#1a1a1a] transition-colors"
              >
                /OPEN_STUDIO
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="py-24 border-b border-[#d0cdc4]">
          <div className="max-w-3xl">
            <p className="text-[11px] text-[#999] mb-4 tracking-wider">// REAL-TIME IMAGE PROCESSING</p>
            <h1 className="text-4xl md:text-5xl font-normal mb-6 leading-tight tracking-tight">
              Advanced Dithering<br />
              <span className="text-[#666]">for the Modern Web</span>
            </h1>
            <p className="text-[14px] text-[#666] mb-8 leading-relaxed max-w-xl">
              Professional-grade dithering with 50+ algorithms, GPU acceleration,
              and perceptual color processing. Transform your images with precision.
            </p>
            <div className="flex gap-3">
              <SignedOut>
                <Link
                  href="/sign-up"
                  className="bg-[#2a2a2a] text-[#e8e5dd] px-6 py-3 text-[12px] hover:bg-[#1a1a1a] transition-colors"
                >
                  /START_FREE
                </Link>
                <Link
                  href="/demo"
                  className="border border-[#2a2a2a] text-[#2a2a2a] px-6 py-3 text-[12px] hover:bg-[#2a2a2a] hover:text-[#e8e5dd] transition-colors"
                >
                  /TRY_DEMO
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/studio"
                  className="bg-[#2a2a2a] text-[#e8e5dd] px-6 py-3 text-[12px] hover:bg-[#1a1a1a] transition-colors"
                >
                  /OPEN_STUDIO
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-16 border-b border-[#d0cdc4]">
          <p className="text-[11px] text-[#999] mb-8 tracking-wider">// FEATURES</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <div className="text-[11px] text-[#999] mb-2">01</div>
              <h3 className="text-[15px] font-medium mb-3">/ALGORITHMS</h3>
              <p className="text-[13px] text-[#666] leading-relaxed">
                Floyd-Steinberg, Ostromoukhov, Bayer matrices, Blue Noise,
                and 50+ more dithering algorithms.
              </p>
            </div>
            <div className="group">
              <div className="text-[11px] text-[#999] mb-2">02</div>
              <h3 className="text-[15px] font-medium mb-3">/GPU_ACCELERATED</h3>
              <p className="text-[13px] text-[#666] leading-relaxed">
                Real-time processing with WebGL shaders.
                Instant results at any resolution.
              </p>
            </div>
            <div className="group">
              <div className="text-[11px] text-[#999] mb-2">03</div>
              <h3 className="text-[15px] font-medium mb-3">/COLOR_SCIENCE</h3>
              <p className="text-[13px] text-[#666] leading-relaxed">
                Oklab, CIEDE2000, gamma correction, and
                perceptual color processing.
              </p>
            </div>
          </div>
        </div>

        {/* Algorithm Preview Section */}
        <div className="py-16 border-b border-[#d0cdc4]">
          <p className="text-[11px] text-[#999] mb-8 tracking-wider">// ALGORITHM CATEGORIES</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-[#d0cdc4] p-6 hover:border-[#2a2a2a] transition-colors">
              <h4 className="text-[13px] font-medium mb-2">Error Diffusion</h4>
              <p className="text-[12px] text-[#666]">
                Floyd-Steinberg, Jarvis-Judice-Ninke, Stucki, Burkes, Sierra, Atkinson
              </p>
            </div>
            <div className="border border-[#d0cdc4] p-6 hover:border-[#2a2a2a] transition-colors">
              <h4 className="text-[13px] font-medium mb-2">Ordered Dithering</h4>
              <p className="text-[12px] text-[#666]">
                Bayer 2x2 to 16x16, Halftone, Clustered Dot, Line patterns
              </p>
            </div>
            <div className="border border-[#d0cdc4] p-6 hover:border-[#2a2a2a] transition-colors">
              <h4 className="text-[13px] font-medium mb-2">Noise-Based</h4>
              <p className="text-[12px] text-[#666]">
                Blue Noise, White Noise, Interleaved Gradient, Golden Ratio
              </p>
            </div>
            <div className="border border-[#d0cdc4] p-6 hover:border-[#2a2a2a] transition-colors">
              <h4 className="text-[13px] font-medium mb-2">Artistic</h4>
              <p className="text-[12px] text-[#666]">
                Stippling, Crosshatch, Pattern dither, Vintage effects
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 border-b border-[#d0cdc4]">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-light mb-1">50+</div>
              <div className="text-[11px] text-[#999] tracking-wider">ALGORITHMS</div>
            </div>
            <div>
              <div className="text-3xl font-light mb-1">60fps</div>
              <div className="text-[11px] text-[#999] tracking-wider">REAL-TIME</div>
            </div>
            <div>
              <div className="text-3xl font-light mb-1">WebGL</div>
              <div className="text-[11px] text-[#999] tracking-wider">GPU POWERED</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 text-center">
          <p className="text-[11px] text-[#999] mb-4 tracking-wider">// GET STARTED</p>
          <h2 className="text-2xl font-normal mb-6">Ready to transform your images?</h2>
          <SignedOut>
            <div className="flex gap-3 justify-center">
              <Link
                href="/sign-up"
                className="bg-[#2a2a2a] text-[#e8e5dd] px-8 py-3 text-[12px] hover:bg-[#1a1a1a] transition-colors"
              >
                /CREATE_ACCOUNT
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <Link
              href="/studio"
              className="bg-[#2a2a2a] text-[#e8e5dd] px-8 py-3 text-[12px] hover:bg-[#1a1a1a] transition-colors inline-block"
            >
              /LAUNCH_STUDIO
            </Link>
          </SignedIn>
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
              <Link href="https://github.com" className="hover:text-[#2a2a2a] transition-colors">/GITHUB</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

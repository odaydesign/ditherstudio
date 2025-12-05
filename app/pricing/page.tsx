import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

const plans = [
  {
    name: 'FREE',
    price: '0',
    period: 'forever',
    description: 'Perfect for trying out dithering',
    features: [
      '10 exports per month',
      'Basic algorithms (15+)',
      'Max resolution: 1080p',
      'Standard color palettes',
      'PNG export only',
    ],
    limitations: [
      'Watermark on exports',
      'No batch processing',
    ],
    cta: '/START_FREE',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'PRO',
    price: '12',
    period: '/month',
    description: 'For designers and content creators',
    features: [
      'Unlimited exports',
      'All 50+ algorithms',
      'Max resolution: 4K',
      'Custom color palettes',
      'PNG, JPEG, WebP, GIF export',
      'Batch processing',
      'No watermark',
      'Priority processing',
    ],
    limitations: [],
    cta: '/UPGRADE_PRO',
    href: '/sign-up?plan=pro',
    highlighted: true,
  },
  {
    name: 'STUDIO',
    price: '39',
    period: '/month',
    description: 'For teams and professionals',
    features: [
      'Everything in Pro',
      'Max resolution: 8K',
      'Video dithering (up to 4K)',
      'API access',
      'Custom algorithm presets',
      'Team collaboration (5 seats)',
      'Priority support',
      'Early access to features',
    ],
    limitations: [],
    cta: '/GO_STUDIO',
    href: '/sign-up?plan=studio',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, PayPal, and Apple Pay through our secure payment processor.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'We offer a 14-day money-back guarantee if you\'re not satisfied with your purchase.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Yes, you can change your plan at any time. Changes take effect on your next billing cycle.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#e8e5dd] text-[#2a2a2a] font-['JetBrains_Mono',monospace]">
      {/* Header */}
      <header className="border-b border-[#d0cdc4]">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-medium tracking-wide hover:text-[#666] transition-colors">
            /DITHER.STUDIO
          </Link>
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/showcase" className="text-[#666] hover:text-[#2a2a2a] transition-colors">
              /SHOWCASE
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
        <div className="py-16 border-b border-[#d0cdc4] text-center">
          <p className="text-[11px] text-[#999] mb-4 tracking-wider">// PRICING</p>
          <h1 className="text-3xl md:text-4xl font-normal mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-[14px] text-[#666] max-w-md mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="py-16 border-b border-[#d0cdc4]">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`border p-6 transition-colors ${
                  plan.highlighted
                    ? 'border-[#2a2a2a] bg-[#f5f3ee]'
                    : 'border-[#d0cdc4] hover:border-[#2a2a2a]'
                }`}
              >
                <div className="text-[11px] text-[#999] mb-2">0{index + 1}</div>
                <h3 className="text-[15px] font-medium mb-2">/{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-light">${plan.price}</span>
                  <span className="text-[12px] text-[#666]">{plan.period}</span>
                </div>
                <p className="text-[12px] text-[#666] mb-6">{plan.description}</p>

                <div className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-[12px]">
                      <span className="text-[#2a2a2a]">+</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <div key={limitation} className="flex items-start gap-2 text-[12px] text-[#999]">
                      <span>−</span>
                      <span>{limitation}</span>
                    </div>
                  ))}
                </div>

                <SignedOut>
                  <Link
                    href={plan.href}
                    className={`block text-center py-3 text-[12px] transition-colors ${
                      plan.highlighted
                        ? 'bg-[#2a2a2a] text-[#e8e5dd] hover:bg-[#1a1a1a]'
                        : 'border border-[#2a2a2a] text-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-[#e8e5dd]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/studio"
                    className={`block text-center py-3 text-[12px] transition-colors ${
                      plan.highlighted
                        ? 'bg-[#2a2a2a] text-[#e8e5dd] hover:bg-[#1a1a1a]'
                        : 'border border-[#2a2a2a] text-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-[#e8e5dd]'
                    }`}
                  >
                    /GO_TO_STUDIO
                  </Link>
                </SignedIn>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="py-16 border-b border-[#d0cdc4]">
          <p className="text-[11px] text-[#999] mb-8 tracking-wider">// COMPARE PLANS</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#d0cdc4]">
                  <th className="text-left py-3 font-medium">Feature</th>
                  <th className="text-center py-3 font-medium">Free</th>
                  <th className="text-center py-3 font-medium">Pro</th>
                  <th className="text-center py-3 font-medium">Studio</th>
                </tr>
              </thead>
              <tbody className="text-[#666]">
                <tr className="border-b border-[#d0cdc4]">
                  <td className="py-3">Monthly exports</td>
                  <td className="text-center py-3">10</td>
                  <td className="text-center py-3">Unlimited</td>
                  <td className="text-center py-3">Unlimited</td>
                </tr>
                <tr className="border-b border-[#d0cdc4]">
                  <td className="py-3">Algorithms</td>
                  <td className="text-center py-3">15+</td>
                  <td className="text-center py-3">50+</td>
                  <td className="text-center py-3">50+</td>
                </tr>
                <tr className="border-b border-[#d0cdc4]">
                  <td className="py-3">Max resolution</td>
                  <td className="text-center py-3">1080p</td>
                  <td className="text-center py-3">4K</td>
                  <td className="text-center py-3">8K</td>
                </tr>
                <tr className="border-b border-[#d0cdc4]">
                  <td className="py-3">Video dithering</td>
                  <td className="text-center py-3">—</td>
                  <td className="text-center py-3">—</td>
                  <td className="text-center py-3">✓</td>
                </tr>
                <tr className="border-b border-[#d0cdc4]">
                  <td className="py-3">API access</td>
                  <td className="text-center py-3">—</td>
                  <td className="text-center py-3">—</td>
                  <td className="text-center py-3">✓</td>
                </tr>
                <tr className="border-b border-[#d0cdc4]">
                  <td className="py-3">Batch processing</td>
                  <td className="text-center py-3">—</td>
                  <td className="text-center py-3">✓</td>
                  <td className="text-center py-3">✓</td>
                </tr>
                <tr className="border-b border-[#d0cdc4]">
                  <td className="py-3">Custom palettes</td>
                  <td className="text-center py-3">—</td>
                  <td className="text-center py-3">✓</td>
                  <td className="text-center py-3">✓</td>
                </tr>
                <tr className="border-b border-[#d0cdc4]">
                  <td className="py-3">Team seats</td>
                  <td className="text-center py-3">1</td>
                  <td className="text-center py-3">1</td>
                  <td className="text-center py-3">5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="py-16 border-b border-[#d0cdc4]">
          <p className="text-[11px] text-[#999] mb-8 tracking-wider">// FAQ</p>
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h4 className="text-[13px] font-medium mb-2">{faq.q}</h4>
                <p className="text-[12px] text-[#666] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="py-24 text-center">
          <p className="text-[11px] text-[#999] mb-4 tracking-wider">// GET STARTED</p>
          <h2 className="text-2xl font-normal mb-6">Ready to start dithering?</h2>
          <SignedOut>
            <Link
              href="/sign-up"
              className="bg-[#2a2a2a] text-[#e8e5dd] px-8 py-3 text-[12px] hover:bg-[#1a1a1a] transition-colors inline-block"
            >
              /CREATE_ACCOUNT
            </Link>
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
              <Link href="/showcase" className="hover:text-[#2a2a2a] transition-colors">/SHOWCASE</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

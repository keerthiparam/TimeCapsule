import CaptureForm from '@/components/CaptureForm';
import { Shield, Clock, Lock } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Time<span className="text-blue-600">Capsule</span>
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Preserve Digital Evidence. Prove It Existed.
          </p>
          <p className="text-gray-500">
            Tamper-proof timestamping for online content using Bitcoin & IPFS
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Shield className="text-blue-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">Tamper-Proof</h3>
            <p className="text-sm text-gray-600">
              Cryptographic hashing ensures content integrity. Any change is detectable.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Clock className="text-blue-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">Timestamped</h3>
            <p className="text-sm text-gray-600">
              Anchored in Bitcoin blockchain via OpenTimestamps. Proves existence at a point in time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Lock className="text-blue-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">Decentralized</h3>
            <p className="text-sm text-gray-600">
              Stored on IPFS. No single point of failure. Content persists independently.
            </p>
          </div>
        </div>

        {/* Capture Form */}
        <CaptureForm />

        {/* Use Cases */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Who Uses TimeCapsule?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">📰 Journalists</h3>
              <p className="text-sm text-gray-600">
                Archive articles and sources before they disappear. Maintain verifiable evidence trails.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">🔍 OSINT Investigators</h3>
              <p className="text-sm text-gray-600">
                Preserve social media posts, web pages, and digital breadcrumbs with cryptographic proof.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">⚖️ Legal Teams</h3>
              <p className="text-sm text-gray-600">
                Create admissible digital evidence with verifiable timestamps and integrity proofs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">🎓 Researchers</h3>
              <p className="text-sm text-gray-600">
                Archive web content for citation. Ensure reproducibility with immutable snapshots.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <a
            href="/captures"
            className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            View All Captures
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>Built with OpenTimestamps, IPFS & Bitcoin</p>
          <p className="mt-2">
            TimeCapsule proves <em>existence</em>, not <em>truthfulness</em>
          </p>
        </div>
      </footer>
    </main>
  );
}
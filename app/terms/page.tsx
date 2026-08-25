import { LandingNav } from "@/components/landing/nav"
import { LandingFooter } from "@/components/landing/footer"

export const metadata = {
  title: 'Terms and Conditions | Binjwa IT Solutions',
  description: 'Terms of Service and Acceptable Use Policy for Binjwa IT Solutions.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingNav />
      
      <div className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-invert max-w-none text-foreground-muted space-y-6">
          <p><strong>Last Updated: July 2026</strong></p>
          
          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Binjwa IT Solutions platform, you agree to be bound by these Terms and Conditions and our Privacy Policy. 
              If you do not agree to these terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Description of Service</h2>
            <p>
              Binjwa provides an AI-powered social media management platform that allows users to generate content, schedule posts, monitor analytics, 
              and automate responses across third-party networks (including Meta, X, and LinkedIn).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Third-Party API Usage</h2>
            <p>
              Our service relies on APIs provided by third-party platforms (e.g., Meta Graph API). By connecting your accounts, you agree to comply with 
              the respective Terms of Service of those platforms (such as the Facebook Terms of Service and Instagram Terms of Use). 
            </p>
            <p className="mt-2">
              We are not responsible for any suspension, ban, or restriction placed on your social media accounts by these third-party platforms as a 
              result of your use of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Acceptable Use Policy</h2>
            <p>You agree not to use the platform to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Generate or distribute spam, malicious content, or misinformation.</li>
              <li>Violate the intellectual property rights or privacy of others.</li>
              <li>Exceed API rate limits intentionally or attempt to reverse-engineer our platform.</li>
              <li>Use the AI automation features to harass, abuse, or mislead other users on social platforms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Data Ownership and Licensing</h2>
            <p>
              You retain all rights to the original content you provide to the platform. By using our service to generate AI content, you grant us a 
              non-exclusive license to process and transmit that content solely for the purpose of providing the service to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              In no event shall Binjwa IT Solutions be liable for any indirect, incidental, special, consequential, or punitive damages, including 
              without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or 
              inability to access or use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time, without prior notice, if we determine that you have violated these 
              Terms and Conditions or any applicable third-party platform rules. You may terminate your account at any time via the settings dashboard.
            </p>
          </section>
        </div>
      </div>

      <LandingFooter />
    </main>
  )
}

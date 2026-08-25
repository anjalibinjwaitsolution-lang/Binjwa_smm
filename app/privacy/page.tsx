import { LandingNav } from "@/components/landing/nav"
import { LandingFooter } from "@/components/landing/footer"

export const metadata = {
  title: 'Privacy Policy | Binjwa IT Solutions',
  description: 'Privacy Policy and Data Handling practices for Binjwa IT Solutions.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingNav />
      
      <div className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none text-foreground-muted space-y-6">
          <p><strong>Last Updated: July 2026</strong></p>
          
          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Introduction</h2>
            <p>
              Binjwa IT Solutions ("we," "our," or "us") respects your privacy and is committed to protecting it through our compliance with this policy. 
              This Privacy Policy describes our practices for collecting, using, maintaining, protecting, and disclosing your information when you use our 
              social media management platform and related services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Information We Collect</h2>
            <p>We collect several types of information from and about users of our platform, including:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Personal Data:</strong> Name, email address, and authentication details provided via our identity provider (Clerk).</li>
              <li><strong>Social Media Data:</strong> Access tokens, page metadata, post content, and engagement metrics when you connect third-party platforms like Meta (Facebook, Instagram), LinkedIn, and X (Twitter).</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, generated content, and scheduled posts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide, maintain, and improve our social media management services.</li>
              <li>Post content to your connected social media accounts on your behalf, strictly based on your instructions.</li>
              <li>Analyze engagement and reach to provide you with actionable analytics and insights.</li>
              <li>Train our AI models (using anonymized and aggregated data) strictly to improve content generation for your specific niche.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Third-Party Platform Integrations (Meta Compliance)</h2>
            <p>
              Our application integrates with the Meta API (Facebook, Instagram) to provide scheduling, analytics, and automated messaging. 
              By connecting your Meta accounts:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>We request specific permissions (e.g., <code>pages_manage_posts</code>, <code>pages_messaging</code>) solely to execute the features you enable in our dashboard.</li>
              <li>We do not sell, rent, or distribute your social media data to third-party data brokers.</li>
              <li>All access tokens are stored securely and encrypted in our database (Supabase).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Data Retention and Deletion</h2>
            <p>
              You have the absolute right to delete your data at any time. We provide a self-service data deletion mechanism within the Account Settings 
              of your dashboard. When you request data deletion:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>All associated social media access tokens are immediately invalidated and purged from our database.</li>
              <li>Your content library, generated posts, and messaging logs are permanently deleted.</li>
              <li>We comply with Meta's strict data deletion requirements, ensuring no residual data from your Facebook or Instagram pages remains on our servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">6. Security</h2>
            <p>
              We implement industry-standard security measures, including SSL encryption, secure token storage, and regular security audits, to protect 
              your personal and social data from unauthorized access, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection Officer at privacy@binjwa.com.
            </p>
          </section>
        </div>
      </div>

      <LandingFooter />
    </main>
  )
}

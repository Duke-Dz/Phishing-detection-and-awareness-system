import { PublicPageLayout } from "../components/layout/PublicPageLayout";

export default function PrivacyPolicy() {
  const tableOfContents = [
    { id: "information-we-collect", label: "1. Information We Collect" },
    { id: "how-we-use", label: "2. How We Use Your Information" },
    { id: "data-sharing", label: "3. Data Sharing & Threat Intelligence" },
    { id: "data-security", label: "4. Data Security" },
    { id: "your-choices", label: "5. Your Choices & Rights" },
    { id: "contact-us", label: "6. Contact Us" },
  ];

  return (
    <PublicPageLayout
      title="Privacy Policy"
      lastUpdated={new Date().toLocaleDateString()}
      effectiveDate="June 2026"
      tableOfContents={tableOfContents}
    >
      <p className="text-lg text-slate-300 font-medium">
        At CyberSense, we are committed to protecting your privacy while providing cutting-edge security solutions. 
        This policy explains how we handle your data when you interact with our platform to ensure transparency and trust.
      </p>

      <h2 id="information-we-collect">1. Information We Collect</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> We only collect what we need to run our security scans and manage your account.
      </div>
      <p>
        When you use CyberSense, we collect information that you provide directly to us, such as your email address,
        name, and any URLs, emails, or SMS content you submit for security scanning. We also automatically collect
        basic diagnostic data such as IP address and browser type to ensure the security and functionality of our service.
      </p>

      <h2 id="how-we-use">2. How We Use Your Information</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> Your data is used to analyze threats, alert you of risks, and improve our detection models.
      </div>
      <p>
        The primary purpose of collecting your information is to:
      </p>
      <ul>
        <li>Analyze submitted content for phishing, malware, and other security threats.</li>
        <li>Alert you regarding the security status of your submissions.</li>
        <li>Maintain, improve, and secure our detection algorithms.</li>
        <li>Send you important administrative and security notices.</li>
      </ul>

      <h2 id="data-sharing">3. Data Sharing and Threat Intelligence</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> We share anonymized threat data with the cybersecurity community, but never your personal info for marketing.
      </div>
      <p>
        CyberSense may share anonymized indicators of compromise (IoCs) with global threat intelligence feeds to help
        protect the broader cybersecurity community. We do not share your personally identifiable information (PII) with
        third parties for marketing purposes.
      </p>

      <h2 id="data-security">4. Data Security</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> We use industry-standard encryption to protect your data in transit and at rest.
      </div>
      <p>
        We implement industry-standard encryption (TLS) for data in transit and AES-256 for data at rest. While we strive
        to use commercially acceptable means to protect your personal information, no method of transmission over the Internet
        is 100% secure.
      </p>

      <h2 id="your-choices">5. Your Choices & Rights</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> You control your communication preferences and can opt-out of non-critical alerts.
      </div>
      <p>
        You may unsubscribe from non-critical email alerts at any time by clicking the "Unsubscribe" link in our emails.
        Critical security alerts regarding your account will still be sent. You also have the right to request deletion of your account data.
      </p>

      <h2 id="contact-us">6. Contact Us</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> Reach out to us anytime if you have privacy concerns.
      </div>
      <p>
        If you have any questions about this Privacy Policy, please contact our privacy team at <a href="mailto:privacy@cybersense.io">privacy@cybersense.io</a>.
      </p>
    </PublicPageLayout>
  );
}

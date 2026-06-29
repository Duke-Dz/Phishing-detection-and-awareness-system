import { PublicPageLayout } from "../components/layout/PublicPageLayout";

export default function TermsOfService() {
  const tableOfContents = [
    { id: "acceptance", label: "1. Acceptance of Terms" },
    { id: "description", label: "2. Description of Service" },
    { id: "accounts", label: "3. User Accounts & Registration" },
    { id: "acceptable-use", label: "4. Acceptable Use Policy" },
    { id: "intellectual-property", label: "5. Intellectual Property Rights" },
    { id: "user-content", label: "6. User Content & Data" },
    { id: "limitation", label: "7. Limitation of Liability" },
    { id: "contact", label: "8. Contact Information" },
  ];

  return (
    <PublicPageLayout
      title="Terms of Service"
      lastUpdated={new Date().toLocaleDateString()}
      effectiveDate="June 2026"
      tableOfContents={tableOfContents}
    >
      <p className="text-lg text-slate-300 font-medium">
        Welcome to CyberSense. By using our platform, you agree to these terms. 
        Please read them carefully to understand your rights and responsibilities.
      </p>

      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> By creating an account or using our tools, you agree to follow these rules.
      </div>
      <p>
        By accessing or using the CyberSense platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
      </p>

      <h2 id="description">2. Description of Service</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> We provide security scanning and threat detection tools as-is.
      </div>
      <p>
        CyberSense provides a suite of cybersecurity tools designed to analyze, detect, and alert users about phishing attempts, malware, and other digital threats. The service is subject to continuous updates and may change without prior notice.
      </p>

      <h2 id="accounts">3. User Accounts & Registration</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> Keep your password safe. You're responsible for what happens on your account.
      </div>
      <p>
        To access certain features, you must register for an account. You agree to provide accurate, current, and complete information. You are responsible for safeguarding your password and for all activities that occur under your account.
      </p>

      <h2 id="acceptable-use">4. Acceptable Use Policy</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> Don't misuse our tools to harm others or violate laws.
      </div>
      <p>
        You agree not to use CyberSense to:
      </p>
      <ul>
        <li>Submit legally restricted, highly sensitive PII, or classified data not relevant to a security analysis.</li>
        <li>Attempt to reverse engineer, decompile, or hack the CyberSense infrastructure.</li>
        <li>Use the service for any illegal or unauthorized purpose.</li>
      </ul>

      <h2 id="intellectual-property">5. Intellectual Property Rights</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> We own the platform; you own your submitted data.
      </div>
      <p>
        The CyberSense platform, including its original content, features, detection algorithms, and design, are owned by CyberSense and are protected by international copyright, trademark, and other intellectual property laws.
      </p>

      <h2 id="user-content">6. User Content & Data</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> We scan what you submit to protect you and others, as outlined in our Privacy Policy.
      </div>
      <p>
        By submitting URLs, emails, or files for scanning, you grant CyberSense the right to analyze this content. You represent that you have the right to submit such content for security analysis.
      </p>

      <h2 id="limitation">7. Limitation of Liability</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> We do our best, but we aren't liable if a threat slips through or damages occur.
      </div>
      <p>
        In no event shall CyberSense or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the CyberSense platform.
      </p>

      <h2 id="contact">8. Contact Information</h2>
      <div className="public-section-tldr">
        <strong>TL;DR:</strong> Need help? Email us.
      </div>
      <p>
        If you have any questions about these Terms, please contact us at <a href="mailto:legal@cybersense.io">legal@cybersense.io</a>.
      </p>
    </PublicPageLayout>
  );
}

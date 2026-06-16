import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
          <Shield className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p>
            When you use CyberSense, we collect information that you provide directly to us, such as your email address,
            name, and any URLs, emails, or SMS content you submit for security scanning. We also automatically collect
            basic diagnostic data such as IP address and browser type to ensure the security and functionality of our service.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            The primary purpose of collecting your information is to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Analyze submitted content for phishing, malware, and other security threats.</li>
            <li>Alert you regarding the security status of your submissions.</li>
            <li>Maintain, improve, and secure our detection algorithms.</li>
            <li>Send you important administrative and security notices.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Data Sharing and Threat Intelligence</h2>
          <p>
            CyberSense may share anonymized indicators of compromise (IoCs) with global threat intelligence feeds to help
            protect the broader cybersecurity community. We do not share your personally identifiable information (PII) with
            third parties for marketing purposes.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">4. Data Security</h2>
          <p>
            We implement industry-standard encryption (TLS) for data in transit and AES-256 for data at rest. While we strive
            to use commercially acceptable means to protect your personal information, no method of transmission over the Internet
            is 100% secure.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">5. Your Choices</h2>
          <p>
            You may unsubscribe from non-critical email alerts at any time by clicking the "Unsubscribe" link in our emails.
            Critical security alerts regarding your account will still be sent.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact our privacy team at <a href="mailto:privacy@cybersense.io" className="text-blue-600 hover:underline">privacy@cybersense.io</a>.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <Link to="/" className="text-blue-600 font-medium hover:underline">
            &larr; Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

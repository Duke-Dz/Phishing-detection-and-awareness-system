import { Scale } from "lucide-react";
import {
  LegalIntro,
  LegalList,
  LegalListItem,
  LegalNotice,
  LegalSection,
  LegalSummary,
  PublicPageLayout,
} from "../components/layout/PublicPageLayout";

const tableOfContents = [
  { id: "agreement", label: "Agreement to these terms" },
  { id: "service", label: "The CyberSense service" },
  { id: "accounts", label: "Accounts and access" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "submitted-content", label: "Content you submit" },
  { id: "accuracy", label: "Detection results" },
  { id: "availability", label: "Service availability" },
  { id: "intellectual-property", label: "Intellectual property" },
  { id: "liability", label: "Liability" },
  { id: "termination", label: "Suspension and termination" },
  { id: "changes", label: "Changes to these terms" },
  { id: "contact", label: "Contact us" },
];

export default function TermsOfService() {
  return (
    <PublicPageLayout
      title="Terms of Service"
      subtitle="These terms explain the rules for using CyberSense, what you can expect from the platform, and the responsibilities that come with your account."
      icon={Scale}
      documentType="Service agreement"
      tableOfContents={tableOfContents}
    >
      <LegalIntro>
        Please read these Terms of Service before using CyberSense. By creating an account, accessing the platform, or submitting content for analysis, you agree to these terms. If you do not agree, do not use the service.
      </LegalIntro>

      <LegalSection id="agreement" number="1" title="Agreement to these terms" summary="When these terms apply to you.">
        <LegalSummary>Using CyberSense means that you accept this agreement and our Privacy Policy.</LegalSummary>
        <p>These terms form an agreement between you and CyberSense. You must be legally capable of entering into this agreement and must comply with the laws that apply where you use the service.</p>
      </LegalSection>

      <LegalSection id="service" number="2" title="The CyberSense service" summary="What the platform provides.">
        <p>CyberSense provides tools for examining URLs, email content, and SMS messages for indicators commonly associated with phishing and related digital threats. The platform may also provide reporting, security notifications, threat history, and awareness training.</p>
        <p>We may improve, replace, add, or retire features as the service evolves. Material changes that significantly affect users will be communicated through the platform or an appropriate contact channel.</p>
      </LegalSection>

      <LegalSection id="accounts" number="3" title="Accounts and access" summary="Your responsibility for account security.">
        <LegalSummary>Use accurate information, protect your password, and notify us if you suspect unauthorized access.</LegalSummary>
        <LegalList>
          <LegalListItem>Provide current and accurate registration information.</LegalListItem>
          <LegalListItem>Keep your sign-in credentials private and use a strong, unique password.</LegalListItem>
          <LegalListItem>Do not share an account or attempt to access another user’s account.</LegalListItem>
          <LegalListItem>Tell us promptly if you believe your account or session has been compromised.</LegalListItem>
        </LegalList>
        <p>You are responsible for activity performed through your account unless that activity resulted from a security failure attributable to CyberSense.</p>
      </LegalSection>

      <LegalSection id="acceptable-use" number="4" title="Acceptable use" summary="How the security tools may and may not be used.">
        <p>You may use CyberSense for legitimate personal, educational, defensive-security, and authorized organizational purposes. You must not:</p>
        <LegalList>
          <LegalListItem>Use the platform to facilitate fraud, harassment, unauthorized access, malware delivery, or any unlawful activity.</LegalListItem>
          <LegalListItem>Probe, disrupt, overload, bypass, or interfere with the platform or its security controls.</LegalListItem>
          <LegalListItem>Reverse engineer or extract protected source code, detection logic, or proprietary datasets except where applicable law expressly permits it.</LegalListItem>
          <LegalListItem>Submit classified information, credentials, payment data, sensitive personal information, or content you are not authorized to analyze.</LegalListItem>
          <LegalListItem>Automate requests in a way that exceeds documented limits or negatively affects other users.</LegalListItem>
        </LegalList>
      </LegalSection>

      <LegalSection id="submitted-content" number="5" title="Content you submit" summary="Your rights and our limited permission to analyze content.">
        <LegalSummary>You retain ownership of your content. You permit us to process it only as needed to provide and secure the service.</LegalSummary>
        <p>You confirm that you have the right to submit URLs, messages, files, or other content for analysis. You grant CyberSense a limited, non-exclusive permission to process that content, generate security results, retain necessary records, and improve platform safety as described in our Privacy Policy.</p>
      </LegalSection>

      <LegalSection id="accuracy" number="6" title="Detection results and security decisions" summary="Why results require informed judgment.">
        <LegalNotice title="CyberSense supports security decisions; it does not replace professional judgment.">
          Automated detection can produce false positives or fail to identify a threat. Do not rely on a single scan result where safety, finances, legal obligations, or sensitive systems are at risk.
        </LegalNotice>
        <p>Results are informational and should be assessed alongside the source, context, and other security controls. You remain responsible for decisions made using the output of the service.</p>
      </LegalSection>

      <LegalSection id="availability" number="7" title="Service availability" summary="Maintenance, updates, and interruptions.">
        <p>We aim to operate CyberSense reliably, but uninterrupted availability is not guaranteed. Maintenance, security incidents, upstream providers, connectivity issues, or circumstances outside our control may temporarily affect the service.</p>
      </LegalSection>

      <LegalSection id="intellectual-property" number="8" title="Intellectual property" summary="Ownership of the platform and brand.">
        <p>CyberSense and its licensors retain all rights in the platform, software, interface, branding, documentation, detection methods, and original content. These terms do not transfer ownership to you. Feedback may be used to improve the platform without an obligation to compensate you.</p>
      </LegalSection>

      <LegalSection id="liability" number="9" title="Disclaimers and limitation of liability" summary="Reasonable limits on responsibility.">
        <p>To the extent permitted by applicable law, the service is provided on an “as available” basis without warranties that every threat will be detected or that every result will be error-free. CyberSense is not liable for indirect, incidental, special, consequential, or punitive losses arising from use of the service.</p>
        <p>Nothing in these terms excludes liability that cannot lawfully be excluded or limits rights granted to you by mandatory consumer-protection law.</p>
      </LegalSection>

      <LegalSection id="termination" number="10" title="Suspension and termination" summary="When access may end.">
        <p>You may stop using CyberSense at any time. We may restrict or suspend access where reasonably necessary to protect users, investigate misuse, comply with law, or address a serious breach of these terms. Where appropriate, we will provide notice and an opportunity to resolve the issue.</p>
      </LegalSection>

      <LegalSection id="changes" number="11" title="Changes to these terms" summary="How updates will be communicated.">
        <p>We may update these terms to reflect changes in the service, law, or security practices. The effective date at the top of this page will be updated, and material changes will be communicated appropriately. Continued use after an update means you accept the revised terms.</p>
      </LegalSection>

      <LegalSection id="contact" number="12" title="Contact us" summary="Questions about this agreement.">
        <p>For questions about these terms, contact <a className="font-bold text-cyber-700 underline decoration-cyber-200 underline-offset-4 transition hover:text-cyber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 dark:text-sky-400 dark:decoration-sky-800 dark:hover:text-sky-300" href="mailto:legal@cybersense.io">legal@cybersense.io</a>.</p>
      </LegalSection>
    </PublicPageLayout>
  );
}

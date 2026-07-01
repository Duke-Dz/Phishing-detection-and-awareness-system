import { ShieldCheck } from "lucide-react";
import {
  LegalList,
  LegalListItem,
  LegalNotice,
  LegalSection,
  LegalSummary,
  PublicPageLayout,
} from "../components/layout/PublicPageLayout";

const tableOfContents = [
  { id: "scope", label: "Scope" },
  { id: "collection", label: "Data collected" },
  { id: "use", label: "How data is used" },
  { id: "scans", label: "Scan content" },
  { id: "sharing", label: "Sharing" },
  { id: "retention", label: "Retention" },
  { id: "security", label: "Security" },
  { id: "rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "updates", label: "Policy updates" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPolicy() {
  return (
    <PublicPageLayout
      title="Privacy Policy"
      subtitle="A clear explanation of the information CyberSense handles, why it is needed, and the choices available to you."
      icon={ShieldCheck}
      documentType="Privacy notice"
      tableOfContents={tableOfContents}
    >
      <div className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-[15px] leading-7 text-slate-600">
        CyberSense is designed to help you assess suspicious digital content. This notice applies when you use our website, account features, scanning tools, reports, notifications, and awareness resources.
      </div>

      <LegalSection id="scope" number="1" title="Scope of this policy" summary="Where this privacy notice applies.">
        <LegalSummary>This policy covers personal information processed through the CyberSense platform and related communications.</LegalSummary>
        <p>It does not govern third-party websites or services that may be linked from CyberSense. Those providers apply their own privacy practices, and we encourage you to review them separately.</p>
      </LegalSection>

      <LegalSection id="collection" number="2" title="Information we collect" summary="Information you provide and technical data generated through use.">
        <p>Depending on how you use CyberSense, we may process:</p>
        <LegalList>
          <LegalListItem><strong className="text-slate-900">Account information:</strong> your name, email address, password hash, role, preferences, and account status.</LegalListItem>
          <LegalListItem><strong className="text-slate-900">Security submissions:</strong> URLs, email text, SMS content, report notes, and attachments you intentionally submit.</LegalListItem>
          <LegalListItem><strong className="text-slate-900">Analysis records:</strong> risk scores, classifications, detected indicators, scan history, and report outcomes.</LegalListItem>
          <LegalListItem><strong className="text-slate-900">Usage and device data:</strong> IP address, browser or device information, request timestamps, session records, and security-event logs.</LegalListItem>
          <LegalListItem><strong className="text-slate-900">Communications:</strong> support requests, notification preferences, and messages you send to us.</LegalListItem>
        </LegalList>
      </LegalSection>

      <LegalSection id="use" number="3" title="How we use information" summary="The purposes behind processing.">
        <LegalList>
          <LegalListItem>Provide scans, reports, account features, training, and security notifications.</LegalListItem>
          <LegalListItem>Authenticate users, manage sessions, enforce role-based access, and prevent abuse.</LegalListItem>
          <LegalListItem>Investigate errors, maintain reliability, and protect the platform and its users.</LegalListItem>
          <LegalListItem>Improve detection quality using appropriately controlled and minimized data.</LegalListItem>
          <LegalListItem>Comply with applicable legal obligations and respond to valid legal requests.</LegalListItem>
        </LegalList>
        <p>Where required, we rely on your consent. In other situations, processing may be necessary to provide the service, protect legitimate security interests, or meet a legal obligation.</p>
      </LegalSection>

      <LegalSection id="scans" number="4" title="Security submissions and scan content" summary="Important guidance before submitting content.">
        <LegalNotice title="Remove unnecessary sensitive information before submitting content.">
          Do not submit passwords, authentication codes, payment-card details, government identifiers, health information, classified material, or personal data that is not needed for the security analysis.
        </LegalNotice>
        <p>Submitted content is processed to generate a security assessment and maintain your scan or report history. Some threat indicators, such as malicious domains or file characteristics, may be retained separately from personal account information to protect users and improve detection.</p>
      </LegalSection>

      <LegalSection id="sharing" number="5" title="When information may be shared" summary="Limited circumstances involving other parties.">
        <LegalSummary>We do not sell your personal information or provide it to advertisers.</LegalSummary>
        <p>Information may be shared with carefully selected infrastructure, email, security-intelligence, or support providers where necessary to operate CyberSense. These providers are expected to process information only for the agreed service and apply appropriate safeguards.</p>
        <p>We may also disclose information where required by law, to address fraud or abuse, to protect people or systems from harm, or as part of a corporate transaction subject to suitable confidentiality protections.</p>
      </LegalSection>

      <LegalSection id="retention" number="6" title="Data retention" summary="How long information is kept.">
        <p>We retain information only for as long as reasonably necessary for the purposes described in this policy, including account operation, security, dispute resolution, and legal compliance. Retention periods vary by record type. When information is no longer needed, it is deleted, anonymized, or securely isolated from active use.</p>
      </LegalSection>

      <LegalSection id="security" number="7" title="How we protect information" summary="Administrative and technical safeguards.">
        <p>CyberSense applies layered safeguards including access controls, password hashing, transport encryption where deployed, session management, audit and security-event logging, rate limits, and least-privilege role enforcement.</p>
        <p>No online service can guarantee absolute security. You can help by using a unique password, protecting your device, signing out of shared systems, and reporting suspicious account activity promptly.</p>
      </LegalSection>

      <LegalSection id="rights" number="8" title="Your choices and rights" summary="Ways to manage your information.">
        <p>Depending on your location and applicable law, you may have the right to:</p>
        <LegalList>
          <LegalListItem>Access or receive a copy of personal information associated with your account.</LegalListItem>
          <LegalListItem>Correct inaccurate or incomplete account information.</LegalListItem>
          <LegalListItem>Request deletion or restriction of certain information.</LegalListItem>
          <LegalListItem>Object to or withdraw consent for eligible processing.</LegalListItem>
          <LegalListItem>Unsubscribe from non-essential email notifications.</LegalListItem>
        </LegalList>
        <p>Some information may need to be retained where required for security, fraud prevention, legal compliance, or the establishment of legal claims.</p>
      </LegalSection>

      <LegalSection id="children" number="9" title="Children’s privacy" summary="The service is not directed to young children.">
        <p>CyberSense is not intended for children who cannot legally consent to online services in their jurisdiction. If you believe a child has provided personal information without appropriate authorization, contact us so we can investigate and take suitable action.</p>
      </LegalSection>

      <LegalSection id="updates" number="10" title="Changes to this policy" summary="How privacy updates are communicated.">
        <p>We may update this notice as the platform, law, or our practices change. The revised effective date will appear at the top of the page. Material changes will be communicated through the platform or another appropriate channel.</p>
      </LegalSection>

      <LegalSection id="contact" number="11" title="Contact our privacy team" summary="Questions, requests, or concerns.">
        <p>Contact <a className="font-bold text-cyber-700 underline decoration-cyber-200 underline-offset-4" href="mailto:privacy@cybersense.io">privacy@cybersense.io</a> with privacy questions or rights requests. We may need to verify your identity before completing a request.</p>
      </LegalSection>
    </PublicPageLayout>
  );
}

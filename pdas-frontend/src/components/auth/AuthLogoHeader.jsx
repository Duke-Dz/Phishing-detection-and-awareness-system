/**
 * AuthLogoHeader — Stacked animated logo + "CyberSense" wordmark
 * Used at the top of all single-layout auth pages.
 * Wraps the existing CyberSenseLogo (with orbit animation) in a vertical stacked layout.
 */
import CyberSenseLogo from "./CyberSenseLogo";

export default function AuthLogoHeader() {
  return (
    <div className="auth-logo-header">
      <CyberSenseLogo variant="compact" stacked />
    </div>
  );
}

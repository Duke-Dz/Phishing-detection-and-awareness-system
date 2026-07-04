require("dotenv").config({ quiet: true });

const { closeMailService, getMailStatus, sendMail, verifyConnection } = require("../src/services/mailService");

const recipient = process.argv[2];

const run = async () => {
  const available = await verifyConnection();
  if (!available) {
    const status = getMailStatus();
    throw new Error(`SMTP verification failed (${status.last_error || "unknown error"})`);
  }

  process.stdout.write("SMTP connection verified successfully.\n");

  if (!recipient) {
    process.stdout.write("No recipient supplied; verification-only mode completed.\n");
    process.stdout.write("To send a test message: npm run mail:test -- you@example.com\n");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("Provide a valid recipient email address.");
  }

  const sentAt = new Date().toISOString();
  const delivery = await sendMail({
    to: recipient,
    subject: "CyberSense SMTP diagnostic",
    essential: true,
    text: `CyberSense SMTP delivery is working.\nSent at: ${sentAt}`,
    html: `<p>CyberSense SMTP delivery is working.</p><p>Sent at: <strong>${sentAt}</strong></p>`,
  });

  process.stdout.write(`Test message accepted by SMTP: ${delivery.messageId}\n`);
};

run()
  .catch((error) => {
    process.stderr.write(`Mail diagnostic failed: ${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => closeMailService());

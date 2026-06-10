"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("awareness_content", [
      {
        content_id: "00000000-0000-4000-b000-000000000001",
        title: "Recognizing Phishing Emails",
        category: "email",
        description: "Learn to identify the key characteristics of phishing emails including suspicious sender addresses, urgency tactics, and malicious attachments.",
        body: "Phishing emails are one of the most common cyber threats. They typically impersonate trusted organizations to trick you into revealing sensitive information.\n\n## Key Red Flags\n\n1. **Suspicious Sender Address**: Look beyond the display name. The actual email address often uses misspelled domains (e.g., support@paypa1.com instead of support@paypal.com).\n\n2. **Urgency and Fear Tactics**: Phrases like \"Your account will be suspended\" or \"Act within 24 hours\" are designed to bypass your critical thinking.\n\n3. **Generic Greetings**: Legitimate companies usually address you by name. \"Dear Customer\" or \"Dear User\" is suspicious.\n\n4. **Suspicious Links**: Hover over links before clicking. The displayed text may say \"paypal.com\" but the actual URL points elsewhere.\n\n5. **Unexpected Attachments**: Never open attachments from unknown senders, especially .exe, .zip, or macro-enabled documents.\n\n## What To Do\n\n- Report suspicious emails using the PDAS scan feature\n- Never click links in unexpected emails\n- Verify requests by contacting the organization directly through their official website",
        difficulty: "beginner",
        duration_minutes: 10,
        is_published: true,
        created_by: "00000000-0000-4000-a000-000000000001",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000002",
        title: "URL Safety Analysis",
        category: "url",
        description: "Understand how to analyze URLs for signs of phishing including domain spoofing, URL shorteners, and suspicious parameters.",
        body: "Malicious URLs are the primary delivery mechanism for phishing attacks. Learning to analyze them is a critical security skill.\n\n## Anatomy of a URL\n\n`https://subdomain.domain.tld/path?parameters`\n\nThe most important part is the **domain** — everything else can be faked.\n\n## Common URL Tricks\n\n1. **Typosquatting**: `g00gle.com` instead of `google.com`\n2. **Subdomain Abuse**: `paypal.com.malicious-site.com` — the real domain here is `malicious-site.com`\n3. **URL Shorteners**: `bit.ly/xyz123` hides the real destination\n4. **IP Addresses**: `http://192.168.1.1/login` — legitimate sites rarely use raw IPs\n5. **@ Trick**: `http://google.com@evil.com` — the browser actually navigates to `evil.com`\n\n## How PDAS Helps\n\nOur URL scanner checks against 70+ threat intelligence engines, detects typosquatting, analyzes redirect chains, and examines page content for credential harvesting forms.",
        difficulty: "intermediate",
        duration_minutes: 15,
        is_published: true,
        created_by: "00000000-0000-4000-a000-000000000001",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000003",
        title: "SMS Phishing (Smishing) Threats",
        category: "sms",
        description: "Recognize and defend against SMS-based phishing attacks that target mobile users through text messages.",
        body: "Smishing (SMS phishing) uses text messages to trick victims. These attacks are increasingly common because people trust text messages more than emails.\n\n## Common Smishing Patterns\n\n1. **Bank Alerts**: \"Your KCB account has been locked. Click here to verify: [malicious link]\"\n2. **Delivery Notifications**: \"Your package delivery failed. Reschedule at: [malicious link]\"\n3. **Prize Scams**: \"Congratulations! You won KSh 50,000 from Safaricom. Claim now: [malicious link]\"\n4. **M-Pesa Fraud**: \"Your M-Pesa PIN has expired. Update at: [malicious link]\"\n\n## Protection Tips\n\n- Never click links in unexpected SMS messages\n- Contact organizations through official channels\n- Use PDAS to scan suspicious SMS content\n- Report smishing attempts to your carrier",
        difficulty: "beginner",
        duration_minutes: 8,
        is_published: true,
        created_by: "00000000-0000-4000-a000-000000000001",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000004",
        title: "Advanced Social Engineering Tactics",
        category: "social",
        description: "Deep dive into sophisticated social engineering techniques used in targeted attacks including spear phishing, pretexting, and business email compromise.",
        body: "Advanced social engineering goes beyond mass phishing campaigns. These are targeted, well-researched attacks.\n\n## Techniques\n\n1. **Spear Phishing**: Highly targeted emails using personal information gathered from social media\n2. **Business Email Compromise (BEC)**: Attackers impersonate executives to authorize fraudulent transfers\n3. **Pretexting**: Creating a fabricated scenario to extract information\n4. **Watering Hole**: Compromising websites frequently visited by the target group\n\n## Defence Strategies\n\n- Verify unusual requests through a different communication channel\n- Limit personal information shared on social media\n- Implement multi-factor authentication on all accounts\n- Conduct regular security awareness training",
        difficulty: "advanced",
        duration_minutes: 20,
        is_published: false,
        created_by: "00000000-0000-4000-a000-000000000001",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("awareness_content", {
      content_id: [
        "00000000-0000-4000-b000-000000000001",
        "00000000-0000-4000-b000-000000000002",
        "00000000-0000-4000-b000-000000000003",
        "00000000-0000-4000-b000-000000000004",
      ],
    });
  },
};

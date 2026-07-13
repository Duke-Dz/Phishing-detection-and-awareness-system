"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Look up whether the seeded admin user exists to satisfy FK constraint
    const [rows] = await queryInterface.sequelize.query(
      `SELECT user_id FROM users WHERE user_id = '00000000-0000-4000-a000-000000000001' LIMIT 1`
    );
    const ADMIN = rows.length ? "00000000-0000-4000-a000-000000000001" : null;
    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 86400000);

    await queryInterface.bulkInsert("awareness_content", [
      // ─── EMAIL CATEGORY (5 lessons) ────────────────────────────────────
      {
        content_id: "00000000-0000-4000-b000-000000000001",
        title: "Recognizing Phishing Emails",
        category: "email",
        description: "Learn to identify the key characteristics of phishing emails including suspicious sender addresses, urgency tactics, and malicious attachments.",
        body: `Phishing emails are one of the most common cyber threats. They typically impersonate trusted organizations to trick you into revealing sensitive information.

## Key Red Flags

1. **Suspicious Sender Address**: Look beyond the display name. The actual email address often uses misspelled domains (e.g., support@paypa1.com instead of support@paypal.com).

2. **Urgency and Fear Tactics**: Phrases like "Your account will be suspended" or "Act within 24 hours" are designed to bypass your critical thinking.

3. **Generic Greetings**: Legitimate companies usually address you by name. "Dear Customer" or "Dear User" is suspicious.

4. **Suspicious Links**: Hover over links before clicking. The displayed text may say "paypal.com" but the actual URL points elsewhere.

5. **Unexpected Attachments**: Never open attachments from unknown senders, especially .exe, .zip, or macro-enabled documents.

## What To Do

- Report suspicious emails using the CyberSense scan feature
- Never click links in unexpected emails
- Verify requests by contacting the organization directly through their official website`,
        difficulty: "beginner",
        duration_minutes: 10,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(30),
        updated_at: daysAgo(30),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000005",
        title: "Email Header Analysis",
        category: "email",
        description: "Learn how to read raw email headers to trace the true origin of an email, detect spoofing, and verify authentication results like SPF, DKIM, and DMARC.",
        body: `Email headers contain a wealth of forensic information that reveals the true journey and authenticity of an email message.

## Understanding Email Headers

Every email carries hidden metadata called headers. While the visible "From" field can be easily faked, the headers tell the real story.

## Key Headers to Examine

1. **Received: headers** — Read bottom-to-top to trace the email's path. Each mail server adds a "Received:" entry as the message passes through it.

2. **Return-Path** — The actual bounce-back address. If it differs wildly from the "From" address, that's suspicious.

3. **Message-ID** — A unique identifier. Legitimate services use their own domain (e.g., @mail.google.com). Random or mismatched domains are red flags.

## Authentication Results

Modern email security relies on three protocols:

- **SPF (Sender Policy Framework)**: Checks if the sending server is authorized by the domain. Look for \`spf=pass\`.
- **DKIM (DomainKeys Identified Mail)**: Verifies the email wasn't tampered with in transit. Look for \`dkim=pass\`.
- **DMARC (Domain-based Message Authentication)**: Combines SPF and DKIM with a domain policy. Look for \`dmarc=pass\`.

## How to View Headers

- **Gmail**: Open the email → Three dots → "Show original"
- **Outlook**: Open the email → File → Properties → Internet Headers
- **Apple Mail**: View → Message → All Headers

## Practice Exercise

Next time you receive a suspicious email, view the headers and check:
1. Does the Return-Path match the From address?
2. Do SPF, DKIM, and DMARC all pass?
3. Do the Received headers show a logical geographic path?`,
        difficulty: "advanced",
        duration_minutes: 20,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(25),
        updated_at: daysAgo(25),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000006",
        title: "Business Email Compromise (BEC)",
        category: "email",
        description: "Understand how attackers use Business Email Compromise to impersonate executives and trick employees into making fraudulent wire transfers or sharing sensitive data.",
        body: `Business Email Compromise (BEC) is a sophisticated scam that has caused over $50 billion in losses globally since 2013 according to the FBI.

## What is BEC?

Unlike mass phishing campaigns, BEC attacks are carefully targeted. Attackers research companies, identify key personnel, and craft highly convincing emails that impersonate executives, vendors, or business partners.

## Common BEC Scenarios

### 1. CEO Fraud
An attacker impersonates the CEO and emails the finance department: "I need an urgent wire transfer of $45,000 to this account for a confidential acquisition. Don't discuss this with anyone."

### 2. Vendor Impersonation
Attackers compromise or spoof a known vendor's email and send an updated invoice with different banking details.

### 3. Payroll Diversion
An attacker impersonates an employee and requests the HR department to change their direct deposit information to a fraudulent account.

### 4. Attorney Impersonation
Fake lawyers contact employees claiming to handle a confidential, time-sensitive matter requiring immediate payment.

## Red Flags

- Requests for urgency and secrecy
- Changes to payment instructions
- Emails from executives that bypass normal approval processes
- Pressure to act before verifying
- Slight variations in email addresses (john.ceo@company.co vs john.ceo@company.com)

## Prevention

1. **Verify by phone**: Always confirm payment requests through a known phone number (not one from the email)
2. **Two-person authorization**: Require dual approval for all wire transfers
3. **Email authentication**: Implement SPF, DKIM, and DMARC on your domain
4. **Employee training**: Regular awareness sessions on BEC tactics`,
        difficulty: "intermediate",
        duration_minutes: 15,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(22),
        updated_at: daysAgo(22),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000007",
        title: "Malicious Email Attachments",
        category: "email",
        description: "Learn which email attachment types are most dangerous, how malware hides inside documents, and safe practices for handling attachments from any source.",
        body: `Email attachments remain one of the primary delivery methods for malware, ransomware, and trojans.

## Most Dangerous File Types

### High Risk
- **.exe, .scr, .bat, .cmd** — Executable files that run code directly
- **.js, .vbs, .wsf** — Script files that can execute malicious commands
- **.zip, .rar, .7z** — Archives that may hide malicious files inside (especially password-protected ones where the password is in the email body)

### Medium Risk
- **.docm, .xlsm, .pptm** — Macro-enabled Office documents
- **.pdf** — Can contain embedded scripts and exploit viewers
- **.html, .htm** — Can redirect to phishing sites or execute scripts

### Lower Risk (but not zero)
- **.docx, .xlsx, .pptx** — Modern Office formats (still check for embedded objects)
- **.jpg, .png, .gif** — Image files (rarely dangerous, but can exploit viewer vulnerabilities)

## How Malware Hides in Documents

1. **Macro Attacks**: "Enable macros to view this document" is almost always malicious
2. **OLE Objects**: Embedded objects in documents that execute when clicked
3. **DDE Attacks**: Dynamic Data Exchange links that fetch and execute remote code
4. **Steganography**: Malware code hidden within image data

## Safe Attachment Practices

1. **Never enable macros** from unknown sources
2. **Preview before opening** — Use your email client's preview pane
3. **Scan with CyberSense** before opening suspicious attachments
4. **Open in a sandbox** — Use virtual machines for truly suspicious files
5. **Verify with the sender** through a different channel
6. **Keep software updated** — Most attachment exploits target known vulnerabilities`,
        difficulty: "intermediate",
        duration_minutes: 12,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(18),
        updated_at: daysAgo(18),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000008",
        title: "Email Spoofing & Impersonation",
        category: "email",
        description: "Discover how attackers forge the 'From' field in emails to impersonate trusted contacts, and learn techniques to detect spoofed messages.",
        body: `Email spoofing is the act of forging the sender address on an email to make it appear as if it came from someone you trust.

## How Spoofing Works

The email protocol (SMTP) was designed in the 1980s without built-in authentication. The "From" field is essentially self-reported — like writing any return address on a physical letter.

An attacker can send an email that appears to come from "ceo@yourcompany.com" without ever accessing that account.

## Types of Impersonation

### 1. Display Name Spoofing
The easiest trick — the display name shows "John Smith - CEO" but the actual email is random123@gmail.com. Many mobile email clients only show the display name.

### 2. Domain Spoofing
The entire "From" header is forged: the email genuinely appears to come from a legitimate domain. This is prevented by SPF/DKIM/DMARC.

### 3. Lookalike Domains
Attackers register domains that look similar:
- company.com → cornpany.com (rn looks like m)
- company.com → company.co
- company.com → company-secure.com
- company.com → compаny.com (Cyrillic 'а' instead of Latin 'a')

### 4. Reply-To Manipulation
The "From" field looks legitimate but the "Reply-To" is a completely different address controlled by the attacker.

## Detection Tips

1. Always check the actual email address, not just the display name
2. On mobile, tap the sender name to reveal the full address
3. Look for authentication results in email headers
4. Be suspicious of emails that create urgency
5. Use CyberSense's email scanner to verify authenticity`,
        difficulty: "beginner",
        duration_minutes: 10,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(5),
        updated_at: daysAgo(5),
      },

      // ─── URL CATEGORY (4 lessons) ─────────────────────────────────────
      {
        content_id: "00000000-0000-4000-b000-000000000002",
        title: "URL Safety Analysis",
        category: "url",
        description: "Understand how to analyze URLs for signs of phishing including domain spoofing, URL shorteners, and suspicious parameters.",
        body: `Malicious URLs are the primary delivery mechanism for phishing attacks. Learning to analyze them is a critical security skill.

## Anatomy of a URL

\`https://subdomain.domain.tld/path?parameters\`

The most important part is the **domain** — everything else can be faked.

## Common URL Tricks

1. **Typosquatting**: \`g00gle.com\` instead of \`google.com\`
2. **Subdomain Abuse**: \`paypal.com.malicious-site.com\` — the real domain here is \`malicious-site.com\`
3. **URL Shorteners**: \`bit.ly/xyz123\` hides the real destination
4. **IP Addresses**: \`http://192.168.1.1/login\` — legitimate sites rarely use raw IPs
5. **@ Trick**: \`http://google.com@evil.com\` — the browser actually navigates to \`evil.com\`

## How CyberSense Helps

Our URL scanner checks against 70+ threat intelligence engines, detects typosquatting, analyzes redirect chains, and examines page content for credential harvesting forms.`,
        difficulty: "intermediate",
        duration_minutes: 15,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(28),
        updated_at: daysAgo(28),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000009",
        title: "Phishing Website Red Flags",
        category: "url",
        description: "Learn how to identify fake websites designed to steal your credentials by examining visual clues, SSL certificates, and page behavior.",
        body: `Phishing websites are designed to look identical to legitimate sites, but several telltale signs can help you identify them.

## Visual Red Flags

### 1. URL Bar Examination
- Check for HTTPS — but remember, attackers can get free SSL certificates too
- Look at the full domain name carefully
- Watch for unicode/punycode tricks in the URL

### 2. Page Quality Issues
- Broken images or missing logos
- Poor grammar and spelling
- Links that don't work or all point to the same page
- Missing footer information (privacy policy, terms, contact info)

### 3. Form Behavior
- Login pages that accept ANY password (they're just harvesting)
- Forms asking for unusual information (SSN on a "bank" login page)
- No "forgot password" or "create account" links

## SSL Certificate Checks

1. Click the padlock icon in your browser
2. View the certificate details
3. Check who issued it and to whom
4. Legitimate companies typically use Extended Validation (EV) or Organization Validation (OV) certificates

## What Happens When You Enter Credentials

When you type your password on a phishing site:
1. Your credentials are immediately sent to the attacker's server
2. You may be redirected to the real website to avoid suspicion
3. The attacker may immediately log into your real account
4. If you reuse passwords, all accounts with that password are compromised

## Best Practices

- Always navigate to websites by typing the URL directly or using bookmarks
- Never log in through a link in an email or text message
- Use a password manager — it won't autofill on fake domains
- Enable two-factor authentication on all important accounts
- Use CyberSense to scan suspicious URLs before visiting them`,
        difficulty: "beginner",
        duration_minutes: 12,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(20),
        updated_at: daysAgo(20),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000010",
        title: "Safe Browsing Habits",
        category: "url",
        description: "Develop daily browsing habits that protect you from drive-by downloads, malvertising, and man-in-the-browser attacks.",
        body: `Your browsing habits directly impact your cybersecurity. Developing safe practices can prevent the majority of web-based attacks.

## Essential Safe Browsing Rules

### 1. Keep Everything Updated
- Browser updates patch security vulnerabilities
- Enable automatic updates for your OS and browser
- Update browser extensions regularly or remove unused ones

### 2. Use HTTPS Everywhere
- Look for the padlock icon before entering any sensitive data
- Most modern browsers warn you about insecure connections
- Consider using browser extensions that enforce HTTPS

### 3. Be Cautious with Downloads
- Only download software from official sources
- Verify file hashes when provided
- Scan downloads with antivirus before opening
- Be wary of "Your Flash Player is out of date" popups — Flash is dead

### 4. Manage Browser Extensions Wisely
- Only install extensions from official stores
- Review permissions requested by extensions
- Remove extensions you no longer use
- Some malicious extensions can read all your browsing data

## Understanding Drive-by Downloads

Drive-by downloads occur when visiting a compromised website automatically installs malware without your knowledge. They exploit:
- Outdated browser versions
- Vulnerable plugins (Java, Flash, Silverlight)
- Unpatched operating system vulnerabilities

## Malvertising

Malicious advertisements can appear on legitimate websites:
- They exploit ad network vulnerabilities
- Can redirect you to exploit kits
- Sometimes infect you just by being displayed
- Use an ad blocker for protection

## Public Wi-Fi Safety

- Avoid accessing banking or sensitive accounts on public Wi-Fi
- Use a VPN when on untrusted networks
- Verify the network name with the establishment
- Disable auto-connect to open networks`,
        difficulty: "beginner",
        duration_minutes: 10,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(15),
        updated_at: daysAgo(15),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000011",
        title: "Understanding HTTPS & SSL/TLS",
        category: "url",
        description: "Deep dive into how HTTPS secures your web connections, what SSL/TLS certificates really mean, and why the padlock icon isn't always enough.",
        body: `HTTPS is the secure version of HTTP, the protocol used to transfer data between your browser and a website. Understanding it is crucial for online safety.

## How HTTPS Works

1. **Your browser connects** to the server and requests a secure connection
2. **The server sends its SSL certificate** containing its public key
3. **Your browser verifies** the certificate with a trusted Certificate Authority (CA)
4. **A session key is generated** and encrypted with the server's public key
5. **All data is encrypted** with the session key for the rest of the connection

## What the Padlock Means (and Doesn't Mean)

### What it DOES mean:
- Your connection to the site is encrypted
- Data in transit cannot be read by eavesdroppers
- The site has a valid SSL certificate

### What it DOES NOT mean:
- The website is safe or legitimate
- The site won't steal your data
- The site is who they claim to be (for DV certificates)

## Certificate Types

1. **Domain Validation (DV)**: Only proves domain ownership. Free from Let's Encrypt. Attackers can easily get these.
2. **Organization Validation (OV)**: Verifies the organization behind the domain. More trustworthy.
3. **Extended Validation (EV)**: Highest level of verification. Shows company name in the certificate details.

## Common SSL Attacks

- **SSL Stripping**: Downgrading your connection from HTTPS to HTTP
- **Certificate Spoofing**: Using a fake certificate (your browser should warn you)
- **Expired Certificates**: May indicate a neglected or compromised server

## What to Check

1. Is the connection HTTPS? (padlock icon present)
2. Is the certificate valid and not expired?
3. Does the certificate match the domain you're visiting?
4. Has your browser flagged any warnings?`,
        difficulty: "advanced",
        duration_minutes: 18,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(10),
        updated_at: daysAgo(10),
      },

      // ─── SMS CATEGORY (4 lessons) ─────────────────────────────────────
      {
        content_id: "00000000-0000-4000-b000-000000000003",
        title: "SMS Phishing (Smishing) Threats",
        category: "sms",
        description: "Recognize and defend against SMS-based phishing attacks that target mobile users through text messages.",
        body: `Smishing (SMS phishing) uses text messages to trick victims. These attacks are increasingly common because people trust text messages more than emails.

## Common Smishing Patterns

1. **Bank Alerts**: "Your KCB account has been locked. Click here to verify: [malicious link]"
2. **Delivery Notifications**: "Your package delivery failed. Reschedule at: [malicious link]"
3. **Prize Scams**: "Congratulations! You won KSh 50,000 from Safaricom. Claim now: [malicious link]"
4. **M-Pesa Fraud**: "Your M-Pesa PIN has expired. Update at: [malicious link]"

## Protection Tips

- Never click links in unexpected SMS messages
- Contact organizations through official channels
- Use CyberSense to scan suspicious SMS content
- Report smishing attempts to your carrier`,
        difficulty: "beginner",
        duration_minutes: 8,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(26),
        updated_at: daysAgo(26),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000012",
        title: "M-Pesa & Mobile Money Scams",
        category: "sms",
        description: "Learn about common M-Pesa and mobile money scams in Kenya and East Africa, including SIM swap attacks, fake agent fraud, and reversal scams.",
        body: `Mobile money services like M-Pesa have transformed financial access in Africa, but they've also created new opportunities for scammers.

## Common M-Pesa Scams

### 1. Fake M-Pesa Messages
Scammers send SMS messages that look like official Safaricom/M-Pesa notifications:
- "You have received KSh 5,000 from 0712XXXXXX. Reply with your PIN to confirm."
- M-Pesa NEVER asks for your PIN via SMS

### 2. Accidental Transfer Scam
- Scammer sends you a fake M-Pesa confirmation message
- Calls you claiming they sent money "by mistake"
- Asks you to "reverse" or "send back" money you never actually received
- Always check your actual M-Pesa balance before responding

### 3. SIM Swap Fraud
- Attacker gathers your personal information from social media
- Visits a Safaricom shop with fake ID claiming to be you
- Gets a new SIM card with your number
- Gains access to your M-Pesa, bank OTPs, and social media accounts

### 4. Fake Agent Scam
- Scammer poses as an M-Pesa agent
- Asks you to dial USSD codes that actually transfer money
- "*334#" or similar codes may look harmless but initiate transfers

### 5. Promotion/Prize Fraud
- "Safaricom Platinum Member" or "You've won a promotion"
- Asks you to send a small "processing fee"
- No legitimate promotion requires you to send money

## Protection Measures

1. **Never share your M-Pesa PIN** with anyone, including Safaricom employees
2. **Verify your balance** before responding to "accidental transfer" claims
3. **Register for SIM registration alerts** to detect SIM swap attempts
4. **Don't dial codes** that strangers ask you to
5. **Use CyberSense** to scan suspicious SMS messages before acting on them`,
        difficulty: "beginner",
        duration_minutes: 12,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(14),
        updated_at: daysAgo(14),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000013",
        title: "OTP & Verification Code Scams",
        category: "sms",
        description: "Understand why you should never share OTPs and verification codes, how attackers trick you into revealing them, and what to do if you've been compromised.",
        body: `One-Time Passwords (OTPs) and verification codes are the last line of defense for your accounts. Attackers have developed sophisticated methods to steal them.

## Why OTPs Matter

OTPs are designed to prove YOU are the one logging in. They add a second factor beyond your password. Sharing them defeats their entire purpose.

## How Attackers Steal OTPs

### 1. Social Engineering Calls
"Hello, this is Safaricom. We're upgrading your account security. Please read me the code we just sent to verify your identity."

### 2. Phishing Pages with Real-Time Relay
- Attacker creates a fake login page
- You enter your email and password
- Attacker immediately uses those on the real site
- The real site sends YOU the OTP
- The fake page asks you to enter the OTP
- Attacker uses it within seconds

### 3. SIM Swap Attacks
- Attacker transfers your phone number to their SIM
- All OTPs are now sent to their phone

### 4. Malware
- Mobile malware can read SMS messages silently
- Some malware specifically watches for OTP patterns

### 5. Man-in-the-Middle
- On compromised networks, attackers can intercept SMS in transit
- This is why app-based authenticators are more secure than SMS OTPs

## Golden Rules

1. **NEVER share an OTP** with anyone, no matter who they claim to be
2. **No legitimate company** will ever call and ask for your OTP
3. **If you receive an unexpected OTP**, someone may have your password — change it immediately
4. **Use authenticator apps** (Google Authenticator, Authy) instead of SMS when possible
5. **Report OTP phishing attempts** to the platform and use CyberSense to scan suspicious messages`,
        difficulty: "intermediate",
        duration_minutes: 10,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(8),
        updated_at: daysAgo(8),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000014",
        title: "WhatsApp & Messaging App Scams",
        category: "sms",
        description: "Identify and protect yourself from scams targeting WhatsApp, Telegram, and other messaging platforms including account takeover and forwarded chain scams.",
        body: `Messaging apps have become a primary target for scammers due to the trust people place in messages from contacts.

## Common WhatsApp Scams

### 1. Account Takeover
- "Hi Mom, this is my new number" — Scammer impersonates a family member
- They then ask for M-Pesa transfers or airtime

### 2. Verification Code Theft
- "I accidentally sent my verification code to your number, can you forward it?"
- This is ALWAYS a scam — they're trying to register YOUR WhatsApp number on their device

### 3. Fake Job Offers
- "Earn KSh 10,000 daily working from home!"
- Requires a "registration fee" or installs malware via a link

### 4. Investment Scams
- Crypto/forex trading groups promising guaranteed returns
- "I turned KSh 5,000 into KSh 200,000 in one week"
- Often use fake screenshots of profits

### 5. Chain Message Scams
- "Forward this to 10 people to get free data/airtime"
- Links in chain messages often lead to phishing sites or malware

## WhatsApp Security Settings

1. **Enable Two-Step Verification**: Settings → Account → Two-Step Verification
2. **Control who sees your info**: Settings → Privacy
3. **Enable fingerprint/face lock**: Settings → Privacy → Fingerprint Lock
4. **Turn off auto-download**: Settings → Storage → Media auto-download

## How to Verify Contacts

- If a "friend" messages from a new number, call their old number first
- Ask a personal question only they would know
- Never send money based solely on a WhatsApp message
- Use CyberSense to scan any suspicious links shared in messages`,
        difficulty: "beginner",
        duration_minutes: 10,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(3),
        updated_at: daysAgo(3),
      },

      // ─── SOCIAL CATEGORY (4 lessons) ──────────────────────────────────
      {
        content_id: "00000000-0000-4000-b000-000000000004",
        title: "Advanced Social Engineering Tactics",
        category: "social",
        description: "Deep dive into sophisticated social engineering techniques used in targeted attacks including spear phishing, pretexting, and business email compromise.",
        body: `Advanced social engineering goes beyond mass phishing campaigns. These are targeted, well-researched attacks.

## Techniques

1. **Spear Phishing**: Highly targeted emails using personal information gathered from social media
2. **Business Email Compromise (BEC)**: Attackers impersonate executives to authorize fraudulent transfers
3. **Pretexting**: Creating a fabricated scenario to extract information
4. **Watering Hole**: Compromising websites frequently visited by the target group

## Defence Strategies

- Verify unusual requests through a different communication channel
- Limit personal information shared on social media
- Implement multi-factor authentication on all accounts
- Conduct regular security awareness training`,
        difficulty: "advanced",
        duration_minutes: 20,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(24),
        updated_at: daysAgo(24),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000015",
        title: "Social Media Privacy & Safety",
        category: "social",
        description: "Learn how attackers harvest personal information from social media profiles and how to configure your privacy settings to protect yourself.",
        body: `Social media is a goldmine for attackers. The information you share publicly can be used to craft targeted phishing attacks, guess security questions, or impersonate you.

## What Attackers Look For

### Personal Information
- Full name, date of birth, hometown
- School and workplace history
- Family members and relationships
- Phone numbers and email addresses
- Daily routines and travel plans

### Security Intelligence
- Names of pets, children, or partners (common passwords/security answers)
- Birthdays and anniversaries
- Favorite sports teams, movies, foods
- Location data and check-ins

## How This Information Gets Used

1. **Crafting spear phishing emails** that reference real events in your life
2. **Guessing security questions**: "What's your mother's maiden name?" is often on Facebook
3. **Impersonation**: Creating fake profiles using your photos
4. **Physical security risks**: Sharing vacation plans tells burglars you're away

## Privacy Hardening Checklist

### Facebook
- [ ] Review who can see your posts (Friends only)
- [ ] Disable public search engine indexing
- [ ] Audit connected apps and remove unused ones
- [ ] Turn off facial recognition
- [ ] Review tagged photos and posts

### Instagram
- [ ] Set account to Private
- [ ] Disable Activity Status
- [ ] Review and remove follower requests
- [ ] Don't share location in real-time

### Twitter/X
- [ ] Protect your tweets if not a public figure
- [ ] Disable location tagging
- [ ] Review connected applications

### LinkedIn
- [ ] Limit profile visibility to connections
- [ ] Disable "People Also Viewed"
- [ ] Be cautious about connection requests from strangers

## The THINK Rule

Before posting anything, THINK:
- **T**rue — Is it true?
- **H**elpful — Is it helpful?
- **I**nspiring — Is it inspiring?
- **N**ecessary — Is it necessary?
- **K**ind — Is it kind?

And add: **S**afe — Could this information be used against me?`,
        difficulty: "beginner",
        duration_minutes: 15,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(19),
        updated_at: daysAgo(19),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000016",
        title: "Romance & Relationship Scams",
        category: "social",
        description: "Understand how cybercriminals exploit emotions through fake romantic relationships online to steal money and personal information.",
        body: `Romance scams are among the most emotionally and financially devastating types of cybercrime. Victims lose an average of $10,000+ according to the FTC.

## How Romance Scams Work

### Phase 1: The Setup
- Attacker creates an attractive fake profile on dating sites, Facebook, or Instagram
- Often uses stolen photos of attractive people (military personnel, doctors, models)
- Profile appears successful and trustworthy

### Phase 2: The Grooming
- Builds an intense emotional connection quickly
- Professes love early ("love bombing")
- Communicates constantly — good morning texts, video calls (often "broken camera")
- Gradually becomes the victim's primary emotional support

### Phase 3: The Ask
- Creates a crisis that requires money:
  - "Stuck abroad with expired passport"
  - "Need surgery but insurance won't cover it"
  - "Investment opportunity we can do together"
  - "Need money for a plane ticket to visit you"
- Starts small and escalates

### Phase 4: The Escalation
- Once you send money, requests increase
- May use emotional manipulation or threats
- "If you really loved me, you'd help"
- May introduce "complications" requiring more money

## Red Flags

1. They can never video call or always have an excuse
2. They become romantic very quickly
3. Their story doesn't add up when you check details
4. They always have a crisis that needs money
5. They refuse to meet in person
6. They ask you to send money via untraceable methods (gift cards, crypto, wire transfers)

## Protection

- **Reverse image search** their profile photos
- **Never send money** to someone you haven't met in person
- **Talk to trusted friends** or family about online relationships
- **Report suspicious profiles** to the platform
- **Trust your instincts** — if it feels too good to be true, it probably is`,
        difficulty: "intermediate",
        duration_minutes: 15,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(12),
        updated_at: daysAgo(12),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000017",
        title: "Deepfakes & AI-Powered Scams",
        category: "social",
        description: "Explore how AI-generated deepfake videos, voice clones, and chatbots are being used for increasingly convincing scams and misinformation.",
        body: `Artificial intelligence has given scammers powerful new tools. Deepfakes and AI-generated content make social engineering attacks significantly more convincing.

## What Are Deepfakes?

Deepfakes use AI to create hyper-realistic fake videos, audio, and images. They can make anyone appear to say or do anything.

## Types of AI-Powered Scams

### 1. Voice Cloning
- AI can clone someone's voice from just a few seconds of audio
- Scammers call pretending to be a family member in distress
- "Mom, I'm in jail. I need you to send bail money right now!"
- The voice sounds EXACTLY like your child/parent/friend

### 2. Video Deepfakes
- Fake video calls impersonating executives for BEC attacks
- In 2024, a Hong Kong finance worker transferred $25 million after a deepfake video call with "colleagues"
- Used in fake celebrity endorsements for crypto scams

### 3. AI-Generated Phishing
- AI writes grammatically perfect, personalized phishing emails
- No more spelling mistakes or awkward phrasing — the traditional red flags
- Can generate thousands of unique variations

### 4. Chatbot Impersonation
- AI chatbots on dating sites conducting romance scams at scale
- Fake customer support chatbots harvesting credentials
- Social media bots spreading misinformation

## How to Detect Deepfakes

### Video
- Look for unnatural blinking or eye movements
- Check for inconsistent lighting or shadows
- Watch for facial distortion at the edges
- Look for mismatched lip sync

### Audio
- Listen for unnatural pauses or breathing patterns
- Note if the emotional tone doesn't match the words
- Ask unexpected questions that require spontaneous answers

### General
- Verify through a different communication channel
- Establish a family code word for emergency situations
- Be skeptical of urgent requests, even from "known" contacts
- Use tools designed to detect AI-generated content

## The Future

AI scams will only get more sophisticated. The best defense is:
1. **Always verify** through independent channels
2. **Establish authentication protocols** with family and colleagues
3. **Stay informed** about new AI-powered threat techniques
4. **Use CyberSense** to analyze suspicious content`,
        difficulty: "advanced",
        duration_minutes: 20,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(2),
        updated_at: daysAgo(2),
      },

      // ─── SECURITY CATEGORY (4 lessons) ────────────────────────────────
      {
        content_id: "00000000-0000-4000-b000-000000000018",
        title: "Password Security Best Practices",
        category: "security",
        description: "Master the art of creating, managing, and protecting strong passwords. Learn why password reuse is dangerous and how password managers can help.",
        body: `Passwords are the keys to your digital life. Weak or reused passwords are the #1 cause of account compromises.

## The Password Problem

- The average person has 100+ online accounts
- 65% of people reuse passwords across multiple sites
- "123456" is still the most common password globally
- A data breach on one site compromises all accounts sharing that password

## What Makes a Strong Password?

### Length Beats Complexity
- "correcthorsebatterystaple" is stronger than "P@$$w0rd!"
- Each additional character exponentially increases cracking time
- Aim for 16+ characters minimum

### Password Strength Comparison
| Password | Time to Crack |
|----------|--------------|
| password | Instant |
| P@ssw0rd | 5 minutes |
| MyD0g$Name2024 | 3 hours |
| correct-horse-battery-staple | 550+ years |
| kj#mP9$vL2@nQ8wR5 | 10,000+ years |

## Password Managers

A password manager is the single best security investment you can make:

### Benefits
- Generates unique, strong passwords for every account
- Only need to remember ONE master password
- Auto-fills credentials (and won't fill on phishing sites!)
- Encrypted storage of all passwords
- Syncs across all your devices

### Recommended Options
- **Bitwarden** (free, open-source)
- **1Password** (paid, excellent family plan)
- **KeePass** (free, offline, open-source)

## Multi-Factor Authentication (MFA)

Even the best password can be compromised. MFA adds an extra layer:

1. **Something you know**: Password
2. **Something you have**: Phone, hardware key
3. **Something you are**: Fingerprint, face

### MFA Options (Best to Worst)
1. Hardware security keys (YubiKey) — Phishing-proof
2. Authenticator apps (Google Authenticator, Authy)
3. Push notifications
4. SMS codes — Better than nothing, but vulnerable to SIM swap

## Action Steps

1. Install a password manager today
2. Change passwords on your most important accounts first (email, banking)
3. Enable MFA everywhere it's offered
4. Never reuse a password again`,
        difficulty: "beginner",
        duration_minutes: 15,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(29),
        updated_at: daysAgo(29),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000019",
        title: "Ransomware Awareness & Prevention",
        category: "security",
        description: "Understand how ransomware works, the devastating impact it can have, and practical steps to prevent infection and prepare for recovery.",
        body: `Ransomware is malware that encrypts your files and demands payment for the decryption key. It's a multi-billion dollar criminal industry.

## How Ransomware Works

1. **Infection**: Usually via phishing email, malicious download, or exploited vulnerability
2. **Execution**: The malware silently encrypts files on your computer and network drives
3. **Ransom Note**: A message appears demanding payment (usually in Bitcoin)
4. **Payment Deadline**: Attackers threaten to delete files or increase the ransom
5. **Double Extortion**: Modern ransomware also steals data and threatens to publish it

## Recent Notable Attacks

- **Colonial Pipeline (2021)**: Shut down the largest US fuel pipeline. $4.4M ransom paid.
- **WannaCry (2017)**: Infected 200,000+ computers in 150 countries. Targeted unpatched Windows systems.
- **MOVEit (2023)**: Exploited file transfer software affecting thousands of organizations.

## Prevention Strategies

### For Individuals
1. **Keep software updated** — Most ransomware exploits known vulnerabilities
2. **Don't open suspicious attachments** — Use CyberSense to scan emails
3. **Back up your files** — Follow the 3-2-1 rule:
   - 3 copies of your data
   - 2 different storage types
   - 1 copy offsite/offline
4. **Use antivirus software** and keep it updated
5. **Be careful with USB drives** from unknown sources

### For Organizations
1. Implement network segmentation
2. Use endpoint detection and response (EDR) solutions
3. Regularly test and verify backups
4. Conduct phishing simulations
5. Have an incident response plan ready

## If You're Infected

1. **Disconnect** from the network immediately
2. **Don't pay** the ransom (no guarantee of recovery, funds criminal activity)
3. **Report** to law enforcement (e.g., Kenya National CERT)
4. **Restore** from clean backups
5. **Investigate** how the infection occurred to prevent recurrence`,
        difficulty: "intermediate",
        duration_minutes: 18,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(17),
        updated_at: daysAgo(17),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000020",
        title: "Public Wi-Fi & Network Security",
        category: "security",
        description: "Learn the risks of using public Wi-Fi networks and how to protect your data when connecting to untrusted networks at cafes, airports, and hotels.",
        body: `Public Wi-Fi networks are convenient but present serious security risks. Understanding these threats helps you stay safe while connected.

## The Risks of Public Wi-Fi

### 1. Man-in-the-Middle (MitM) Attacks
An attacker positions themselves between you and the Wi-Fi router, intercepting all your traffic:
- They can see which websites you visit
- Capture login credentials sent over unencrypted connections
- Inject malicious content into web pages
- Redirect you to phishing sites

### 2. Evil Twin Networks
- Attacker creates a Wi-Fi hotspot with the same name as a legitimate one
- "CoffeeShop_WiFi" vs "CoffeeShop_WiFi" — they look identical
- All your traffic routes through the attacker's device

### 3. Packet Sniffing
- Attackers use tools like Wireshark to capture network traffic
- Unencrypted data (HTTP, some apps) is easily readable
- Even encrypted traffic reveals which services you're using

### 4. Session Hijacking
- Attacker steals your session cookies after you log in
- They can then access your account without your password

## Protection Measures

### Essential
1. **Use a VPN** — Encrypts ALL your traffic, making interception useless
2. **Verify HTTPS** — Only enter credentials on HTTPS sites
3. **Forget networks** — Don't auto-connect to previously used public networks
4. **Turn off sharing** — Disable file sharing and AirDrop on public networks

### Advanced
5. **Use your phone's hotspot** instead of public Wi-Fi when possible
6. **Enable your firewall** on your laptop
7. **Disable Wi-Fi when not in use** to prevent automatic connections
8. **Use DNS over HTTPS** to prevent DNS hijacking
9. **Verify the network** — Ask staff for the exact network name and password

## Quick Safety Checklist for Public Wi-Fi

- ✅ VPN connected
- ✅ HTTPS verified on all sites
- ✅ File sharing disabled
- ✅ Firewall enabled
- ✅ Auto-connect disabled
- ❌ Avoid banking/shopping
- ❌ Don't access sensitive accounts
- ❌ Don't share files`,
        difficulty: "intermediate",
        duration_minutes: 12,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(11),
        updated_at: daysAgo(11),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000021",
        title: "Data Privacy & GDPR Basics",
        category: "security",
        description: "Understand your data privacy rights, how companies collect and use your data, and the basics of GDPR and the Kenya Data Protection Act.",
        body: `Data privacy is a fundamental right. Understanding how your data is collected, used, and protected empowers you to take control of your digital footprint.

## Why Data Privacy Matters

Every day you generate data that companies collect:
- Websites you visit and searches you make
- Products you buy and places you go
- Messages you send and people you contact
- Photos, health data, financial information

This data is valuable — it's used for targeted advertising, sold to data brokers, and unfortunately, sometimes exposed in data breaches.

## Key Privacy Laws

### GDPR (EU/EEA)
The General Data Protection Regulation gives individuals:
- **Right to access**: See what data a company has about you
- **Right to erasure**: Request deletion of your data ("right to be forgotten")
- **Right to portability**: Get your data in a usable format
- **Right to object**: Opt out of data processing for marketing
- **Consent requirement**: Companies must get explicit consent before collecting data

### Kenya Data Protection Act (2019)
Kenya's equivalent legislation provides:
- Protection of personal data collected by organizations
- Requirements for data controllers and processors
- Rights for data subjects to access and correct their data
- Penalties for non-compliance up to KSh 5 million or 1% of annual turnover

## Practical Privacy Steps

### 1. Audit Your Digital Footprint
- Google yourself to see what's publicly available
- Check haveibeenpwned.com for past data breaches
- Review privacy settings on all social media accounts

### 2. Minimize Data Collection
- Use privacy-focused browsers (Firefox, Brave)
- Use privacy-focused search engines (DuckDuckGo)
- Limit app permissions to only what's necessary
- Use disposable email addresses for sign-ups

### 3. Control Your Data
- Read privacy policies (at least the key sections)
- Opt out of data selling where possible
- Delete unused accounts
- Use cookie management tools

### 4. Secure Your Data
- Encrypt sensitive files
- Use secure messaging apps (Signal)
- Enable full-disk encryption on your devices
- Regularly back up important data`,
        difficulty: "intermediate",
        duration_minutes: 15,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(6),
        updated_at: daysAgo(6),
      },

      // ─── ADVANCED CATEGORY (3 lessons) ────────────────────────────────
      {
        content_id: "00000000-0000-4000-b000-000000000022",
        title: "Incident Response Fundamentals",
        category: "advanced",
        description: "Learn the structured approach to handling cybersecurity incidents from detection through recovery, including evidence preservation and communication protocols.",
        body: `When a security incident occurs, a structured response can mean the difference between a minor disruption and a catastrophic breach.

## The Incident Response Lifecycle

### Phase 1: Preparation
Before incidents occur:
- Develop and document an Incident Response Plan (IRP)
- Define roles and responsibilities
- Set up communication channels
- Prepare forensic tools and resources
- Conduct regular training and drills

### Phase 2: Detection & Analysis
Identifying that an incident has occurred:
- Monitor security alerts and logs
- Analyze indicators of compromise (IoCs)
- Determine scope and severity
- Classify the incident (malware, data breach, DDoS, etc.)
- Document everything from the start

### Phase 3: Containment
Preventing further damage:

**Short-term**: Immediate actions to stop the spread
- Isolate affected systems from the network
- Block malicious IPs/domains
- Disable compromised accounts

**Long-term**: Temporary fixes while preparing for eradication
- Apply emergency patches
- Redirect traffic
- Implement additional monitoring

### Phase 4: Eradication
Removing the threat:
- Identify and eliminate the root cause
- Remove malware from all affected systems
- Close vulnerabilities that were exploited
- Reset all potentially compromised credentials

### Phase 5: Recovery
Returning to normal operations:
- Restore systems from clean backups
- Gradually bring systems back online
- Monitor for signs of recurring compromise
- Verify system integrity

### Phase 6: Lessons Learned
After the incident:
- Conduct a post-incident review within 1-2 weeks
- Document what happened, what was done, and what to improve
- Update the Incident Response Plan
- Share findings (anonymized) with the security community

## Key Principles

1. **Don't panic** — Follow the plan
2. **Preserve evidence** — Don't destroy logs or reformat prematurely
3. **Communicate clearly** — Keep stakeholders informed
4. **Document everything** — Times, actions taken, people involved
5. **Know your obligations** — Data breach notification laws may require disclosure`,
        difficulty: "advanced",
        duration_minutes: 25,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(21),
        updated_at: daysAgo(21),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000023",
        title: "Zero Trust Security Model",
        category: "advanced",
        description: "Understand the Zero Trust security architecture — 'never trust, always verify' — and how it protects against modern threats in a perimeter-less world.",
        body: `Zero Trust is a security model based on the principle: "Never trust, always verify." It assumes that threats exist both inside and outside the network.

## Why Traditional Security Fails

The traditional "castle and moat" approach:
- Trusts everything inside the network perimeter
- Focuses on keeping attackers out
- Once inside, attackers move freely (lateral movement)
- Doesn't account for remote work, cloud services, or BYOD

## Core Zero Trust Principles

### 1. Verify Explicitly
Always authenticate and authorize based on all available data points:
- User identity and credentials
- Device health and compliance
- Location and network
- Data classification
- Anomalies in behavior

### 2. Use Least Privilege Access
Limit access to the minimum necessary:
- Just-in-time access (temporary elevated privileges)
- Just-enough-access (only what's needed for the task)
- Risk-based adaptive policies
- Regular access reviews

### 3. Assume Breach
Design systems assuming an attacker is already inside:
- Segment access to minimize blast radius
- Use end-to-end encryption
- Monitor and log everything
- Automate threat detection and response

## Zero Trust Architecture Components

1. **Identity Provider**: Centralized authentication (e.g., Azure AD, Okta)
2. **Device Management**: Ensure devices meet security requirements
3. **Network Segmentation**: Micro-segmentation of network resources
4. **Application Security**: Verify access at the application level
5. **Data Protection**: Classify and encrypt sensitive data
6. **Monitoring**: Continuous monitoring and analytics

## Implementing Zero Trust

### Start Small
1. Identify your most critical assets ("protect surfaces")
2. Map the data flows to and from those assets
3. Build Zero Trust policies around each protect surface
4. Monitor and maintain continuously

### For Individuals
Even without enterprise infrastructure, you can apply Zero Trust thinking:
- Don't trust emails just because they appear to come from someone you know
- Verify links before clicking, even from trusted contacts
- Use unique passwords for every account
- Enable MFA everywhere
- Keep devices updated and encrypted
- Be skeptical of every request for information or access`,
        difficulty: "advanced",
        duration_minutes: 22,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(16),
        updated_at: daysAgo(16),
      },
      {
        content_id: "00000000-0000-4000-b000-000000000024",
        title: "Threat Intelligence & OSINT",
        category: "advanced",
        description: "Introduction to threat intelligence gathering and Open Source Intelligence (OSINT) techniques used by security professionals to proactively identify threats.",
        body: `Threat intelligence is the collection and analysis of information about current and potential cyber threats. OSINT (Open Source Intelligence) uses publicly available data to gather this intelligence.

## What is Threat Intelligence?

Threat intelligence helps organizations:
- Understand who might attack them and why
- Identify attack methods and tools being used
- Proactively defend against emerging threats
- Make informed security decisions

## Levels of Threat Intelligence

### 1. Strategic (Who and Why)
- Threat landscape reports
- Industry-specific risk assessments
- Geopolitical threat analysis
- Used by executives for decision-making

### 2. Tactical (How)
- Attacker tactics, techniques, and procedures (TTPs)
- MITRE ATT&CK framework mappings
- Used by security teams for defense planning

### 3. Operational (What and When)
- Specific impending threats
- Campaign details and timelines
- Used for incident preparation

### 4. Technical (Indicators)
- IP addresses, domains, URLs, file hashes
- Indicators of Compromise (IoCs)
- Used by security tools for detection

## OSINT Tools and Techniques

### Domain & IP Investigation
- **Whois Lookup**: Who registered a domain and when
- **DNS Records**: What infrastructure a domain uses
- **Shodan**: Search engine for internet-connected devices
- **VirusTotal**: Multi-engine malware and URL scanning (powers CyberSense!)

### Email Investigation
- **Email header analysis**: Trace email origins
- **Have I Been Pwned**: Check for email exposure in breaches
- **Hunter.io**: Find email patterns for organizations

### Social Media Intelligence
- **Social media monitoring**: Track threat actor discussions
- **Paste sites**: Monitor for leaked credentials
- **Dark web monitoring**: Track data being sold (use caution)

### Website Analysis
- **Wayback Machine**: View historical website content
- **BuiltWith**: Identify technologies used by websites
- **Google Dorking**: Advanced search operators to find exposed data

## OSINT for Personal Security

You can use OSINT defensively to protect yourself:
1. Google your name, email, phone number
2. Check haveibeenpwned.com for exposed accounts
3. Search for your data on data broker sites
4. Monitor mentions of your organization or brand
5. Use CyberSense to scan suspicious URLs and emails you receive

## Ethics and Legality

- OSINT uses only publicly available information
- Never access systems without authorization
- Respect privacy laws and terms of service
- Document your methods and sources
- Use findings for defensive purposes only`,
        difficulty: "advanced",
        duration_minutes: 25,
        is_published: true,
        created_by: ADMIN,
        created_at: daysAgo(4),
        updated_at: daysAgo(4),
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
        "00000000-0000-4000-b000-000000000005",
        "00000000-0000-4000-b000-000000000006",
        "00000000-0000-4000-b000-000000000007",
        "00000000-0000-4000-b000-000000000008",
        "00000000-0000-4000-b000-000000000009",
        "00000000-0000-4000-b000-000000000010",
        "00000000-0000-4000-b000-000000000011",
        "00000000-0000-4000-b000-000000000012",
        "00000000-0000-4000-b000-000000000013",
        "00000000-0000-4000-b000-000000000014",
        "00000000-0000-4000-b000-000000000015",
        "00000000-0000-4000-b000-000000000016",
        "00000000-0000-4000-b000-000000000017",
        "00000000-0000-4000-b000-000000000018",
        "00000000-0000-4000-b000-000000000019",
        "00000000-0000-4000-b000-000000000020",
        "00000000-0000-4000-b000-000000000021",
        "00000000-0000-4000-b000-000000000022",
        "00000000-0000-4000-b000-000000000023",
        "00000000-0000-4000-b000-000000000024",
      ],
    });
  },
};

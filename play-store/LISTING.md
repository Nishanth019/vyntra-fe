# Manaze — Google Play listing

Copy these into Play Console. Graphics are in this folder.

Account: personal developer account (verified 28 Oct 2026). Personal accounts must run a **closed test with 12+ testers opted in for 14 days in a row** before they can apply for production.

## Create app

- App name: Manaze: Gym & PG Manager
- Default language: English (India) – en-IN
- App or game: App
- Free or paid: **Free** (free to download; the Manaze subscription is separate. This can't be changed later.)

## Store listing (Grow → Store presence → Main store listing)

**App name** (max 30): Manaze: Gym & PG Manager

(The brand is Manaze; the words after the colon help the app show up for "gym management" and "PG management" searches. Policy allows this, but not "Best", "#1", "Free" or emojis.)

**Short description** (max 80):
Gym & PG management: members, renewals, dues, rent, attendance in one app.

**Full description** (max 4000):

Manaze helps gym, fitness studio, yoga, coaching and PG / hostel owners run their business from their phone.

MEMBERS
• Add members with phone, emergency contact and address
• Import your existing members from Excel or CSV in one go
• See who is active, expiring soon, expired or inactive
• Search and filter your whole member list in seconds
• Full history of every member: joined, renewed, payments and more

PLANS & RENEWALS
• Create membership plans with any duration and price
• Join, renew, change plan or add a future plan
• Get reminded before memberships expire

PAYMENTS & DUES
• Record payments by cash, UPI, card or bank transfer
• Track paid, balance and pending dues for every member
• Send a ready-made WhatsApp reminder for dues or renewals in one tap
• See total collections at a glance

ATTENDANCE
• Mark daily check-ins in a tap
• See who is present and who hasn't come in for a while

PG / HOSTEL
• Rooms and beds, tenants, monthly rent bills and deposits
• Rent due, advance and notice period tracking

EXPENSES & STAFF
• Track expenses month by month by category
• Add staff and pay monthly salaries

INSIGHTS
• Revenue, new members and renewals over time
• Payment method split and top dues

NOTIFICATIONS
• Morning and evening summaries
• Alerts for expiring plans, dues, birthdays and members who stopped coming

MORE
• Multiple organisations and branches in one account
• Add other admins and control their access
• Light and dark mode
• Also works in the browser on your computer

PRICING
Free for 15 days with everything unlocked. After that, one plan with every feature: monthly, quarterly, half-yearly or yearly. Cancel any time.

Your data stays private: each organisation's data is visible only to its own admins, and you can delete your account at any time.

**Graphics**
- App icon: `icon-512.png` (512×512 PNG, the Manaze rising M).
- Feature graphic: `feature-graphic-1024x500.png`. Sources for every icon are in `assets/brand/`.
- Phone screenshots: 4–8 from your phone (Home, Members, Member profile, Record payment, Insights, Attendance). Use the demo account so no real member's phone number shows.

**Category**: Business · **Tags**: Business management, Productivity
**Contact email**: bhukyanishanth69@gmail.com · **Phone**: +91 91214 18845 (optional)
**Website**: https://vyntra-web-664iy.ondigitalocean.app

## App content (Policy → App content)

| Form | Answer |
|---|---|
| Privacy policy | https://vyntra-api-3ckz6.ondigitalocean.app/privacy/ |
| App access | "All or some functionality is restricted" → give the demo login below |
| Ads | No, the app has no ads |
| Content rating | Category "Utility, Productivity, Communication or Other"; answer No to every question → rated Everyone / 3+ |
| Target audience | 18 and over only |
| News app | No |
| Government app | No |
| Financial features | "My app doesn't provide any financial features" (it only records payments, it doesn't move money) |
| Health apps | No health features |
| Data safety | See below |
| Account deletion URL | https://vyntra-api-3ckz6.ondigitalocean.app/account-deletion/ |

### App access (demo login for Google's reviewers)

Demo account created 28 Oct 2026: email `bhukyanishanth69+vyntrademo@gmail.com` (mobile 9000000001), business "Demo Fitness Studio" with 3 plans, 16 members (active, expiring, expired, with dues), 5 days of attendance, 2 staff and 4 expenses. The password is kept outside the repo. Its 15-day trial ends 12 Nov 2026: before then, in Django admin → Subscriptions, give it 30 free days (repeat while the app is in review or testing).

Instructions to paste:
> Log in with the email and password above. The account has a demo gym with sample members. No OTP or extra step is needed.

### Data safety

- Collects or shares user data: **Yes**
- Encrypted in transit: **Yes**
- Users can request deletion: **Yes** (link above)
- Data shared with third parties: **No** (hosting providers and payment processors are service providers, which doesn't count as sharing)

Data collected (all: *Collected*, not shared, required, purpose **App functionality** + **Account management**):

| Type | Items |
|---|---|
| Personal info | Name, Email address, Phone number, Address, Other info (date of birth, gender) |
| Financial info | Purchase history (Manaze subscription payments); Other financial info (payments, rent, expenses and salaries recorded by the business) |
| App activity | Other actions (attendance records) |
| Device or other IDs | Device ID (push notification token): purpose App functionality only |

Not collected: location, photos, contacts, messages, health, web history, audio. Card and UPI details are entered on Razorpay's page and never reach Manaze.

## Release (Testing → Closed testing)

1. Build: `./scripts/build-apk.sh aab` (bump `android.versionCode` in `app.json` before every later upload).
2. Accept **Play App Signing** (Google-managed key; the EAS key becomes the upload key).
3. Countries: India.
4. Testers: email list with 12+ Gmail addresses. Share the opt-in link; every tester must tap "Become a tester" and install the app, and stay opted in for 14 days.
5. Release notes: "First release of Manaze."
6. After 14 days: Dashboard → Apply for production (answers about the test: who tested, feedback received, changes made).

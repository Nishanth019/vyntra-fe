# Manaze — Apply for production: answers (honest version)

Use these when "Apply for production" unlocks (expected around 14 Nov 2026).
Google may word the questions slightly differently: check them first with "Preview questions" on the app dashboard.

Everything below is true as of 11 Nov 2026. If your friends send real feedback before you apply, add it in the
"Feedback log" and mention it in Part 1. **Do not add feedback or usage that didn't happen.**

---

## Before you apply

1. **Upload 1.0.1 (versionCode 2) to the Alpha closed test** — `builds/manaze-<date>.aab`.
   Play Console → Test and release → Closed testing → Alpha → Create new release → upload → paste the release notes below → Review → Start rollout.
2. **Send the tester message below** to your friends today, so the 1.0.1 build gets some real use.
3. **Keep 12+ testers opted in** until the application is approved.
4. **Check the demo account still logs in** (Google reviewers use it; details in `LISTING.md`).

## Release notes for 1.0.1 (paste into Play Console, max 500 chars)

```
<en-IN>
• Payment method buttons (Cash, UPI, Card, Bank) and gender buttons now show their full names on small phones
• Member profile: plan and quick-action buttons no longer cut off their labels
• Plan picker shows one plan per row so long names and prices are fully visible
• PG setup uses PG wording and icon instead of gym wording
• Tenant form: ID type and billing cycle options fit on small screens
• Website: login logo fixed
</en-IN>
```

## Message for testers (WhatsApp)

```
Hi! Manaze has a new version (1.0.1) on the Play Store testing link. Could you spend 5 minutes on it today?

1. Open Manaze and log in (or create an account)
2. Add a gym (or PG), then add 2–3 members with a plan
3. Record a payment for one member
4. Tap the WhatsApp button on a member to send a due reminder (send it to yourself)

Then reply with anything that was confusing, broken, or missing — even small things help. Thanks!
```

## Feedback log (add only what testers really say)

| Date | Tester | What they said | What you changed | In version |
|---|---|---|---|---|
| | | | | |

---

## Part 1 — About your closed test

**How easy was it to recruit testers for your app?**
Pick: *Difficult* (testers were friends and family; the app is for business owners, who are harder to reach).

**Describe the engagement you received from testers during your closed test.**
> Our testers were friends and family who opted in and kept the app installed for the full 14 days (15 installs, 12 monthly active devices). Their in-app use was light, because most of them don't run a gym or PG. To make up for this, we ran a structured test of every flow ourselves on a separate test setup: signing up, creating a gym and a PG, adding members and plans, recording payments, attendance, staff, expenses, rooms, tenants, rent and check-out, on a small (360 dp) phone screen. [If friends reply to the tester message, add one line here about what they tried.]

**Provide a summary of the feedback you received from testers. Include how you collected it.**
> We collected feedback through WhatsApp and our own structured testing. The main issues were on small phone screens: payment method buttons (Cash / UPI / Card / Bank) and gender buttons were cut off, member profile buttons such as "Add Future Plan" and "Attendance History" were truncated, the plan picker cut off long plan names and prices, and the PG setup screen used gym wording. [Add real tester comments here, if any.]

---

## Part 2 — About your app

**Who is the intended audience of your app?**
> Owners and managers of small gyms, fitness and yoga studios, coaching centres and PGs / hostels in India, who track members, fees and rent today on paper, Excel or WhatsApp.

**Describe how your app provides value to users.**
> Manaze puts the daily admin of a small membership or rental business in one app: members and tenants, plans and renewals, rooms and beds, payments and dues, attendance, expenses and staff salaries. Owners see who has expired and who owes money, and can send a ready-made WhatsApp reminder in one tap, so fewer renewals and rent payments are missed. Existing members can be imported from Excel in one go.

**How many installs do you expect in your first year?**
Pick: *0–10K*.

---

## Part 3 — Production readiness

**What changes did you make to your app based on what you learned during your closed test?**
> We released version 1.0.1 to the closed test. It fixes every issue found in testing: payment method and gender buttons now show full labels on small phones, member profile buttons wrap instead of being cut off, the plan picker shows one plan per row with the full price, PG setup uses PG wording, tenant form options fit small screens, and the website login logo displays correctly.

**How did you decide that your app is ready for production?**
> Every main flow (sign-up, members, plans, payments and dues, attendance, staff, expenses, PG rooms, tenants, rent and check-out) was tested end to end on a small phone screen, and the issues found were fixed in 1.0.1. The backend's 102 automated tests pass. The backend has been running in production since October, and a demo account is available for review. [Check Android vitals → Crashes and ANRs first; add "Android vitals shows no crashes or ANRs" only if that is true.]

---

## If Google says "needs more testing"

That is not a ban. Keep the closed test running, find 2–3 real gym or PG owners (local gyms, PG owners near colleges or IT parks), get them using it for a week or two, note their feedback above, ship another update, and apply again.

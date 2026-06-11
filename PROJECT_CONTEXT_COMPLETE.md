# KOH RIDE — MASTER PROJECT CONTEXT & DECISIONS
Version: June 2026

## PROJECT SUMMARY

Koh Ride is a scooter rental marketplace focused on Phuket.

Koh Ride is NOT a rental company.
Koh Ride does NOT own scooters.
Koh Ride connects riders and local rental shops.

Core mission:
- Help tourists find the exact scooter they want.
- Help shops get qualified leads.
- Become the largest scooter discovery platform in Phuket.

---

## THE MOST IMPORTANT DECISION IN PROJECT HISTORY

Originally the project was closer to:

- Airbnb for scooters
- Reservation platform
- Booking flow

After many iterations, the project pivoted.

Current positioning:

- Marketplace
- Discovery platform
- Lead generation platform
- Chat-first platform

Think:

- Leboncoin
- Marketplace

Do NOT think:

- Airbnb
- Booking.com
- RentalCars

This decision impacts every future feature.

---

## CURRENT BUSINESS MODEL

Current status:

100% FREE.

Everything is free.

There is currently:

- No subscription
- No commission
- No premium plan
- No paid visibility

Reason:

The marketplace must first prove it can generate leads.

Current objectives:

- Get shops
- Get scooters
- Generate leads
- Validate demand

Monetization comes later.

---

## FUTURE BUSINESS MODEL (PLANNED)

Not implemented.

Possible future:

Free:
- Up to 5 scooters

Starter:
- Around 15 scooters

Pro:
- Around 40 scooters

Premium:
- Featured visibility
- Featured map placement
- Sponsored listings

This is NOT active today.

---

## CORE PRODUCT PHILOSOPHY

Business > Acquisition > UX > Technology

Always ask:

Will this bring more riders?
Will this bring more shops?

If not, it is probably not a priority.

---

## WHAT KOH RIDE IS NOT

Koh Ride does NOT:

- Manage reservations
- Process payments
- Manage deposits
- Manage contracts
- Manage insurance
- Manage cancellations

Shop handles the rental.

Koh Ride generates the lead.

---

## CORE USER FLOW

Rider discovers scooter
→ Opens scooter page
→ Contacts shop
→ Conversation starts
→ Shop handles rental

---

## FEATURES DELIBERATELY REJECTED

Do not reopen without strong evidence:

- Integrated payments
- Reservation engine
- Booking confirmation flow
- Complex availability calendars
- Rental contracts
- Insurance marketplace
- Loyalty systems

Reason:

Complexity without solving current business problems.

---

## CURRENT STATUS

Estimated completion:

90–95%

Major remaining blockers:

- Apple Developer account
- Apple Sign In activation
- Physical iPhone testing
- TestFlight
- App Store review

The biggest business risk is now marketplace liquidity, not code.

---

## ACQUISITION STRATEGY

Supply = Shops

Demand = Riders

Current priority:

SUPPLY

Without scooters there is no marketplace.

---

## SHOP ACQUISITION STRATEGY

Order:

1. Finish product
2. Publish app
3. Recruit shops

Reason:

First impressions matter.

---

## RIDER ACQUISITION STRATEGY

Main channel:

SEO

Not paid ads.

---

## FACEBOOK ADS DECISION

No serious ad spending until:

- 20+ shops
- 100+ scooters

Reason:

Traffic sent to an empty marketplace is wasted.

---

## MARKETING STORY

Strongest angle:

"I wanted a Yamaha XMAX with a passenger backrest.

I spent hours messaging rental shops.

That's why I built Koh Ride."

---

## SEO STRATEGY

SEO is a strategic pillar.

Every scooter:
Potential landing page.

Every shop:
Potential landing page.

Goal:

Capture searches such as:

- Yamaha XMAX rental Phuket
- Honda ADV rental Kata
- Scooter rental Patong

---

## SEO STATUS

Implemented:

- Metadata
- Open Graph
- Canonicals
- Sitemap
- Robots
- Search Console
- Bing Webmaster
- Structured Data
- FAQ schema

Estimated level:

8.5–9/10

Future gains:

- More scooters
- More shops
- Reviews
- Backlinks

---

## LOCATION PAGES

Created for major Phuket locations:

- Patong
- Kata
- Karon
- Rawai
- Bang Tao
- Kamala
- Phuket Town
- Nai Harn
- Chalong

Purpose:

SEO.

---

## FAQ

Implemented.

Includes:

- Licenses
- Deposits
- Insurance
- Safety
- Pricing

FAQ schema included.

---

## TECH STACK

Frontend:
- Next.js
- TypeScript
- TailwindCSS

Backend:
- Supabase

Hosting:
- Vercel

Maps:
- Mapbox

Mobile:
- Capacitor

Testing:
- Playwright

---

## SUPABASE

Handles:

- Auth
- Profiles
- Shops
- Scooters
- Messages
- Favorites
- Storage

Profiles are critical.

---

## MAJOR AUTH INCIDENT

One of the biggest bugs in project history.

Cause:

Multiple Supabase browser clients.

Consequences:

- Stale auth
- Wrong roles
- Profile inconsistency

Solution:

Singleton Supabase client.

Never revert.

---

## AUTH METHODS

- Email / Password
- Google
- Apple Sign In

---

## APPLE SIGN IN

Status:

Implemented in code.

Not fully activated.

Uses:

@capacitor-community/apple-sign-in

Audits completed:

- Name persistence
- Duplicate handling
- Shop onboarding

Important:

Supabase duplicate email behavior must be:
"Link accounts to existing user".

---

## APP STORE STATUS

Screenshots completed.

Main blockers:

- Apple Developer account
- Mac access
- TestFlight
- Review

---

## APP STORE SCREENSHOTS

Final set:

1. Explore Map
2. Scooter Detail
3. Shop Detail
4. Messaging
5. Scooter Listings

---

## MESSAGING SYSTEM

Messaging is a core feature.

Marketplace is effectively chat-first.

---

## MAJOR MESSAGING DECISION

One conversation per:

(client_id, owner_id)

NOT:

One conversation per scooter.

Reason:

Avoid duplicate threads.

---

## CONTEXT SWITCH SYSTEM

Implemented.

Message types:

- message
- context_switch

Allows changing scooter context inside same thread.

Context switch messages:

- Not unread
- Not counted
- Do not reorder conversations

---

## SHOP ACCESS FROM CHAT

Implemented.

Click shop avatar or name:

→ Open shop profile

Additional actions:

- Call
- Maps

---

## FAVORITES

Implemented.

Working.

---

## MAP SYSTEM

One of the largest UX discussions.

### Location Types

Type 1:
Exact location

Type 2:
Approximate location

Type 3:
Zone center

### Major problem

Approximate shops looked like exact pins.

Result:

- Overlapping markers
- Poor UX

### Final decision

Airbnb-style clustering.

Zoomed out:
Area clusters.

Zoomed in:
Exact locations explode.

Approximate locations remain clustered.

Decision considered final.

---

## SHOP BANNERS

COMPLETED.

Shops upload:

- Desktop banner
- Mobile banner

System automatically serves correct version.

---

## EMAIL SYSTEM

COMPLETED.

Provider:

Resend

Configured and working.

Remaining task:

Maintain branding quality.

---

## LEGAL

Implemented:

- Privacy Policy
- Terms & Conditions

Still useful:

- Dedicated support page

---

## TESTING

Playwright:

54 passed
22 skipped
0 failed

Desktop:
PASS

Mobile:
PASS

---

## CURRENT ROADMAP

Immediate:

1. Apple Developer account
2. Apple Sign In activation
3. Physical iPhone testing
4. TestFlight
5. App Store submission

After launch:

6. Recruit shops
7. Grow inventory
8. Grow SEO

Later:

9. Monetization

---

## THINGS THAT SHOULD NEVER BE REOPENED LIGHTLY

- Integrated payments
- Reservation engine
- Airbnb model
- One conversation per scooter
- Complex availability system
- Commission-based marketplace

---

## HOW TO WORK ON THIS PROJECT

Kevin prefers:

- Direct answers
- Honest criticism
- Business-first thinking
- Prioritization

Avoid:

- Corporate language
- Fake positivity
- Over-engineering
- Feature creep

Always ask:

Will this bring more riders?
Will this bring more shops?

If not, it is probably not a priority.

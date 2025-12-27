# TeachTrack Analytics Implementation Checklist (A–Z)

## 🅰️ STRATEGY & PREPARATION (Before Writing Code)
- [x] A1. Confirm Analytics Goals
- [x] A2. Define “Success Metrics” (North Star)
- [x] A3. Decide Analytics Stack (PostHog Cloud EU)

## 🅱️ ACCOUNT & PLATFORM SETUP
- [x] B1. Create PostHog Account (User Action Required)
- [ ] B2. Configure Billing Safety

## 🅲 ENVIRONMENT SETUP (Next.js)
- [x] C1. Install SDK (`npm install posthog-js`)
- [x] C2. Add Environment Variables (`.env.local`)
- [x] C3. Create PostHog Provider (`PostHogProvider.tsx`)
- [x] C4. Wrap Application (`layout.tsx`)

## 🅳 USER IDENTIFICATION (CRITICAL STEP)
- [x] D1. Identify Teachers After Login
- [x] D2. Reset on Logout

## 🅴 EVENT TRACKING (CORE ANALYTICS)
- [x] E1. Adopt Event Naming Convention
- [x] E2. Track Key Events (Scheme Gen, Lesson Plan DL)
- [x] E3. Track Page Views (Manually)

## 🅵 FUNNELS & USER FLOW
- [ ] F1. Define Funnels in PostHog UI
- [ ] F2. Analyze Drop-Off Points

## 🅶 SESSION RECORDINGS & HEATMAPS
- [ ] G1. Enable Session Recording (UI)
- [x] G2. Mask Sensitive Fields (`ph-no-capture`)

## 🅷 DASHBOARDS (WHAT YOU SEE DAILY)
- [ ] H1. Create “Founder Dashboard”
- [ ] H2. Create “Engagement Dashboard”

## 🅸 PRIVACY & COMPLIANCE (EDUCATION SAFE)
- [ ] I1. No PII in Events
- [ ] I2. Update Privacy Policy

## 🅹 TESTING & VALIDATION
- [ ] J1. Local Testing
- [ ] J2. Production Smoke Test

## 🅺 MONITORING & COST CONTROL
- [ ] K1. Monitor Monthly Event Usage
- [ ] K2. Disable Unnecessary Auto-Capture

## 🅻 CONTINUOUS IMPROVEMENT LOOP
- [ ] L1. Weekly Review
- [ ] L2. Feature Decisions Based on Data

## 🅼 SCALE READINESS (FUTURE)
- [ ] M1. When >10k Teachers

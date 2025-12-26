# Analytics Implementation Plan for TeachTrack

## Executive Summary
For a SaaS platform like TeachTrack (Teacher Management System) with a goal of tracking feature usage, user flow, and engagement for up to 1000 teachers on a startup budget, **PostHog** is the strongest recommendation.

It consolidates all your requirements (Product Analytics, Session Recording, Heatmaps, Feature Flags) into one platform with a very generous free tier (1 million events/month), which easily supports 1000 users.

## 1. Recommended Stack: PostHog
We verify this against your requirements:

| Requirement | PostHog Capability | GA4 + Clarity (Alternative) |
| :--- | :--- | :--- |
| **Teacher Visits (DAU/WAU)** | ✅ Built-in Dashboards | ✅ Standard Reports |
| **Feature Usage/Clicks** | ✅ Auto-capture events & specific tracking | ⚠️ Harder to configure for specific "features" |
| **Heatmaps/Scroll** | ✅ Built-in & Integrated with sessions | ✅ Clarity does this well |
| **Session Duration** | ✅ User-specific session replays | ✅ Aggregate data only |
| **User Flow** | ✅ powerful "Path Analysis" tools | ⚠️ Path exploration is complex |
| **Drop-off Points** | ✅ Funnel Analysis (e.g., Login -> Create Scheme) | ✅ Funnel reports exist but are rigid |
| **Privacy Friendly** | ✅ EU Hosted option, GDPR compliant | ⚠️ Google data processing concerns |
| **Cost** | ✅ Free for <1M events/month | ✅ Free |

**Why PostHog over GA4?**
- **User-Centric:** GA4 aggregates data (marketing view). PostHog allows you to see exactly what "Teacher John" did (product view), which is crucial for a management platform.
- **Session Replay:** You can watch a session replay of a teacher getting stuck on the "Generate Scheme" page and fix the UI immediately.
- **All-in-One:** No need to install multiple scripts (GA4 + Hotjar + Mixpanel). One script does it all.

### Why Cloud over Self-Hosted (For Now)
While PostHog can be self-hosted, the cloud version is recommended at this stage to reduce DevOps overhead, ensure automatic updates, and allow the team to focus on product development. Self-hosting can be reconsidered at scale (10k+ users).

## 2. TeachTrack North Star Metrics
Defining clear metrics elevates analytics from "collecting data" to "decision making".

**Primary:**
- **Weekly Active Teachers (WAT)**: The pulse of your platform.
- **Time to First Value**: Metric tracking time from Login → First Scheme Created.

**Secondary:**
- **Avg Features Used per Teacher per Week**: Measures depth of engagement.
- **Scheme Generation Success Rate**: Quality assurance metric.

## 3. Integration Plan (Next.js)

### Step 1: Account Setup
1.  Sign up at [PostHog.com](https://posthog.com).
2.  Choose "EU Cloud" (recommended for education/GDPR compliance) or "US Cloud".
3.  Get your `API_KEY` and `HOST` URL.

### Step 2: Install SDK
Run this in your terminal:
```bash
npm install posthog-js
```

### Step 3: Initialize in Next.js
Create a provider component `frontend/app/providers/PostHogProvider.tsx` (for App Router):

```typescript
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified_only', // Optimized for privacy
    capture_pageview: false // We handle this manually for Next.js
  })
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

### Step 4: Wrap Application
Import `PHProvider` in `frontend/app/layout.tsx` and wrap your app.

### Step 5: Identify Users (Critical for "Teacher Tracking")
Modify your `useCustomAuth` hook or Login page. When a teacher logs in:

```typescript
posthog.identify(user.id, {
  email: user.email,
  role: user.role,
  school_id: user.school_id
});
```

### Event Naming Convention (Best Practice)
Adopt a consistent schema early to keep dashboards clean:
- `page_view` (Auto-captured)
- `teacher_login`
- `scheme_generate_clicked`
- `scheme_created_success`
- `lesson_plan_downloaded`

## 4. Customizing for TeachTrack Goals

### Goal A: "Which pages and features are visited most"
- **Solution:** PostHog "Auto-capture" tracks every click.
- **Customization:** Create a Dashboard called "Teacher Engagement". Add a specific "Trend" insight filtering for URLs containing `/professional-records/lesson-plans` vs `/schemes-of-work`.

### Goal B: "Drop-off points"
- **Solution:** Create a "Funnel" insight.
- **Steps:**
    1. Pageview `/login`
    2. Click "Generate Scheme"
    3. Click "Submit"
    4. "Scheme Created" (Success)
- This visualizes exactly where teachers stop.

### Goal C: "How long teachers stay"
- **Solution:** "Session Recording". You can filter sessions by duration > 5 mins to see what "power users" are doing, or < 30s to see why people leave.

## 5. Privacy & Education Context
Since you are dealing with education data:
1.  **Do not capture PII in events:** Do not track student names as event properties.
2.  **Mask Input Fields:** PostHog automatically masks password fields. Ensure other sensitive inputs (student grades) are masked in session recordings by adding the class `ph-no-capture` to those HTML elements.
3.  **Data Hosting:** Use the EU Cloud option which keeps data in Frankfurt, satisfying most strict privacy laws.

## 6. Next Steps
1.  Confirm if you want to proceed with PostHog (recommended) or GA4.
2.  I can generate the specific code changes (Provider, Layout, Auth integration) for you immediately.

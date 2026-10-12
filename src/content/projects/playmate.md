---
title: PlayMate
order: 3
year: '2026'
summary: A community-driven sports matchmaking app.
tags: [iOS, User interviews, Usability testing]
status: complete
cover: { src: /images/playmate-cover-v6.png, alt: PlayMate app screens, width: 1920, height: 1149 }
description: 'PlayMate: a community-driven sports matchmaking iOS app. Case study with user interviews, moderated usability testing and information architecture.'
ogImage: /og/playmate.jpg
facts:
  - { label: Platform, value: iOS }
  - { label: Role, value: 'Product Designer (end-to-end UX/UI, solo)' }
  - { label: Tools, value: Figma · Claude · Stitch }
gallery:
  - label: Prototype
    title: Onboarding to game room
    items:
      - { src: /images/playmate-proto-1.webp, alt: PlayMate onboarding, width: 661, height: 1367 }
      - { src: /images/playmate-proto-2.webp, alt: PlayMate dashboard, width: 661, height: 1367 }
      - { src: /videos/playmate-proto-ss.mp4, alt: PlayMate prototype walkthrough, width: 450, height: 942 }
      - { src: /images/playmate-proto-3.webp, alt: PlayMate discover, width: 661, height: 1367 }
      - { src: /images/playmate-proto-4.webp, alt: PlayMate friends, width: 661, height: 1367 }
  - label: Final screens
    title: 'Onboarding'
    screens: true
    items:
      - { src: /images/playmate-final-onboarding-1.webp, alt: 'PlayMate — Onboarding: More than just a game', width: 283, height: 615 }
      - { src: /images/playmate-final-onboarding-2.webp, alt: 'PlayMate — Onboarding: Find your sports circle', width: 284, height: 615 }
      - { src: /images/playmate-final-onboarding-3.webp, alt: 'PlayMate — Onboarding: Explore the neighbourhood', width: 284, height: 615 }
      - { src: /images/playmate-final-onboarding-4.webp, alt: 'PlayMate — Onboarding: Play with the right match', width: 284, height: 615 }
      - { src: /images/playmate-final-onboarding-5.webp, alt: 'PlayMate — Sign up', width: 284, height: 615 }
      - { src: /images/playmate-final-onboarding-6.webp, alt: 'PlayMate — Log in', width: 283, height: 615 }
  - label: Final screens
    title: 'Home and game flow'
    screens: true
    tall: true
    items:
      - { src: /images/playmate-final-home-1.webp, alt: 'PlayMate — Rate the game and past games', width: 283, height: 848 }
      - { src: /images/playmate-final-home-2.webp, alt: 'PlayMate — Home dashboard', width: 284, height: 1039 }
      - { src: /images/playmate-final-home-3.webp, alt: 'PlayMate — Game details', width: 284, height: 1294 }
      - { src: /images/playmate-final-home-4.webp, alt: 'PlayMate — Find a match, list view', width: 284, height: 1199 }
      - { src: /images/playmate-final-home-5.webp, alt: 'PlayMate — Find a match, map view', width: 284, height: 821 }
      - { src: /images/playmate-final-home-6.webp, alt: 'PlayMate — Create a game', width: 283, height: 1226 }
  - label: Final screens
    title: 'Friends, ratings and profile'
    screens: true
    tall: true
    items:
      - { src: /images/playmate-final-profile-1.webp, alt: 'PlayMate — Friends and recent chats', width: 279, height: 1001 }
      - { src: /images/playmate-final-profile-2.webp, alt: 'PlayMate — Post-game feedback', width: 279, height: 1498 }
      - { src: /images/playmate-final-profile-3.webp, alt: 'PlayMate — Another player’s profile', width: 280, height: 1590 }
      - { src: /images/playmate-final-profile-4.webp, alt: 'PlayMate — Your profile', width: 280, height: 1590 }
      - { src: /images/playmate-final-profile-5.webp, alt: 'PlayMate — Settings', width: 279, height: 752 }
      - { src: /images/playmate-final-profile-6.webp, alt: 'PlayMate — No-show penalty', width: 279, height: 1013 }
details:
  - label: Problem
    text: People organise sports in WhatsApp threads and Facebook groups that weren’t built for it. Finding a partner, agreeing on a time and trusting a stranger to show up all break down.
  - label: Hypothesis
    text: The barrier isn’t motivation. It’s the friction of finding the right person and trusting them enough to show up.
  - label: Research
    title: 4 interviews · Berlin
    points:
      - 'Summer, the social performer: plays to find a tribe. The primary persona.'
      - 'Daisy, the efficiency seeker: tired of logistics, cancellations and skill gaps.'
  - label: Solution
    text: Game rooms replace group chats. Profiles work as reputations, scheduling, cost-splitting and waitlists run themselves, and a no-show penalty keeps everyone accountable.
  - label: Usability testing
    title: 4 rounds · 20 participants each
    stats:
      - { value: 80%, issue: 'Round 1: didn’t know when to rate teammates', fix: The rating screen now opens when a game ends }
      - { value: 75%, issue: 'Round 2: landed on Home with no context', fix: Added an onboarding flow }
      - { value: 45%, issue: 'Round 3: wanted to try before signing up', fix: Added “Continue as guest” }
  - label: Next
    points:
      - Filters for a growing list of unrated games
      - Native iOS scroll cues instead of a custom one
      - A header that collapses on scroll
---

I designed PlayMate end to end, a community app that matches people for sports through game rooms instead of group chats.

- **Research** 4 interviews in Berlin shaped two personas and the core problem: trust, not motivation.
- **Testing** 4 rounds of moderated usability testing, 20 participants each, from wireframes to final screens.
- **Accountability** Reliability scores, peer reviews and a no-show penalty make strangers safe to play with.

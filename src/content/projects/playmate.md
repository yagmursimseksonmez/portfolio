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
      - { src: /images/playmate-proto-1.webp, alt: PlayMate onboarding, width: 690, height: 1386 }
      - { src: /images/playmate-proto-2.webp, alt: PlayMate dashboard, width: 687, height: 1382 }
      - { src: /videos/playmate-proto-ss.mp4, alt: PlayMate prototype walkthrough, width: 470, height: 962 }
      - { src: /images/playmate-proto-3.webp, alt: PlayMate discover, width: 686, height: 1393 }
      - { src: /images/playmate-proto-4.webp, alt: PlayMate friends, width: 701, height: 1385 }
  - { label: Round 1 · n=20, title: Low-fidelity wireframes, src: /images/lf-wireframes.webp, alt: Low-fidelity wireframes for PlayMate screens, width: 1920, height: 977 }
  - { label: Round 2 · n=20, title: High fidelity v1, src: /images/playmate-hf1.webp, alt: High-fidelity wireframes v1 for PlayMate screens, width: 1920, height: 940 }
  - label: Round 3 · n=20
    title: High fidelity v2
    items:
      - { src: /images/playmate-r3-1.webp, alt: PlayMate round 3 screen 1, width: 624, height: 1214 }
      - { src: /images/playmate-r3-2.webp, alt: PlayMate round 3 screen 2, width: 614, height: 1228 }
      - { src: /videos/playmate-r3-video.mp4, alt: PlayMate round 3 walkthrough, width: 720, height: 1442 }
      - { src: /images/playmate-r3-3.webp, alt: PlayMate round 3 screen 3, width: 616, height: 1220 }
      - { src: /images/playmate-r3-4.webp, alt: PlayMate round 3 screen 4, width: 604, height: 1222 }
  - { label: Round 4 · final, title: Onboarding, src: /images/playmate-hf-r4-1.webp, alt: Final PlayMate onboarding screens, width: 1920, height: 615 }
  - { label: Round 4 · final, title: Home and game flow, src: /images/playmate-hf-r4-2.webp, alt: 'Final PlayMate screens for home, game details, discover and create game', width: 1920, height: 1294 }
  - { label: Round 4 · final, title: 'Friends, ratings and profile', src: /images/playmate-hf-r4-3.webp, alt: 'Final PlayMate friends, post-game rating and profile screens', width: 1920, height: 1590 }
details:
  - label: Problem
    text: People organise sports in WhatsApp threads and Facebook groups that weren’t built for it. Finding a partner, agreeing on a time and trusting a stranger to show up all break down.
  - label: Hypothesis
    text: The barrier isn’t motivation. It’s the friction of finding the right person and trusting them enough to show up.
  - label: Research
    title: 4 interviews · Berlin and Istanbul
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

- **Research** 4 interviews in Berlin and Istanbul shaped two personas and the core problem: trust, not motivation.
- **Testing** 4 rounds of moderated usability testing, 20 participants each, from wireframes to final screens.
- **Accountability** Reliability scores, peer reviews and a no-show penalty make strangers safe to play with.

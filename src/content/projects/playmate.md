---
title: PlayMate
order: 3
year: '2026'
summary: A community-driven sports matchmaking app.
tags: [Case study, User interviews, Usability testing]
status: complete
description: 'PlayMate: a community-driven sports matchmaking mobile app. Case study from user interviews and personas to a tested design system and final screens.'
ogImage: /og/playmate.jpg
seeMore: false
facts:
  - { label: Position, value: Product Designer }
  - { label: Time, value: '3 months · Summer 2026' }
  - { label: Tools, value: Figma · Claude · Stitch }
hero:
  kicker: PlayMate · case study · community sports app
  title: "Wanna do sports but don't have a team/partner? I have a solution!"
  compact: true
  frame: hero
  lede: 'This is a mobile app that matches people for sport. Instead of a group chat, you join a game room: you see the time, the place, the cost, who’s playing. And the team members? You can check their profile to see skill levels, peer ratings and a no-show penalty, and build trust beforehand.'
  points:
    - { label: Role, title: 'Solo, from interviews to prototype', text: 'I ran the interviews and the usability tests, and designed every screen.' }
    - { label: Problem, title: 'Organising a game, why pure chaos?', text: 'All 4 players I interviewed had a routine, and all struggled with coordination, skill matching or trusting someone new.' }
    - { label: Solution, title: 'Game rooms with reputations', text: 'Schedule, split the cost and play! No place left? Join the waitlist.' }
    - { label: Impact, title: 'Tested at every step, 4 iterations', text: 'With the testers’ feedback, I added cost splitting, waitlists and a rating flow. Made the visual style calmer.' }
  chips: [Case study, User research, Usability testing]
  concept:
    flat: true
    video: { src: /videos/playmate-hero-final.mp4, width: 1400, height: 916, label: 'PlayMate walkthrough: onboarding, finding a match, joining a game, creating one, friends, profiles and settings, with the words “mobile app that connects people through sport” floating around the phone' }
gallery:
  - label: The result
    frame: result
  - label: Problem
    frame: problem
  - label: Plan
    frame: plan
  - label: People and interviews
    frame: people
  - label: Empathy map
    frame: empathy
  - label: Personas and journey map
    frame: personas
  - label: Synthesis
    frame: synthesis
  - label: Concept
    frame: cycle
  - label: User flow
    frame: userflow
  - label: Information architecture
    frame: ia
  - label: Wireframes
    frame: wireframes
  - label: Testing round 1
    frame: testing-round-1
  - label: Design system · Foundations
    title: 'Why it looks like this: vibrant neo-brutalism. Six colours, each with one job, and two typefaces.'
    src: /images/playmate-ds-foundations.svg
    alt: 'PlayMate foundations: light blue backgrounds 35%, yellow primary 30%, white cards 15%, blue actions 11%, pink badges 6%, dark navy text 3%. Why neo-brutalist: thick strokes and hard shadows for a retro pop-art look, game-like touches and isometric illustrations, modular cards that are quick to scan. Testing raised the contrast, cut back the hot pink and toned down the yellow. Epilogue for headings, Inter for the rest.'
    width: 1800
    height: 900
  - label: Design system · Components
    frame: components
  - label: What changed most
    frame: compare
  - label: Usability testing
    title: '4 testers, moderated, 30 minutes each, on every version. What each round changed:'
    beats:
      - letter: W
        name: Wireframes
        text: 'Cost split, venue booking, player limits and a waitlist (shown above), plus:'
        points:
          - { title: Rating flow, text: 'No clear moment to rate. A rating screen now opens when a game ends.' }
          - { title: No-show penalty, text: 'A confirmed player who doesn’t come loses a reliability star.' }
      - letter: '1'
        name: Hi-fi 1
        points:
          - { title: Contrast, text: 'Cards blended into the background. Raised.' }
          - { title: Map, text: 'Stays fixed while the list scrolls. Pins redrawn.' }
          - { title: Settings, text: 'Lost its tab. Opens from the profile menu.' }
          - { title: Onboarding, text: 'First-time users had none. Designed and added.' }
      - letter: '2'
        name: Hi-fi 2
        points:
          - { title: Guest mode, text: '“Continue as guest” added to onboarding.' }
          - { title: Create, text: 'Opens as an overlay, not a separate screen.' }
          - { title: Past games, text: 'Greyscale, so they read as not editable.' }
      - letter: '3'
        name: Hi-fi 3
        points:
          - { title: Onboarding, text: 'Copy shortened. Progress dots to go back.' }
          - { title: “Welcome”, text: 'Repeated on almost every screen. Removed.' }
          - { title: Inputs, text: 'Empty fields looked focused. Now clearly different.' }
  - label: Final screens
    title: 'Onboarding, home, the map, create a game, friends, a friend’s profile and the no-show penalty.'
    device: true
    scroll: true
    items:
      - { src: /images/playmate-final-01.webp, alt: 'Onboarding: More than just a game', width: 402, height: 874 }
      - { src: /images/playmate-screen-home-body.webp, alt: 'Home: upcoming matches, quick links to match history and ratings, and courts nearby', width: 402, height: 1278, head: { src: /images/playmate-screen-home-head.webp, alt: '', width: 402, height: 102 }, foot: { src: /images/playmate-screen-home-foot.webp, alt: '', width: 402, height: 116, nav: 84 } }
      - { src: /images/playmate-screen-map-body.webp, alt: 'Find a Match on the map, with a selected game card and Join Game', width: 402, height: 528, head: { src: /images/playmate-screen-map-head.webp, alt: '', width: 402, height: 252 }, foot: { src: /images/playmate-screen-map-foot.webp, alt: '', width: 402, height: 116, nav: 84 } }
      - { src: /images/playmate-screen-create.webp, alt: 'Create a game: title, sport, player limits, waitlist, schedule, cost split and venue', width: 402, height: 1742 }
      - { src: /images/playmate-screen-friends-body.webp, alt: 'Friends: favourite playmates, recent chats and all friends', width: 402, height: 1256, head: { src: /images/playmate-screen-friends-head.webp, alt: '', width: 402, height: 102 }, foot: { src: /images/playmate-screen-friends-foot.webp, alt: '', width: 402, height: 116, nav: 84 } }
      - { src: /images/playmate-screen-friend-profile-body.webp, alt: 'A friend’s profile: photo, skill rating, trophy case, performance metrics and teammate reviews, with Friends, Message and Invite to game buttons', width: 402, height: 2039, head: { src: /images/playmate-screen-friend-profile-head.webp, alt: '', width: 402, height: 102 }, foot: { src: /images/playmate-screen-friend-profile-foot.webp, alt: '', width: 402, height: 116, nav: 84 } }
      - { src: /images/playmate-screen-no-show-body.webp, alt: 'No-show penalty: reliability impact, incident log, the policy and an appeal button', width: 402, height: 950, head: { src: /images/playmate-screen-no-show-head.webp, alt: '', width: 402, height: 102 }, foot: { src: /images/playmate-screen-no-show-foot.webp, alt: '', width: 402, height: 116, nav: 84 } }
  - label: Outcome
    frame: outcome
  - label: Overview
    frame: summary
prototype:
  label: Try it
  title: Play with the prototype.
  text: Join a game, create one and rate your teammates, on the same screens as above.
  poster: { src: /images/playmate-screen-home.webp, alt: 'PlayMate home screen', width: 402, height: 1464 }
  cta: Prototype coming soon
---

/* Edit portfolio copy here. Public audience counts are dated snapshots.
   Set character.image to a transparent square image, character.frames to 1,
   and remove character.animations
   to change the guide without touching the room art. */
const frissonReels = [
  {
    title: 'A chibi story at the fish market',
    type: 'AI-assisted character story',
    url: 'https://www.instagram.com/reel/DcMS-QNvZgj/', poster: 'assets/reel-fish-market.webp',
    result: '25.7K likes',
    note: 'A character moment placed inside an everyday, real-world scene.'
  },
  {
    title: 'A rainy character story',
    type: 'Chibi animation',
    url: 'https://www.instagram.com/reel/DcR2IaJPSZs/', poster: 'assets/reel-rainy-story.webp',
    result: '19.1K likes',
    note: 'A mood-led animation that gives the companion a small story of its own.'
  },
  {
    title: 'Showing the product myself',
    type: 'On-camera product demo',
    url: 'https://www.instagram.com/reel/DTbhlYYkmyv/', poster: 'assets/reel-product-demo.webp',
    result: '24.1K likes',
    note: 'A more direct format: my face, the app, and a clear reason to look closer.'
  }
];

const sheet = (name, frames, rows) => ({ fps: 24, ground: 84.5, pages: [{ image: `assets/fibi-${name}-sheet.webp`, frames, columns: 10, rows }] });

window.PORTFOLIO = {
  name: 'Tod Yansomboon',
  portrait: 'assets/tod-portrait.png',
  character: {
    name: 'Fibi', image: 'assets/fibi-idle.png', frames: 15,
    animations: {
      idle: { fps: 24, ground: 84.5, pages: Array.from({ length: 7 }, (_, index) => ({ image: index === 0 ? 'assets/fibi-idle.png' : `assets/fibi-idle-${index}.png`, frames: index === 6 ? 7 : 15 })) },
      walk: { fps: 24, ground: 84.5, pages: [{ image: 'assets/fibi-walk-0.png', frames: 15 }, { image: 'assets/fibi-walk-1.png', frames: 13 }] },
      // Full 24 fps cycles from Fibi's Otomates character set, as 10-column sheets.
      hello: sheet('hello', 80, 8),
      talking: sheet('talking', 97, 10),
      happy: sheet('happy', 45, 5),
      jumping: sheet('jumping', 97, 10),
      sitLoop: sheet('sitLoop', 97, 10),
      thinking: sheet('thinking', 67, 7),
      laugh: sheet('laugh', 82, 9),
      pet: sheet('pet', 38, 4),
      sleep: sheet('sleep', 97, 10),
      dancing: sheet('dancing', 83, 9),
      // Walking toward the viewer, walking away, and dangling while picked up.
      walkToward: sheet('walk-toward', 97, 10),
      walkAway: sheet('walk-away', 97, 10),
      held: sheet('held', 97, 10),
      falling: sheet('falling', 121, 13),
      celebrate: sheet('dancing', 83, 9)
    }
  },
  contact: {
    email: 'todsopon@hotmail.com',
    linkedin: 'https://www.linkedin.com/in/todsophon',
    youtube: 'https://www.youtube.com/@Todsophon'
  },
  resumeDownload: null,
  chapters: {
    youtube: {
      number: '02', label: 'THE CREATOR CORNER', kicker: '',
      cover: { image: 'assets/tod-channel-banner.png', alt: 'Todsophon channel artwork with my wordmark, fantasy characters, and one-million-subscriber milestone', caption: 'My channel artwork, created for the 1M subscriber milestone.' },
      title: 'I make YouTube videos for 1.81 million subscribers.',
      role: 'Todsophon, since September 2020. I write, make and grow it.',
      lead: 'The channel is storytelling, gaming and a little mischief, and it has grown into a real community. Together the videos have been watched 455.3 million times.',
      meta: [
        { label: 'My role', value: 'Creator · strategy & growth' },
        { label: 'Since', value: 'September 2020' }
      ],
      metrics: [
        { value: '1.81M', label: 'YouTube subscribers' },
        { value: '455.3M', label: 'YouTube channel views' }
      ],
      source: {
        note: 'Channel totals and video view counts were recorded on September 21, 2026.'
      },
      milestones: [
        { metal: 'silver', value: '100K', title: 'The first 100,000', text: 'When COVID sent me back to Thailand, making videos became a way to connect and help others feel less alone. A playful song parody unexpectedly reached millions of viewers overnight. To me, the silver milestone represents the community that began when I let myself be myself.' },
        { metal: 'gold', value: '1M', title: 'One million', text: 'By November 2023, SPU introduced my channel as having more than a million subscribers and over 200 million views. In our conversation, I explained that each new video reinforced the same lesson: being different could help me find the people who enjoyed what I made.' }
      ],
      milestoneSource: { label: 'Read the SPU Voices interview', url: 'https://stories.spu.edu/articles/a-virtual-place-to-belong-with-tod-yansomboon-24', note: 'SPU tells the story and reports the 1M+ milestone, but doesn’t give a date for reaching 100K or 1M.' },
      sections: [
        { title: 'Watching the numbers', text: 'I pay close attention to click-through rate, retention and engagement, and they shape a lot of my creative calls, from how a video opens to how long the story can hold someone.' },
        { title: 'A few to start with', text: 'Three popular Shorts from different years and a mix of longer videos from across my channel: gaming, challenges, tutorials, and on-camera stories.' }
      ],
      videos: [
  {
    "title": "Minecraft, help me throw the spear!!",
    "url": "https://www.youtube.com/shorts/tQ1hhdB1wrw",
    "format": "YouTube Short",
    "metric": "17M views",
    "publishedAge": "2025",
    "recorded": "October 8, 2026",
    "description": "A popular short from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/tQ1hhdB1wrw/oar3.jpg?sqp=-oaymwEYCJUDENAFSFqQAgHyq4qpAwcIARUAAIhC&rs=AOn4CLDCaxSt9I4jLOF8AmDUIgevRbEtGw&usqp=CCk"
  },
  {
    "title": "😂โอเค Google!! \"กาแฟแท้☕️\" | Tot Musica #Shorts",
    "url": "https://www.youtube.com/shorts/AcDzJrr6N4k",
    "format": "YouTube Short",
    "metric": "10M views",
    "publishedAge": "2022",
    "recorded": "October 8, 2026",
    "description": "A popular short from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/AcDzJrr6N4k/oar1.jpg?sqp=-oaymwEYCJUDENAFSFqQAgHyq4qpAwcIARUAAIhC&rs=AOn4CLDUK3S1k-9pz_qAfwVcqWpyPy7sKA&usqp=CCk"
  },
  {
    "title": "Minecraft - What's Inside Bedrock?",
    "url": "https://www.youtube.com/shorts/m3TCRhoDmmI",
    "format": "YouTube Short",
    "metric": "10M views",
    "publishedAge": "2021",
    "recorded": "October 8, 2026",
    "description": "A popular short from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/m3TCRhoDmmI/oar2.jpg?usqp=CCk"
  },
  {
    "title": "A very strange game!? The \"Feed the Head\" game requires feeding the head!! | Feed The Head",
    "url": "https://www.youtube.com/watch?v=omOpfiMymzA",
    "format": "Long-form video",
    "metric": "549K views",
    "publishedAge": "5 years ago",
    "duration": "9:11",
    "recorded": "October 8, 2026",
    "description": "Selected from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/omOpfiMymzA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCva9H778Uze2CEYYmZ0m1WQJwzjw"
  },
  {
    "title": "จำลองการป้อนอาหาร จาก ปาก ไป ตู.. Eating Simulator",
    "url": "https://www.youtube.com/watch?v=xeDyY2vlzWw",
    "format": "Long-form video",
    "metric": "371K views",
    "publishedAge": "3 years ago",
    "duration": "10:12",
    "recorded": "October 8, 2026",
    "description": "Selected from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/xeDyY2vlzWw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLA6P8L_KGYfw-xwwpzbS8RIT7jFTg"
  },
  {
    "title": "Minecraft, but you ACTUALLY HURT!",
    "url": "https://www.youtube.com/watch?v=Toq390KiJ0o",
    "format": "Long-form video",
    "metric": "286K views",
    "publishedAge": "2 years ago",
    "duration": "19:25",
    "recorded": "October 8, 2026",
    "description": "Selected from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/Toq390KiJ0o/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDBuLSLRk6TeFUj66gdWFgDvLE9Ig"
  },
  {
    "title": "โทรศัพท์!! สอนโหลด \"สัตว์เลี้ยง\" Among Us มาบนหน้าจอ โทรศัพท์ Andriod!!! Todsopon",
    "url": "https://www.youtube.com/watch?v=BgNgx1ozIx0",
    "format": "Long-form video",
    "metric": "358K views",
    "publishedAge": "5 years ago",
    "duration": "5:11",
    "recorded": "October 8, 2026",
    "description": "Selected from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/BgNgx1ozIx0/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBsi8jqF6sg3P2DXRuP03a_-1_WiA"
  },
  {
    "title": "Minecraft, but all the creatures are terrifying!!!",
    "url": "https://www.youtube.com/watch?v=VoTGeEgBs5g",
    "format": "Long-form video",
    "metric": "262K views",
    "publishedAge": "3 years ago",
    "duration": "12:22",
    "recorded": "October 8, 2026",
    "description": "Selected from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/VoTGeEgBs5g/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCF3rEREnK98Kw3shvZzXWMUndlQg"
  },
  {
    "title": "I Tested 1-Star Fast Food",
    "url": "https://www.youtube.com/watch?v=ceBkGA7Y-1k",
    "format": "Long-form video",
    "metric": "208K views",
    "publishedAge": "2 years ago",
    "duration": "18:01",
    "recorded": "October 8, 2026",
    "description": "Selected from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/ceBkGA7Y-1k/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLA4vl97LPfZB9iqFBZYIz-CfMzkrA"
  },
  {
    "title": "สุดโหด!! เล่น Roblox โหมด Obby ด้วยคีย์บอร์ด \"ไร้ปุ่ม!!\" 🤩 - Rob Mr. Rich's Mansion EP.1",
    "url": "https://www.youtube.com/watch?v=lxuTbqeOwp0",
    "format": "Long-form video",
    "metric": "290K views",
    "publishedAge": "5 years ago",
    "duration": "20:20",
    "recorded": "October 8, 2026",
    "description": "Selected from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/lxuTbqeOwp0/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAAm80n1cbcUGNalVReMh379OKW2w"
  },
  {
    "title": "มายคราฟ, แต่ ตาย = ซื้อของแปลก รีวิว (ft.เป็ด)",
    "url": "https://www.youtube.com/watch?v=xc91AGQUeC8",
    "format": "Long-form video",
    "metric": "264K views",
    "publishedAge": "2 years ago",
    "duration": "15:43",
    "recorded": "October 8, 2026",
    "description": "Selected from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/xc91AGQUeC8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAqt3NCVQGUdRVfqG_R1PmCjM_BLA"
  },
  {
    "title": "มายคราฟ, แต่ คุณ น่ากลัวเกินไป…",
    "url": "https://www.youtube.com/watch?v=jobo7XDwr6E",
    "format": "Long-form video",
    "metric": "157K views",
    "publishedAge": "1 year ago",
    "duration": "12:00",
    "recorded": "October 8, 2026",
    "description": "Selected from across my channel’s history.",
    "thumbnail": "https://i.ytimg.com/vi/jobo7XDwr6E/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLC6PyrtH_ac52vyxJN3QWhu18t2iA"
  }
],
      tags: ['Content strategy', 'Video storytelling', 'Audience analytics', 'Community'],
      link: { label: 'Visit my YouTube channel', url: 'https://www.youtube.com/@Todsophon' },
      links: [{ label: 'My story in SPU Voices', url: 'https://stories.spu.edu/articles/a-virtual-place-to-belong-with-tod-yansomboon-24' }],
      position: [38, 63]
    },
    tiktok: {
      number: '03', label: 'THE SHORT-FORM STUDIO', kicker: '',
      title: 'I make short videos and test what keeps people watching.',
      role: 'Social Media Analyst at Frisson Labs. Mostly hooks, pacing and calls to action.',
      lead: 'A short video needs a reason to keep watching in the first second. I make them, post them, and use what the audience does to plan the next one.',
      meta: [
        { label: 'My role', value: 'Social Media Analyst · Frisson Labs' },
        { label: 'Focus', value: 'Hooks, pacing & calls to action' }
      ],
      sections: [
        { title: 'Start with the hook', text: 'I test creative variations, opening hooks, and calls to action. Each version gives me something specific to compare when reviewing how people respond.' },
        { title: 'Give the idea some personality', text: 'I make short-form videos and chibi animations using Seedance, Kling, and CapCut. Animation and editing help turn product ideas into small, expressive stories.' },
        { title: 'Let the audience pick the next cut', text: 'I go through TikTok, YouTube and Instagram analytics and bring what I see back into planning. Making the video and understanding how it did on each platform are the same job to me.' }
      ],
      reels: frissonReels,
      reelIntro: 'I come up with the idea, animate with Seedance and Kling, edit in CapCut, then watch how people respond. These three show animation, product storytelling and me on camera.',
      reelSource: { note: 'These Reels are Tod’s selections from @tod_desu. Like counts are rounded snapshots observed September 22, 2026; they may change.', label: 'Visit @tod_desu', url: 'https://www.instagram.com/tod_desu/' },
      tags: ['TikTok', 'Short-form video', 'Creative testing', 'Chibi animation'],
      link: { label: 'See the Instagram channel I created', url: 'https://www.instagram.com/tod_desu/' },
      position: [63, 73]
    },
    oto: {
      collection: [
        { id: 'animation', type: 'CREATION SYSTEM', title: 'Otomate Creator', description: 'The character creation and automatic animation workflow I built.', image: 'assets/oto-animation-creator.png', imageAlt: 'The actual Otomate Creator setup interface', previewImage: 'assets/oto-animation-pack.png', screenshots: [{ src: 'assets/oto-animation-creator.png', label: 'Character setup · actual repo interface in local preview mode' }, { src: 'assets/oto-animation-pack.png', label: 'Starter animation pack · preview account and test credits; no generation was run' }], contribution: 'I built the character creation and automatic animation system.', steps: ['Prepare a full-body image', 'Create the character cutout', 'Queue the starter animations', 'Preview and review the loops'], text: 'The guided creator prepares the image, queues an animation pack, shows progress for individual actions, and lets people preview the generated loops. Job links let people return to work in progress, rather than starting from a blank form.', link: { label: 'Explore the character creator', url: 'https://www.oto.chat/generate' } },
        { id: 'games', type: 'GAME DISCOVERY + DESIGN', title: 'Oto Arcade', description: 'The games page, with Word Guess and Bridge Walk as playable examples.', image: 'assets/bridge-walk-card.webp', imageAlt: 'Bridge Walk game artwork', contribution: 'I built the games page and worked on companion-led game experiences.', text: 'The games hub brings the catalog, search, and recently played games together. It also handles the path from a game link into the mobile app or web experience.', link: { label: 'Explore the games hub', url: 'https://www.oto.chat/games' } },
        { id: 'discord', image: 'assets/oto-discord-hub.png', imageAlt: 'Oto Discord Activity game library rendered from the repository', screenshots: [{ src: 'assets/oto-discord-hub.png', label: 'Discord Activity game library · actual repo UI with the bundled catalog, running locally outside Discord' }], type: 'COMMUNITY PRODUCT', title: 'Oto in Discord', description: 'The Discord feature connects the community with Oto’s games and companions.', contribution: 'I built Oto’s Discord feature.', steps: ['Open the Activity', 'Choose a game', 'Play with a companion'], text: 'The repository includes the Discord Activity hub, game launch routing, and linked-account and guest flows. These connect a Discord entry point to the companion and game experience without treating every player as a new account.' },
        { id: 'wiki', type: 'CHARACTERS + DISCOVERY', title: 'Chibi Wiki', description: 'A home for character stories, outfits, creator clips, and community discovery.', image: 'assets/oto-wiki-home.png', imageAlt: 'Chibi Wiki home with search, series filters and character discovery', previewImage: 'assets/oto-wiki-character.png', screenshots: [{ src: 'assets/oto-wiki-home.png', label: 'Chibi Wiki · live home page, captured October 2026' }, { src: 'assets/oto-wiki-character.png', label: 'Fibi Chubi · live character page with creator clips and outfits' }], contribution: 'I built the wiki website.', text: 'Chibi Wiki brings character profiles, game and series browsing, outfits, and creator pages into one place. Character pages connect the written profile with clips, fan art, and comments; the site also includes search and community contribution prompts.', link: { label: 'Visit Chibi Wiki', url: 'https://www.chibiwiki.com/' } },
        { id: 'home', type: 'COMPANION PRODUCT', title: 'Oto Home', description: 'Oto Home, companion behavior, and cross-platform interaction work.', image: 'assets/pin-app.webp', imageAlt: 'Oto companion app preview' }
      ],
      number: '01', label: 'THE COMPANION LAB', kicker: '',
      title: 'Things I built',
      role: 'Social Media Analyst at Frisson Labs since October 2025.',
      lead: 'At Frisson Labs, I connect content and community with the product experience—from introducing Oto through short videos to helping new users get started, discover games, and continue playing.',
      recentWork: {
        title: 'From discovering Oto to playing again',
        note: 'Recent implementation work in the Oto staging branch, reviewed October 20, 2026. These examples describe what I built; release status and conversion or retention impact are not yet confirmed.',
        stories: [
          { title: 'Helping new users get started', text: 'I reworked the Home opening around Fibi’s wordless first-run story: clearer character reactions, a guided food interaction, and a transition into a first game. The aim was to let people learn through playing and caring for their companion.', contribution: 'First-run flow, onboarding animation clips, and interaction refinement.' },
          { title: 'Connecting content to product actions', text: 'I added web analytics that connect a visitor’s incoming link with game activity, sign-in, and the app handoff. This creates a way to investigate what happens after someone clicks through from content, beyond counting views or link clicks.', contribution: 'Acquisition context and event tracking across the web journey.' },
          { title: 'Helping players continue on mobile', text: 'I built a “Keep playing anywhere” prompt for mobile web visitors returning from a game. It offers the app, an external-browser option where relevant, or continued web play, and carries campaign context into store links. The prompt also records which option people choose.', contribution: 'Mobile app handoff, campaign-aware store links, and choice tracking.' }
        ]
      },
      community: 'So far I’ve brought about 15,000 people into Oto’s Discord. I support the product through character videos, community building, and product feedback.',
      shortForm: 'I also run @tod_desu on Instagram ({followers} followers). Otomates show up there in little stories, and sometimes I demo the app on camera myself. Three I’m happy with:',
      meta: [
        { label: 'My role', value: 'Social Media Analyst' },
        { label: 'Dates', value: 'October 2025–Present' },
        { label: 'Across', value: 'Web, Android, iOS, games & Discord' }
      ],
      metrics: [
        { value: '15K', label: 'people brought to Discord' },
        { value: '8.16K', label: 'iOS first-time downloads' },
        { value: '4,421', label: 'Android active testers' }
      ],
      source: { note: 'Community milestone provided by Tod, September 2026. Product figures from App Store Connect and Google Play Console screenshots supplied October 2026. Selected work reflects contributions within the Frisson Labs team.' },
      traction: {
        intro: 'I support Oto’s growth through character videos, community building, and product feedback.',
        metrics: [
          { value: '8.16K', label: 'iOS first-time downloads', detail: 'Oct 20, 2025–Oct 8, 2026' },
          { value: '4,421', label: 'Android active testers', detail: 'Play Console snapshot · supplied Oct 2026' },
          { value: '178', label: 'Android countries / regions', detail: 'Testing availability' }
        ],
        note: 'These figures show product traction during my time on the team. Downloads and active testers are separate measures; countries / regions describes testing availability.',
        evidence: [
          { src: 'assets/oto-ios-analytics.png', label: 'App Store Connect · iOS first-time downloads', alt: 'App Store Connect reports 8.16K first-time downloads from October 20, 2025 to October 8, 2026, with a daily download chart.' },
          { src: 'assets/oto-android-analytics.png', label: 'Google Play Console · Android testing', alt: 'Google Play Console track summary shows 4,421 active testers and availability in 178 countries and regions.' }
        ]
      },
      channel: {
        handle: '@tod_desu',
        followers: '16.1K',
        note: 'Public follower count observed September 22, 2026. The account introduces Otomates and links visitors to oto.chat.',
        url: 'https://www.instagram.com/tod_desu/'
      },
      reels: frissonReels,
      reelSource: { note: 'These Reels are Tod’s selections from @tod_desu. Like counts are rounded snapshots observed September 22, 2026; they may change.', label: 'Visit @tod_desu', url: 'https://www.instagram.com/tod_desu/' },
      productShowcase: {
        title: 'An Otomate you can meet, care for, and play with',
        text: 'I contributed to Oto Home’s companion feedback and room interactions, plus Android behavior. The public app lets people feed a companion, decorate its home, and play together.',
        screenshots: [
          { label: 'Raise your companion', alt: 'Official Oto App Store screenshot introducing a chibi companion and its care interface', src: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/a5/0e/68/a50e6821-157a-5470-aa0b-dc2271a6f496/01-raise.png/314x680bb.webp' },
          { label: 'Play together', alt: 'Official Oto App Store screenshot showing a companion game', src: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/ff/c3/8d/ffc38d9b-565b-4bd4-06be-302c6427aff1/02-play.png/314x680bb.webp' },
          { label: 'Make their home', alt: 'Official Oto App Store screenshot introducing home decoration', src: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/15/71/84/157184c5-4a55-8395-4f65-7f28627cda75/03-decorate.png/314x680bb.webp' },
          { label: 'Chat and grow', alt: 'Official Oto App Store screenshot showing a companion conversation', src: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/12/b8/6b/12b86ba1-dec5-a41f-02d0-4afff5217c26/04-chat.png/314x680bb.webp' }
        ],
        steps: [
          { label: 'Meet', text: 'Choose a companion with a personality.' },
          { label: 'Care', text: 'Feed, dress, and make its home feel like yours.' },
          { label: 'Play', text: 'Bring the companion into games and voice moments.' }
        ]
      },
      projects: [
        {
          kind: 'APP', status: 'Shipped on iOS', title: 'The Oto app',
          image: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/a5/0e/68/a50e6821-157a-5470-aa0b-dc2271a6f496/01-raise.png/314x680bb.webp',
          imageAlt: 'Official Oto App Store screenshot of the companion app',
          text: 'You adopt an Otomate, feed it, decorate its room, talk to it and play games together.',
          contribution: 'I worked on how the companion moves and reacts in its room, made its feedback clearer, handled Android behavior, and kept iterating with the rest of the Frisson Labs team.',
          link: { label: 'View the shipped app', url: 'https://apps.apple.com/us/app/oto-ai-voice-companion/id6754143501' }
        },
        {
          kind: 'GAME', status: 'Playable in Oto', title: 'Word Guess!',
          image: 'assets/word-guess-card.png', imageAlt: 'Word Guess game art with Fibi and a five-letter puzzle',
          video: 'assets/game-word-guess.mp4', link: { label: 'Play Word Guess', url: 'https://www.oto.chat/games/word-guess' },
          text: 'A daily word puzzle where your Otomate helps sort clues and brings personality to each guess.',
          contribution: 'I shaped how it feels to play alongside your companion, how people find the game, and a lot of small interaction polish.'
        },
        {
          kind: 'GAME', status: 'Playable in Oto', title: 'Bridge Walk',
          image: 'assets/bridge-walk-card.webp', imageAlt: 'Bridge Walk game art showing Fibi crossing rooftops',
          video: 'assets/game-bridge-walk.mp4', link: { label: 'Play Bridge Walk', url: 'https://www.oto.chat/games/bridge-walk' },
          text: 'A timing game: grow the bridge, cross the gap, and chase a perfect landing.',
          contribution: 'This one started as my idea. I worked on the interaction and polish, then measured how people played it.'
        },
        {
          kind: 'AI VIDEO', status: 'Posted on Instagram', title: 'Short stories with Otomates',
          image: 'assets/fibi-happy.webp', imageAlt: 'Fibi smiling',
          text: 'Short clips where the companions have little adventures, plus a few where I show the app myself.',
          contribution: 'I come up with the idea, animate it with AI tools, edit, post, and then read the comments and numbers to plan the next one.',
          link: { label: 'Watch a selected Reel', url: 'https://www.instagram.com/reel/DcMS-QNvZgj/' }
        }
      ],
      workSamples: [
        { eyebrow: 'COMPANION PRODUCT', title: 'A home that feels alive', text: 'Worked on Oto Home’s companion behavior and room interactions: visible plans, clearer action feedback, feeding, wardrobe and music controls, and a smoother bridge between conversation and play.', contribution: 'Web experience + Android behavior' },
        { eyebrow: 'GAME DESIGN + DISCOVERY', title: 'Games with a companion in them', text: 'Built and refined game experiences, previews, menus, and discovery flows. Word Guess brings the Otomate into a daily puzzle; Bridge Walk turns a simple timing mechanic into a character-led challenge.', contribution: 'Concept, interaction, polish, and measurement' },
        { eyebrow: 'CROSS-PLATFORM + COMMUNITY', title: 'From app to Discord', text: 'Connected Oto’s mobile and web experiences with the community around them: Android and iOS game and voice flows, a Discord Activity hub, game cards, and player-aware companion moments.', contribution: 'Android, iOS, web, and Discord' }
      ],
      sections: [
        { title: 'How it fits together', text: 'What people watch, play and share tells me where they get stuck or bored. I move between making content, product flows, game feel and analytics because to me they are all part of the same job.' },
        { title: 'Meet Fibi', text: 'Fibi appears in Oto’s character gallery under my creator name, todsophon. She is also the little guide wandering around this portfolio room.' }
      ],
      tags: ['Product iteration', 'Community growth', 'Android & iOS', 'Games', 'AI companions'],
      link: { label: 'Meet Oto', url: 'https://www.oto.chat/' },
      links: [
        { label: 'Oto for iOS', url: 'https://apps.apple.com/us/app/oto-ai-voice-companion/id6754143501' },
        { label: 'Explore the companions', url: 'https://www.oto.chat/otomates' }
      ],
      position: [59, 61]
    },
    about: {
      number: '05', label: 'THE PERSON BEHIND THE ROOM', kicker: '',
      title: 'Hi, I’m Tod.',
      role: 'Based in Seattle, originally from Thailand.',
      lead: 'I’m a storyteller and an analyst at the same time. I like taking what an audience actually does and turning it into better videos and better products.',
      meta: [
        { label: 'Based in', value: 'Seattle, Washington' },
        { label: 'At home with', value: 'Content, community & data' }
      ],
      sections: [
        { title: 'From Thailand to Seattle', text: 'I’m from Thailand and studied international business at Seattle Pacific University. Making videos became another kind of education: a way to find my voice, understand an audience, and build a community.' },
        { title: 'Following the interesting questions', text: 'What makes someone keep watching? Where does a product flow need more clarity? Which signal is worth acting on? Those questions connect my creator work, my role at Frisson Labs, and my studies in business analytics.' },
        { title: 'Make yourself at home', text: 'This studio brings those parts of my work together. Explore the desks, browse the projects, or move the furniture around. There’s room for a little play.' }
      ],
      education: [
        { school: 'University of Washington · Foster School of Business', degree: 'M.S. in Business Analytics', date: 'In progress' },
        { school: 'Seattle Pacific University', degree: 'B.A. in International Business Administration · Communication minor', date: 'November 2023' }
      ],
      quote: '“Be yourself.”',
      quoteCredit: 'From my conversation with SPU Voices, November 2023',
      link: { label: 'Read my SPU story', url: 'https://stories.spu.edu/articles/a-virtual-place-to-belong-with-tod-yansomboon-24' },
      tags: ['Creator', 'Builder', 'Always curious'],
      position: [42, 76]
    },
    analytics: {
      number: '04', label: 'THE ANALYST’S NOTEBOOK', kicker: '',
      title: 'I use data to catch problems before customers feel them.',
      role: 'Python, SQL, XGBoost and Airflow.',
      lead: 'Two academic projects and one growth job: predicting customer issues a week early, modeling churn, and testing campaigns at Spotly.',
      meta: [
        { label: 'Work', value: 'Salesforce capstone & churn modeling' },
        { label: 'Tools', value: 'Python, SQL, XGBoost & Airflow' }
      ],
      sections: [
        { title: 'Salesforce capstone · Customer health', text: 'In this academic capstone, I built a model to predict customer issues one week ahead using Python and XGBoost. I also developed a daily account health scoring workflow for 5,000+ accounts with SQL and Airflow, identifying the highest-risk 5% for review.' },
        { title: 'E-commerce · Churn prediction', text: 'For my March 2025 project, I used XGBoost to model customer churn in an imbalanced dataset. The project focused on identifying customers at risk of leaving and evaluating the model’s ability to find them.' },
        { title: 'Spotly · Growth analytics', text: 'As Growth & Business Analytics Manager, I contributed to campaigns that generated more than one million LinkedIn impressions and brought in thousands of new users over several weeks. My work on the Genesis25 campaign included creative testing and call-to-action analysis.' }
      ],
      tags: ['Customer health', 'Churn prediction', 'Growth analytics', 'Python & SQL']
    },
    resume: {
      number: '06', label: 'EXPERIENCE & EDUCATION', kicker: '',
      title: 'Tod Yansomboon',
      role: 'Seattle, WA',
      lead: 'I connect audience insights, creative experimentation, and product iteration across content, social platforms, and AI companion experiences.',
      sections: [],
      experience: [
        {
          company: 'Frisson Labs', role: 'Social Media Analyst', date: 'October 2025–Present',
          summary: 'Build and iterate on web and iOS experiences using behavior and engagement insights. Create short-form videos and chibi animations with Seedance, Kling, and CapCut; test creative hooks and calls to action; collaborate daily with the CEO on product and marketing priorities.'
        },
        {
          company: 'Todsophon · YouTube', role: 'Creator · Strategy & Growth', date: 'September 2020–Present',
          summary: 'Develop content strategy and grow an audience through storytelling and analysis of click-through rate, retention, and engagement. The channel reached 1.81M subscribers and 455.3M views as of September 21, 2026.'
        },
        {
          company: 'Spotly', role: 'Growth & Business Analytics Manager', date: 'August–October 2025',
          summary: 'Contributed to campaigns generating 1M+ LinkedIn impressions and thousands of new users in several weeks. Supported the Genesis25 campaign through creative testing and call-to-action analysis.'
        },
        {
          company: 'Salesforce capstone · Academic project', role: 'Data & Applied Scientist', date: 'April 2025–Present',
          summary: 'Built a customer-issue prediction model with Python and XGBoost. Developed an account health scoring workflow for 5,000+ accounts using SQL and Airflow to identify the highest-risk 5%.'
        }
      ],
      education: [
        { school: 'University of Washington · Foster School of Business', degree: 'M.S. in Business Analytics', date: 'In progress' },
        { school: 'Seattle Pacific University', degree: 'B.A. in International Business Administration · Communication minor', date: 'November 2023' }
      ],
      skills: ['Content strategy', 'Audience analytics', 'Creative testing', 'Product iteration', 'Python', 'SQL', 'XGBoost', 'Airflow', 'Seedance', 'Kling', 'CapCut'],
      links: [
        { label: 'YouTube', url: 'https://www.youtube.com/@Todsophon' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/todsophon' }
      ]
    }
  }
};

// The employer case study and project gallery have separate, shareable destinations.
window.PORTFOLIO.chapters.frisson = {
  label: 'FRISSON LABS / OTO', title: 'Building an AI companion people want to spend time with.',
  role: window.PORTFOLIO.chapters.oto.role,
  lead: 'At Frisson Labs, we’re building Oto: an AI companion that can talk with you, play games with you, and respond to what’s happening on your screen. I help connect the whole experience—from the videos that introduce it to the community, onboarding, and product people come back to.',
  reels: frissonReels,
  sections: [
    { title: 'A companion beyond the chat window', text: 'Oto is built around a character you can spend time with. Across its app, desktop, web, and Discord experiences, that means conversation, screen-aware reactions, games together, and a home where you can care for your companion. The features vary by platform, but the idea connects them: a companion that takes part in what you’re doing.' },
    { title: 'My role across marketing, growth, and product', text: 'My title is Social Media Analyst, but my work reaches from introducing Oto to improving the experience itself. I create character videos and product demos, build community, examine what people do after they arrive, and work with the team on the product. That lets me connect the promise in a video with what someone actually experiences when they try Oto.' },
    { title: 'Marketing that makes the companion feel real', text: 'I come up with short-video ideas, animate characters with Seedance and Kling, edit in CapCut, and publish the work. Some videos give the characters small stories in everyday settings; others put me on camera showing the product. I review hooks, pacing, comments, and calls to action to decide what to try next.' },
    { title: 'Growth beyond getting views', text: 'I’ve brought about 15,000 people into Oto’s Discord, a milestone recorded in September 2026. More recently, I added web tracking that connects incoming links with game activity, sign-in, and app handoff, and built a mobile “Keep playing anywhere” prompt. The goal is to understand which introductions lead people into the experience and help them continue after their first game.' },
    { title: 'Helping shape the product people arrive in', text: 'I contribute to Oto Home’s companion behavior, room interactions, and Android experience. My recent work reworked Fibi’s first-run opening around clearer reactions, caring for her, and moving into a first game. I also built the character creation and animation workflow, the games page, Oto’s Discord feature, and Chibi Wiki. The project gallery shows those individual pieces in more detail.' },
    { title: 'Connecting the work', text: 'The questions carry across everything I do: what makes someone care about the character, what helps them understand the product, and where does the experience lose them? Content and community help me see what resonates; product work lets me act on it. Recent onboarding, web tracking, and mobile handoff examples are implemented in staging as of October 20, 2026; their release status and impact on conversion or retention are not yet confirmed.' },
    { title: 'What I learned from a call to action', text: 'An end-of-video CTA example recorded 153 bio-link clicks, 187 profile visits, and 18 follows. A different character video recorded 12 bio-link clicks, 979 profile visits, and about 1,900 follows. They served different goals: this was a comparison of different videos, not an A/B test, and clicks were not confirmed signups.' }
  ],
  source: window.PORTFOLIO.chapters.oto.source
};

window.PORTFOLIO.chapters.contact = {
  label: 'LET’S TALK', title: 'What should we make next?',
  lead: 'Have a role, a collaboration, or an idea in mind? I’d love to hear what you’re working on.',
  sections: [{ title: 'A good place to start', text: 'Tell me a little about yourself, what you have in mind, and how I can get back to you.' }]
};

const aiContentStory = {
  id: 'content', type: 'AI CONTENT + AUTOMATION', title: 'AI videos, from experiments to Fibi Daily',
  description: 'Fibi Daily: a Claude morning routine, five account workflows, and performance tracking—built from lessons in making AI videos.',
  image: 'assets/fibi-daily-cover.svg', imageAlt: 'Fibi Daily cover with the actual review interface and the create, review, publish, and learn workflow across five accounts',
  text: 'I build tools that turn creative experiments into repeatable content workflows—from AI presenter videos to daily drafts across five accounts.',
  contribution: 'Creative direction, AI video tooling, the reusable production guide, and daily video draft automation.',
  screenshots: [{ src: 'assets/seedance-studio-real.png', label: 'The video creation tool I built · actual interface capture without account data' }]
};
aiContentStory.dailyOperation = {
  title: 'Fibi Daily — from daily drafts to reviewed posts',
  screenshot: 'assets/fibi-daily-real.jpg',
  screenshotCaption: 'Actual Fibi Daily interface rendered from the repository. This capture shows its signed-out state; the Claude-hosted draft queue is not loaded.',
  intro: 'Claude prepares the drafts. I review, edit, and choose what gets posted.',
  overview: [],
  walkthroughTitle: 'Five accounts. One review workflow.',
  walkthroughIntro: 'The problem: drafts and captions spread across five accounts. I built the daily draft workflow and review interface to keep the decisions together.',
  accounts: ['@tod_desu', '@fibi.chupi.daily', '@zzz.chibi.daily', '@teto.miku.daily', '@frieren.chibi.daily'],
  stages: [
    { title: 'Morning routine', detail: 'Claude starts the daily draft workflow.' },
    { title: 'Create for each account', detail: 'Prepare source material, generated remakes or recuts, captions, and CTA variations.' },
    { title: 'Review in Fibi Daily', detail: 'Filter by account, preview drafts, edit captions, trim, skip, and choose what to post.' },
    { title: 'Track and learn', detail: 'Record post links and available views, shares, likes, saves, watch time, and skip rates.' }
  ]
};
aiContentStory.storySections = [
  { title: 'Before Fibi Daily: could an AI presenter perform my videos?', text: 'An earlier personal prototype explored replacing me with an AI person while using my recorded performance as the starting point. I built a four-step interface: upload a video, generate or upload a replacement face, choose or convert the voice, and generate the new video. The implementation connects Gemini image editing, ElevenLabs voice conversion, and Kling motion control, with audio extraction and final assembly. It was a separate experiment in automating content production, not an Oto release or a measured growth result.', steps: ['My recorded performance', 'AI replacement person', 'Voice selection or conversion', 'Motion-controlled video output'] },
  { title: 'The first videos weren’t where I wanted them to be', text: 'My early creative review focused on three things: keeping the characters consistent, making the lighting believable, and giving each clip a clear story. Rather than start from scratch every time, I began writing down what failed and what I would change in the next take.', image: 'assets/reel-earlier-clip.webp', imageAlt: 'Cover of an early AI character video used in Tod’s creative review', imageCaption: 'An early example from my original case study. This is my creative critique, not a controlled before-and-after test.', url: 'https://www.instagram.com/p/DWC1VYzj_VI/', linkLabel: 'Watch the early example' },
  { title: 'Turn each failure into a reusable rule', text: 'I maintain a creative guide with character descriptions, visual rules, prompt formats, and a failure log. Overloaded choreography could produce barely any movement; one rule became “Three beats per clip, four sub-times total.” The current guide also records how to avoid a sticker-like lighting halo, preserve character proportions, and keep the action moving between beats. The guide is a playbook I use alongside the tools, not a claim that every rule is automatically applied.' },
  { title: 'Build the tool around the work', text: 'I built a video interface to choose the model, write a prompt, attach reference media, and set duration, resolution, and aspect ratio together. The screenshot above shows the actual interface. The tool supports production; reviewing the generated result and deciding what works remains part of the creative process.' },
  { title: 'Test the next action, not only the view count', text: 'I used Claude to make an end-of-video CTA pointing people to the bio link. That video recorded 153 bio-link clicks, 187 profile visits, and 18 follows; a different character video recorded 12 bio-link clicks, 979 profile visits, and about 1,900 follows. The comparison made the different goals visible. These were different videos, not an A/B test, and clicks were not confirmed signups.', image: 'assets/cta-instagram-analytics.png', imageAlt: 'Instagram insights showing 153 bio-link clicks, 187 profile visits, and 18 follows for the CTA video', imageCaption: 'The CTA video’s Instagram insights, preserved from the original case study.' },
  { title: 'Make the workflow repeatable each morning', text: 'I extended the production work into daily video draft automation. The repository includes preparation, AI-assisted planning, generation or recutting, caption and CTA assembly, and draft ledgers, with a separate publishing tool. It also includes a daily statistics script for watch time, skips, shares, and other performance signals. Different paths create generated remakes or recuts, so I describe the output as daily drafts rather than claiming every video is an original generation or automatically published. The morning schedule is my current workflow; no time-saving or growth uplift is claimed without measurement.' }
];
aiContentStory.storySections[0].image = 'assets/ai-person-replacer-faces-real.jpg';
aiContentStory.storySections[0].imageAlt = 'Actual AI Video Person Replacer interface showing the replacement face controls';
aiContentStory.storySections[0].imageCaption = 'Actual prototype UI, rendered locally from the original template. Face selection controls shown before any generation; no API call or AI output was produced for this capture.';
aiContentStory.storySections[0].image = null;
aiContentStory.storySections[0].captures = [
  { src: 'assets/ai-person-replacer-real.jpg', title: '1. Upload the original performance', caption: 'The real upload screen. No video is loaded in this capture.' },
  { src: 'assets/ai-person-replacer-faces-real.jpg', title: '2. Choose a replacement person', caption: 'Generate faces or upload references. Controls shown before generation.' },
  { src: 'assets/ai-person-replacer-voice-real.jpg', title: '3. Assign voices and edit audio', caption: 'Voice assignment and audio controls. No faces or audio are loaded in this preview.' },
  { src: 'assets/ai-person-replacer-generate-real.jpg', title: '4. Generate the replacement video', caption: 'Motion-control generation setup. This shows the interface, not a completed result.' }
];
aiContentStory.storySections[0].videoExamples = [
  { id: 'DVr2s8tCRi7', title: 'AI person replacement — example 1', src: 'assets/person-replacer-DVr2s8tCRi7.mp4', url: 'https://www.instagram.com/reel/DVr2s8tCRi7/' },
  { id: 'DVuFfeuktGJ', title: 'AI person replacement — example 2', src: 'assets/person-replacer-DVuFfeuktGJ.mp4', url: 'https://www.instagram.com/reel/DVuFfeuktGJ/' }
];
aiContentStory.dailyOperation.screenshot = null;
Object.assign(aiContentStory.dailyOperation.stages[0], { image: 'assets/fibi-daily-live-real.jpg', imageAlt: 'Fibi Daily populated queue and account filters', imageCaption: 'The real review queue where the routine’s drafts arrive; this is not the routine settings screen.' });
Object.assign(aiContentStory.dailyOperation.stages[1], { image: 'assets/fibi-daily-live-real.jpg', imageAlt: 'Fibi Daily account filters and account-specific draft queue', imageCaption: 'Real account-specific drafts in Fibi Daily, with the Fibi account selected.' });
Object.assign(aiContentStory.storySections.find(section => section.title === 'Build the tool around the work'), { image: 'assets/seedance-studio-real.png', imageAlt: 'The video tool I built with model selection, prompt, references, and output settings', imageCaption: 'Actual video creation interface, shown without account data.' });
aiContentStory.screenshots = [];
Object.assign(aiContentStory.dailyOperation.stages[2], { image: 'assets/fibi-daily-review-real.jpg', imageAlt: 'Fibi Daily caption editing and trim controls', imageCaption: 'Actual draft review controls in the signed-in artifact.' });
Object.assign(aiContentStory.dailyOperation.stages[3], { image: 'assets/fibi-daily-publish-real.jpg', imageAlt: 'Fibi Daily approval and post link tracking controls', imageCaption: 'Approval and post-status tracking. Performance statistics are collected separately.' });
aiContentStory.dailyOperation.captures = [
  { src: 'assets/fibi-daily-live-real.jpg', title: '1. Find the account and draft', caption: 'Actual signed-in Fibi Daily artifact, October 21, 2026. Five account filters and the populated Fibi queue.' },
  { src: 'assets/fibi-daily-review-real.jpg', title: '2. Review the caption and trim', caption: 'Real draft notes, editable caption, download option, and trim controls. No edits were made for the capture.' },
  { src: 'assets/fibi-daily-publish-real.jpg', title: '3. Approve or track the post', caption: 'Actual approval, posted-status, and post-link controls. Nothing was approved or posted during capture.' }
];
// Keep the project focused; the screenshots carry the detailed walkthrough.
aiContentStory.storySections = aiContentStory.storySections.filter(section => !['Turn each failure into a reusable rule', 'Make the workflow repeatable each morning'].includes(section.title));
Object.assign(aiContentStory.storySections[0], {
  title: 'An early experiment: the AI presenter',
  text: 'Could an AI person perform my recorded videos? I built a prototype combining face replacement, voice conversion, and motion control. These are two examples, followed by the four real setup screens.'
});
Object.assign(aiContentStory.storySections.find(section => section.title === 'The first videos weren’t where I wanted them to be'), {
  title: 'Learn from the early videos',
  text: 'The first clips needed more consistent characters, believable lighting, and clearer stories. I kept a failure log and reused the lessons—for example, limiting each clip to three story beats instead of overloading the choreography.',
  imageCaption: 'An early example from my creative review; not a controlled before-and-after comparison.'
});
Object.assign(aiContentStory.storySections.find(section => section.title === 'Build the tool around the work'), {
  title: 'Build a tool for the process',
  text: 'I built an interface for model selection, prompts, references, and output settings, with a creative guide beside it. The tool streamlines setup; I still review the results.'
});
Object.assign(aiContentStory.storySections.find(section => section.title === 'Test the next action, not only the view count'), {
  title: 'A CTA example: 153 bio-link clicks',
  text: 'One CTA video recorded 153 bio-link clicks; a different character video recorded 12. That pushed me to look beyond views. This was not an A/B test, and clicks were not confirmed signups.',
  optional: false
});
const earlyVideoStory = aiContentStory.storySections.find(section => section.title === 'Learn from the early videos');
earlyVideoStory.videoExamples = [{ id: 'DWC1VYzj_VI', title: 'An early character video', src: 'assets/early-character-DWC1VYzj_VI.mp4', url: 'https://www.instagram.com/p/DWC1VYzj_VI/' }];
earlyVideoStory.image = null;
window.PORTFOLIO.chapters.frisson.overallResults = {
  title: 'Content reach and product traction',
  summary: 'From building an audience on @tod_desu to running content across five accounts and contributing to Oto’s product. Social figures show the scope of the content work; app figures describe team traction during my time at Frisson.',
  entries: [
    { value: '≈8.6M', label: 'Views across 355 @tod_desu Reels', detail: 'Surviving Reel history · November 2025–October 2026' },
    { value: '16,058', label: 'Shares across 38 tracked Reels', detail: 'Five accounts · October 20, 2026 snapshot' },
    { value: '16,681', label: '@tod_desu followers', detail: 'Verified on Instagram · October 21, 2026' },
    { value: '8.16K', label: 'iOS first-time downloads', detail: 'October 20, 2025–October 8, 2026' },
    { value: '4,421', label: 'Android active testers', detail: 'Google Play Console · October 2026 snapshot' },
    { value: 'About 15K', label: 'People I brought to Discord', detail: 'Milestone reported September 2026' }
  ],
  note: 'Reel views were reconstructed from 355 unique Instagram grid counts on October 21, 2026. The total is approximate because Instagram rounds counts; deleted content, Stories, and non-Reel views are excluded. Shares cover a separate 38-Reel tracker sample across five accounts. iOS downloads and Android active testers are different measures. These results do not establish an uplift caused by automation or attribute product traction solely to my work.'
};
window.PORTFOLIO.chapters.oto.collection.unshift(aiContentStory);
window.PORTFOLIO.chapters.frisson.sections = window.PORTFOLIO.chapters.frisson.sections.filter(section => section.title !== 'Marketing that makes the companion feel real');

// A visual walkthrough leads the Fibi Daily story; prototype experiments follow it.
Object.assign(aiContentStory.dailyOperation.stages[0], {
  title: 'Five accounts to keep moving',
  detail: 'Automated: a Claude morning routine starts draft preparation.',
  image: 'assets/fibi-daily-five-accounts.svg',
  imageAlt: 'Five account queues feed into one Fibi Daily review workflow',
  imageCaption: 'Workflow diagram · five accounts, one place to review.'
});
Object.assign(aiContentStory.dailyOperation.stages[1], {
  title: 'Drafts arrive in one place',
  detail: 'I built the account filters and draft queue for videos, captions, and CTAs.',
  imageCaption: 'Actual account filters and prepared drafts.'
});
Object.assign(aiContentStory.dailyOperation.stages[2], {
  title: 'I review and edit',
  detail: 'My decision: preview, change the caption, trim, or skip.',
  imageCaption: 'Actual caption and trim controls.'
});
Object.assign(aiContentStory.dailyOperation.stages[3], {
  title: 'I choose what gets posted',
  detail: 'My decision: approve and track the post. Publishing uses a separate tool.',
  imageCaption: 'Actual approval and post-link controls.'
});

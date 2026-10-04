/* Edit portfolio copy here. Public audience counts are dated snapshots.
   Set character.image to a transparent square image, character.frames to 1,
   and remove character.animations
   to change the guide without touching the room art. */
const frissonReels = [
  {
    title: 'A chibi story at the fish market',
    type: 'AI-assisted character story',
    url: 'https://www.instagram.com/reel/DcMS-QNvZgj/',
    result: '25.7K likes',
    note: 'A character moment placed inside an everyday, real-world scene.'
  },
  {
    title: 'A rainy character story',
    type: 'Chibi animation',
    url: 'https://www.instagram.com/reel/DcR2IaJPSZs/',
    result: '19.1K likes',
    note: 'A mood-led animation that gives the companion a small story of its own.'
  },
  {
    title: 'Showing the product myself',
    type: 'On-camera product demo',
    url: 'https://www.instagram.com/reel/DTbhlYYkmyv/',
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
      number: '02', label: 'THE CREATOR CORNER', kicker: 'YOUTUBE · CONTENT & COMMUNITY',
      cover: { image: 'assets/tod-channel-banner.png', alt: 'Todsophon channel artwork with my wordmark, fantasy characters, and one-million-subscriber milestone', caption: 'My channel artwork, created for the 1M subscriber milestone.' },
      title: 'A screen. A story.<br>A place to belong.',
      lead: 'I make videos that bring people together. At Todsophon, storytelling, gaming, and a little mischief have grown into a community of 1.81 million subscribers.',
      meta: [
        { label: 'My role', value: 'Creator · strategy & growth' },
        { label: 'Since', value: 'September 2020' }
      ],
      metrics: [
        { value: '1.81M', label: 'YouTube subscribers' },
        { value: '455.3M', label: 'YouTube channel views' }
      ],
      source: {
        label: 'Todsophon on YouTube', url: 'https://www.youtube.com/@Todsophon',
        note: 'Channel totals and selected video counts recorded September 21, 2026.'
      },
      milestones: [
        { metal: 'silver', value: '100K', title: 'Finding my people', text: 'When COVID sent me back to Thailand, making videos became a way to connect and help others feel less alone. A playful song parody unexpectedly reached millions of viewers overnight. To me, the silver milestone represents the community that began when I let myself be myself.' },
        { metal: 'gold', value: '1M', title: 'Being myself, at scale', text: 'By November 2023, SPU introduced my channel as having more than a million subscribers and over 200 million views. In our conversation, I explained that each new video reinforced the same lesson: being different could help me find the people who enjoyed what I made.' }
      ],
      milestoneSource: { label: 'Read the SPU Voices interview', url: 'https://stories.spu.edu/articles/a-virtual-place-to-belong-with-tod-yansomboon-24', note: 'SPU recounts the journey and reports the 1M+ milestone; it does not give a date for reaching 100K or 1M.' },
      sections: [
        { title: 'Creativity, with a feedback loop', text: 'My work combines content strategy with close attention to click-through rate, retention, and engagement. I use those signals to guide creative decisions, from how a video opens to how its story holds attention.' },
        { title: 'A few stories from the channel', text: 'These selections show two sides of my work: short, character-led gaming stories and a longer food adventure. Each format offers a different way to connect with an audience.' }
      ],
      videos: [
        {
          title: 'Help the Deer Child — Episode 2',
          url: 'https://www.youtube.com/shorts/tM0eptoO9Fo',
          format: 'YouTube Short', metric: '2.6M views',
          description: 'An episode from my Minecraft storytelling series.',
          thumbnail: 'https://i.ytimg.com/vi/tM0eptoO9Fo/hqdefault.jpg'
        },
        {
          title: 'Katthi secretly eats Todsophon’s food',
          url: 'https://www.youtube.com/shorts/isCL43TAtHw',
          format: 'YouTube Short', metric: '1.6M views',
          description: 'A small bit of mischief in the Minecraft world.',
          thumbnail: 'https://i.ytimg.com/vi/isCL43TAtHw/hqdefault.jpg'
        },
        {
          title: 'I Tested 1-Star Fast Food',
          url: 'https://www.youtube.com/watch?v=ceBkGA7Y-1k',
          format: 'Long-form video',
          description: 'Taking the storytelling beyond gaming and out for a meal.',
          thumbnail: 'https://i.ytimg.com/vi/ceBkGA7Y-1k/hqdefault.jpg'
        }
      ],
      tags: ['Content strategy', 'Video storytelling', 'Audience analytics', 'Community'],
      link: { label: 'Visit my YouTube channel', url: 'https://www.youtube.com/@Todsophon' },
      links: [{ label: 'My story in SPU Voices', url: 'https://stories.spu.edu/articles/a-virtual-place-to-belong-with-tod-yansomboon-24' }],
      position: [38, 63]
    },
    tiktok: {
      number: '03', label: 'THE SHORT-FORM STUDIO', kicker: 'TIKTOK · CREATIVE EXPERIMENTS',
      title: 'A little time.<br>A lot to say.',
      lead: 'A short video starts with a reason to keep watching. At Frisson Labs, I create short-form content and use audience signals to shape the next iteration.',
      meta: [
        { label: 'My role', value: 'Social Media Analyst · Frisson Labs' },
        { label: 'Focus', value: 'Hooks, pacing & calls to action' }
      ],
      sections: [
        { title: 'Start with the hook', text: 'I test creative variations, opening hooks, and calls to action. Each version gives me something specific to compare when reviewing how people respond.' },
        { title: 'Give the idea some personality', text: 'I make short-form videos and chibi animations using Seedance, Kling, and CapCut. Animation and editing help turn product ideas into small, expressive stories.' },
        { title: 'Let the audience inform the next cut', text: 'I review TikTok, YouTube, and Instagram analytics, then bring those observations into creative planning. The work connects making content with understanding how it performs on each platform.' }
      ],
      reels: frissonReels,
      reelSource: { note: 'These Reels are Tod’s selections from @tod_desu. Like counts are rounded snapshots observed September 22, 2026; they may change.', label: 'Visit @tod_desu', url: 'https://www.instagram.com/tod_desu/' },
      tags: ['TikTok', 'Short-form video', 'Creative testing', 'Chibi animation'],
      link: { label: 'See the Instagram channel I created', url: 'https://www.instagram.com/tod_desu/' },
      position: [63, 73]
    },
    oto: {
      number: '01', label: 'THE COMPANION LAB', kicker: 'FRISSON LABS · OTO',
      title: 'A little companion.<br>A world of possibility.',
      lead: 'At Frisson Labs, I connect community growth with hands-on product work across Oto’s companion home, mobile apps, games, and Discord experiences.',
      meta: [
        { label: 'My role', value: 'Social Media Analyst' },
        { label: 'Dates', value: 'October 2025–Present' },
        { label: 'Across', value: 'Web, Android, iOS, games & Discord' }
      ],
      metrics: [
        { value: '15K', label: 'people brought to Discord' },
        { value: '10K+', label: 'product downloads' }
      ],
      source: { note: 'Community and download milestones provided by Tod, September 2026. Selected work below reflects contributions within the Frisson Labs team.' },
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
          kind: 'APP', status: 'SHIPPED', title: 'Oto · the companion app',
          image: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/a5/0e/68/a50e6821-157a-5470-aa0b-dc2271a6f496/01-raise.png/314x680bb.webp',
          imageAlt: 'Official Oto App Store screenshot of the companion app',
          text: 'A home for an Otomate: care, conversation, decoration, and games in one experience.',
          contribution: 'My part: room interactions, clearer feedback, Android behavior, and product iteration with the Frisson Labs team.',
          link: { label: 'View the shipped app', url: 'https://apps.apple.com/us/app/oto-ai-voice-companion/id6754143501' }
        },
        {
          kind: 'GAME', status: 'AVAILABLE IN OTO', title: 'Word Guess!',
          image: 'assets/word-guess-card.png', imageAlt: 'Word Guess game art with Fibi and a five-letter puzzle',
          text: 'A daily word puzzle where your Otomate helps sort clues and brings personality to each guess.',
          contribution: 'My part: companion-led game feel, discovery, and interaction polish.'
        },
        {
          kind: 'GAME', status: 'AVAILABLE IN OTO', title: 'Bridge Walk',
          image: 'assets/bridge-walk-card.webp', imageAlt: 'Bridge Walk game art showing Fibi crossing rooftops',
          text: 'A timing game: grow the bridge, cross the gap, and chase a perfect landing.',
          contribution: 'My part: concept, interaction, polish, and measurement.'
        },
        {
          kind: 'AI VIDEO', status: 'PUBLISHED REELS', title: 'Otomates in short-form stories',
          image: 'assets/fibi-happy.webp', imageAlt: 'Fibi smiling',
          text: 'Character-led clips and on-camera product stories made for @tod_desu.',
          contribution: 'My part: concepts, AI-assisted animation, editing, posting, and reading audience response.',
          link: { label: 'Watch a selected Reel', url: 'https://www.instagram.com/reel/DcMS-QNvZgj/' }
        }
      ],
      workSamples: [
        { eyebrow: 'COMPANION PRODUCT', title: 'A home that feels alive', text: 'Worked on Oto Home’s companion behavior and room interactions: visible plans, clearer action feedback, feeding, wardrobe and music controls, and a smoother bridge between conversation and play.', contribution: 'Web experience + Android behavior' },
        { eyebrow: 'GAME DESIGN + DISCOVERY', title: 'Games with a companion in them', text: 'Built and refined game experiences, previews, menus, and discovery flows. Word Guess brings the Otomate into a daily puzzle; Bridge Walk turns a simple timing mechanic into a character-led challenge.', contribution: 'Concept, interaction, polish, and measurement' },
        { eyebrow: 'CROSS-PLATFORM + COMMUNITY', title: 'From app to Discord', text: 'Connected Oto’s mobile and web experiences with the community around them: Android and iOS game and voice flows, a Discord Activity hub, game cards, and player-aware companion moments.', contribution: 'Android, iOS, web, and Discord' }
      ],
      sections: [
        { title: 'What ties the work together', text: 'I use what people watch, play, and share to spot friction and shape the next iteration. That means moving between creative content, product flows, game feel, and analytics instead of treating them as separate jobs.' },
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
      number: '05', label: 'THE PERSON BEHIND THE ROOM', kicker: 'HI, I’M TOD YANSOMBOON',
      title: 'Curious by nature.<br>Creator at heart.',
      lead: 'I turn audience insights into content and product experiences. My work brings together the creativity of a storyteller and the curiosity of an analyst.',
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
      number: '04', label: 'THE ANALYST’S NOTEBOOK', kicker: 'ANALYTICS · SELECTED PROJECTS',
      title: 'Find the signal.<br>Make it useful.',
      lead: 'My analytics projects explore how data can support earlier decisions—from customer health to churn risk.',
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
      number: '06', label: 'EXPERIENCE & EDUCATION', kicker: 'TOD YANSOMBOON · SEATTLE, WA',
      title: 'Tod Yansomboon.',
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

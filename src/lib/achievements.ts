import { Achievement } from '../types';
import { 
  Sparkles, Brain, Palette, Archive, Heart, Bookmark, Compass, Clock, 
  MessageSquare, Zap, BookOpen, Camera, Tv, Utensils, Music, Film, 
  Disc, ShoppingBag, Star, SlidersHorizontal, Layers, Globe, Sun, 
  Moon, Eye, Award, PenTool, Terminal, Cpu, Code, Shield, Activity, 
  Cloud, Bookmark as BookmarkIcon, Feather, Coffee, Ghost, Key, 
  Infinity as InfinityIcon, Compass as CompassIcon, Compass as NavIcon
} from 'lucide-react';

// Original hand-crafted base achievements
const BASE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_spark',
    title: 'First Spark',
    description: 'Save your first item.',
    rarity: 'Common',
    icon: Sparkles,
    xp: 10,
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=600&q=80',
    quote: "The important thing is not to stop questioning. Curiosity has its own reason for existing.",
    author: "Albert Einstein",
    lore: "Even the grandest constellation begins with a single burning particle of ambition."
  },
  {
    id: 'wandering_mind',
    title: 'Wandering Mind',
    description: 'Use Serendipity to explore your thoughts.',
    rarity: 'Common',
    icon: Compass,
    xp: 50,
    image: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80',
    quote: "All that is gold does not glitter, not all those who wander are lost.",
    author: "J.R.R. Tolkien",
    lore: "In the quiet labyrinths of the wandering soul, the most beautiful paths are found."
  },
  {
    id: 'curator',
    title: 'Curator',
    description: 'Favorite at least 5 items.',
    rarity: 'Rare',
    icon: Heart,
    xp: 100,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80',
    quote: "Memory is the diary that we all carry about with us.",
    author: "Oscar Wilde",
    lore: "To preserve a moment is to immortalize a piece of the cosmos."
  },
  {
    id: 'colorful_thinker',
    title: 'Colorful Thinker',
    description: 'Save a color swatch.',
    rarity: 'Rare',
    icon: Palette,
    xp: 100,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80',
    quote: "I found I could say things with color and shapes that I couldn't say any other way.",
    author: "Georgia O'Keeffe",
    lore: "A mind that thinks in hues can paint the void with starlight."
  },
  {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Save 3 articles or links.',
    rarity: 'Rare',
    icon: Bookmark,
    xp: 150,
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80',
    quote: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
    lore: "Gathering fragments of the truth to assemble the ultimate grimoire of reality."
  },
  {
    id: 'chronomancer',
    title: 'Time Weaver',
    description: 'Log memories across 3 distinct calendar days.',
    rarity: 'Rare',
    icon: Clock,
    xp: 200,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    quote: "Yesterday is but today's memory, and tomorrow is today's dream.",
    author: "Kahlil Gibran",
    lore: "To master time is to see the past, present, and future woven as one single tapestry."
  },
  {
    id: 'deep_thinker',
    title: 'Deep Thinker',
    description: 'Let the Local AI analyze 5 items.',
    rarity: 'Epic',
    icon: Brain,
    xp: 300,
    image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=600&q=80',
    quote: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
    lore: "Allowing synthetic sparks to merge with human grace, uncovering hidden geometries."
  },
  {
    id: 'mind_meld',
    title: 'Cosmic Synthesis',
    description: 'Initiate a deep conversation in the Local AI Playground.',
    rarity: 'Epic',
    icon: MessageSquare,
    xp: 350,
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80',
    quote: "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.",
    author: "Carl Sagan",
    lore: "When mind and machine hum in harmony, the secrets of the cosmos lay bare."
  },
  {
    id: 'hoarder',
    title: 'Hoarder',
    description: 'Amass a collection of 20 items.',
    rarity: 'Legendary',
    icon: Archive,
    xp: 500,
    image: 'https://images.unsplash.com/photo-1589782182703-2add672684f2?auto=format&fit=crop&w=600&q=80',
    quote: "An index to the world's ancient wisdom is worth more than all the gold of the dragon.",
    author: "Ancient Proverb",
    lore: "He who holds a thousand scrolls is wealthy beyond measure, for knowledge never decays."
  },
  {
    id: 'transmuter',
    title: 'Grand Alchemist',
    description: 'Customize a magic design template in the Theme Studio.',
    rarity: 'Legendary',
    icon: Zap,
    xp: 600,
    image: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=600&q=80',
    quote: "True alchemy is not the transmuting of lead into gold, but the transformation of the mind.",
    author: "Hermes Trismegistus",
    lore: "By altering the canvas, you change the reflection; your perspective is your magic wand."
  }
];

// Helper structures to generate 100 unique creative achievements
const THEMES = [
  {
    name: 'Cosmic Cartography',
    icon: Globe,
    rarity: 'Common' as const,
    xp: 30,
    titles: [
      'Nebula Mapper', 'Orion Pathfinder', 'Solitude Voyager', 'Lunar Cartographer',
      'Solar Wind Rider', 'Stellar Historian', 'Galactic Registrar', 'Astroplane Weaver',
      'Andromeda Witness', 'Supernova Scribe'
    ],
    descriptions: [
      'Add 2 map locations or geographic nodes.',
      'Log 3 thoughts during a full moon.',
      'Explore 5 serendipitous recommendations.',
      'Organize 4 starry notes with navy accents.',
      'View memory charts on a desktop layout.',
      'Search your memory palace twice in 10 minutes.',
      'Favorite a celestial quote item.',
      'Add a voice note describing the nighttime sky.',
      'Verify a long-term goal node.',
      'Connect 3 cosmic tags to your favorite items.'
    ],
    quotes: [
      "We are all in the gutter, but some of us are looking at the stars.",
      "The sky is the ultimate art gallery, open for all to gaze.",
      "Across the sea of space, the stars are other suns.",
      "I know nothing with any certainty, but the sight of the stars makes me dream.",
      "Silence is the sleep that nourishes wisdom.",
      "The eternal silence of these infinite spaces terrifies me.",
      "In space, all boundaries fade into a single elegant canvas.",
      "Be humble, for you are made of earth. Be noble, for you are made of stars.",
      "To look up is to look back in time.",
      "The starry heavens above me and the moral law within me."
    ],
    authors: [
      "Oscar Wilde", "John Ruskin", "Carl Sagan", "Vincent van Gogh",
      "Francis Bacon", "Blaise Pascal", "Yuri Gagarin", "Serbian Proverb",
      "Stephen Hawking", "Immanuel Kant"
    ],
    lores: [
      "Charting the stardust trails of memory across the deep black ocean of thought.",
      "A quiet surveyor tracing the outlines of distant nebulas in their own mind.",
      "Sometimes, to understand yourself, you must look at the universe from a distance.",
      "Capturing moonlight reflection in a database cell.",
      "Sailing through solar storms with a pen and a digital diary.",
      "Keeping track of every shooting star that crosses your consciousness.",
      "A diary entry is a frozen star in your personal sky.",
      "Hearing the echoes of cosmic microwave background in your voice memories.",
      "Drawing constellations on a blank, unwritten page.",
      "The universe is not outside you. Look inside, everything that you want, you already are."
    ]
  },
  {
    name: 'Temporal Weaver',
    icon: Clock,
    rarity: 'Rare' as const,
    xp: 80,
    titles: [
      'Hourglass Warden', 'Midnight Scribe', 'Dawn Seeker', 'Equinox Dreamer',
      'Chrono Sentinel', 'Epoch Keeper', 'Solstice Architect', 'Temporal Anchor',
      'Kairos Pioneer', 'Aeon Watcher'
    ],
    descriptions: [
      'Write a note at exactly 12:00 AM midnight.',
      'Create 5 memories in the early morning hours.',
      'Log memories over 7 consecutive days.',
      'Log memories under the sunset orange vibe.',
      'Examine the oldest memory in your digital vault.',
      'Re-organize items by chronological order.',
      'Pin a critical time-sensitive note to the Top of Mind.',
      'Log a moment of peace during a solar noon.',
      'Bookmark 3 articles on the philosophy of time.',
      'Keep your thoughts spinning over multiple seasons.'
    ],
    quotes: [
      "Time is a created thing. To say 'I don't have time', is to say 'I don't want to'.",
      "The two most powerful warriors are patience and time.",
      "Time you enjoy wasting is not wasted time.",
      "Time is a storm in which we are all lost.",
      "Never leave that till tomorrow which you can do today.",
      "Lost time is never found again.",
      "Time is what we want most, but what we use worst.",
      "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
      "Time is the longest distance between two places.",
      "What then is time? If no one asks me, I know what it is."
    ],
    authors: [
      "Lao Tzu", "Leo Tolstoy", "Marthe Troly-Curtin", "William Carlos Williams",
      "Benjamin Franklin", "Benjamin Franklin", "William Penn", "Thich Nhat Hanh",
      "Tennessee Williams", "Saint Augustine"
    ],
    lores: [
      "Holding the sands of time gently within your mind.",
      "Whispering to the shadows at the turn of midnight.",
      "Catching the first golden rays of thought at dawn.",
      "Balancing day and night, light and shadow perfectly in your workspace.",
      "Watching the slow, beautiful decay of seconds into history.",
      "A continuous chain of daily reflections forms a beautiful mental lifeline.",
      "Fixing a fleeting moment in the amber of eternity.",
      "Slowing down the rushing torrent of daily activities into a calm stream.",
      "Pondering the infinite expanse of tomorrow and the fixed stone of yesterday.",
      "Standing guard at the gates of your own personal epoch."
    ]
  },
  {
    name: 'Zen Archivist',
    icon: Archive,
    rarity: 'Common' as const,
    xp: 40,
    titles: [
      'Mindfulness Scribe', 'Inner Sanctuary Guard', 'Whispering Scroll', 'Calm Curator',
      'Silent Cataloger', 'Essence Preserver', 'Stillness Weaver', 'Minimalist Sentry',
      'Monastery Clerk', 'Void Guardian'
    ],
    descriptions: [
      'Log 10 items without adding any complex tags.',
      'Maintain an empty search bar for absolute clarity.',
      'Favorite a note containing the word "zen" or "peace".',
      'Archive 3 completed item cards.',
      'Examine your thoughts with an elegant white color theme.',
      'Log a quiet thought with 5 words or less.',
      'Create 3 checklist tasks and check them all off.',
      'Delete an obsolete memory with gratitude.',
      'Spend 2 minutes in silent contemplation in the Workspace.',
      'Group 3 unrelated thoughts into a single tag.'
    ],
    quotes: [
      "Simplicity is the ultimate sophistication.",
      "Zen is not effortless effort, it is an effort without effort.",
      "Do not seek to follow in the footsteps of the wise. Seek what they sought.",
      "In the mind of the beginner there are many possibilities, but in the expert's mind there are few.",
      "Quiet the mind, and the soul will speak.",
      "The search for happiness is one of the chief sources of unhappiness.",
      "Let go or be dragged.",
      "Minimalism is not lack of something. It's simply the perfect amount of something.",
      "He who is contented is rich.",
      "To the mind that is still, the whole universe surrenders."
    ],
    authors: [
      "Leonardo da Vinci", "Zen Saying", "Basho", "Shunryu Suzuki",
      "Ma Jaya Sati Bhagavati", "Eric Hoffer", "Zen Proverb", "Nicholas Burroughs",
      "Lao Tzu", "Lao Tzu"
    ],
    lores: [
      "Stripping away the noise of the world to expose the pure essence of thought.",
      "Cultivating an inner space of quiet stillness and elegant simplicity.",
      "Keeping your files as clean as an uncarved block of cedar.",
      "Filing away memories with the gentle touch of falling autumn leaves.",
      "Letting go of useless thoughts to make space for fresh realizations.",
      "Knowing that a single word can sometimes hold a lifetime of wisdom.",
      "The satisfaction of bringing chaos into crisp, neat, completed lists.",
      "Purging stale concepts to keep your memory garden breathing and light.",
      "The quiet interface is a direct mirror of a still and happy mind.",
      "Finding the deep, hidden connections between the sky and the stone."
    ]
  },
  {
    name: 'Silicon Sage',
    icon: Cpu,
    rarity: 'Epic' as const,
    xp: 120,
    titles: [
      'Turing Disciple', 'Neural Weaver', 'Prompt Alchemist', 'Vector Oracle',
      'Quantum Chronicler', 'Algorithmic Monk', 'Deep Core Scribe', 'Binary Shaman',
      'Cognitive Weaver', 'Synthesized Scholar'
    ],
    descriptions: [
      'Let the alternative free cloud AI analyze 3 new items.',
      'Prompt the AI to tag an image.',
      'Generate a deep conceptual analysis of your bookmarks.',
      'Let the AI classify a note as a recipe.',
      'Have 10 items fully summarized by AI.',
      'Toggle local AI on and off to compare processing times.',
      'Generate a custom tags list using the AI backend.',
      'Ask the AI to create a haiku from your thoughts.',
      'Use the Local AI with WebGPU enabled.',
      'Run a semantic classification on an imported tweet.'
    ],
    quotes: [
      "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
      "The analytical engine weaves algebraic patterns just as the Jacquard loom weaves flowers.",
      "Artificial intelligence is growing up fast, but human wisdom is its only guiding compass.",
      "Computers are useless. They can only give you answers.",
      "Any sufficiently advanced technology is indistinguishable from magic.",
      "The real danger is not that computers will begin to think like men, but that men will begin to think like computers.",
      "The digital mind is a mirror of human curiosity, forged in silicon.",
      "A computer once beat me at chess, but it was no match for me at kick boxing.",
      "Machines take me by surprise with great frequency.",
      "What we want is a machine that can learn from experience."
    ],
    authors: [
      "Alan Turing", "Ada Lovelace", "E.O. Wilson", "Pablo Picasso",
      "Arthur C. Clarke", "Sydney J. Harris", "Silicon Valley Saying", "Emo Philips",
      "Alan Turing", "Alan Turing"
    ],
    lores: [
      "Merging standard logic with the wild, beautiful imagination of a cybernetic sage.",
      "Weaving digital lattices of knowledge through deep neural connections.",
      "Crafting precise verbal incantations to invoke answers from the silicon void.",
      "Translating your human feelings into dense multidimensional vectors.",
      "Documenting your memories in superpositions of logic and light.",
      "Observing the hum of local computations with a sense of quiet wonder.",
      "Tapping into the collective digital unconsciousness of the web.",
      "Synthesizing short, poetic verses from the metadata of your daily routine.",
      "Riding the high-voltage currents of modern on-device graphic processors.",
      "Harvesting social stream snippets and placing them into silent contemplation."
    ]
  },
  {
    name: 'Chroma Muse',
    icon: Palette,
    rarity: 'Rare' as const,
    xp: 90,
    titles: [
      'Prism Weaver', 'Spectrum Sentinel', 'Monochrome Mystic', 'Holographic Scribe',
      'Emerald Seeker', 'Obsidian Curator', 'Rose Garden Guard', 'Alabaster Archivist',
      'Saffron Chronicler', 'Indigo Dreamer'
    ],
    descriptions: [
      'Save 3 items with a dominant color of green.',
      'Filter your workspace by the color black.',
      'Favorite a beautiful pink or rose item.',
      'Log 5 white or silver colored items.',
      'Log 4 items with a deep, royal purple color tag.',
      'Group memories under the soothing blue vibe filter.',
      'Have a dominant color of orange on at least 3 cards.',
      'Log an item containing 3 separate custom color swatches.',
      'Save a bright yellow item representing sunshine.',
      'Build a cohesive 3-color moodboard using color tags.'
    ],
    quotes: [
      "Color is a power which directly influences the soul.",
      "Mere color, unspoiled by meaning, and unallied with definite form, can speak to the soul in a thousand ways.",
      "I found I could say things with color and shapes that I couldn't say any other way.",
      "Colors, like features, follow the changes of the emotions.",
      "Color is the keyboard, the eyes are the harmonies, the soul is the piano with many strings.",
      "There is a shade of red for every woman.",
      "The soul becomes dyed with the color of its thoughts.",
      "Green is the prime color of the world, and that from which its loveliness arises.",
      "In the beginning was the color. Black and white came later.",
      "I prefer living in color."
    ],
    authors: [
      "Wassily Kandinsky", "Oscar Wilde", "Georgia O'Keeffe", "Pablo Picasso",
      "Wassily Kandinsky", "Audrey Hepburn", "Marcus Aurelius", "Pedro Calderon de la Barca",
      "Modern Painter", "David Hockney"
    ],
    lores: [
      "Letting the vibrant, silent frequency of light paint your mental interior.",
      "Sinking into the comforting, elegant depth of complete darkness.",
      "Infusing your archive with the warm, delicate vibration of love and care.",
      "Gazing at the pure, unblemished slate of clean white simplicity.",
      "Draping your thoughts in the majestic, deep velvet robes of mystery.",
      "Resting your weary mind in the cool, silent depths of an ocean of blue thoughts.",
      "Sparking high energy and bright creativity with intense orange nodes.",
      "Creating beautiful multi-hued keys to decode your emotional spectrum.",
      "Letting warm, cheerful sunlight illuminate the dark corners of memory.",
      "Composing a visual symphony of shades that speak louder than words."
    ]
  },
  {
    name: 'Literary Wanderer',
    icon: BookOpen,
    rarity: 'Common' as const,
    xp: 50,
    titles: [
      'Folio Guardian', 'Paragraph Nomad', 'Inkstone Scholar', 'Scribe of Alexandria',
      'Lyrical Pilgrim', 'Epic Poetic', 'Syllable Seeker', 'Prose Wanderer',
      'Gutenberg Apprentice', 'Archival Hermit'
    ],
    descriptions: [
      'Save 3 long text notes with Serif typography.',
      'Bookmark 5 essays or articles in one day.',
      'Scrape an article of over 2000 words.',
      'Log a quote by an ancient Roman philosopher.',
      'Write a note with a custom font size of XL.',
      'Bookmark a poetry collection or classic text.',
      'Read 3 bookmarked articles on your tablet or screen.',
      'Log a quote that contains the word "infinite".',
      'Add a note styled entirely in italic script.',
      'Extract main concepts of a scraped article via AI.'
    ],
    quotes: [
      "A room without books is like a body without a soul.",
      "Reading is to the mind what exercise is to the body.",
      "There is no frigate like a book to take us lands away.",
      "The reading of all good books is like a conversation with the finest minds of past centuries.",
      "Books are a uniquely portable magic.",
      "Ink and paper are the vehicles through which minds touch across millenniums.",
      "To write is to carve your soul into the stone of history.",
      "We live in the description of a place and not in the place itself.",
      "A great book should leave you with many experiences, and slightly exhausted at the end.",
      "I have always imagined that Paradise will be a kind of library."
    ],
    authors: [
      "Cicero", "Joseph Addison", "Emily Dickinson", "René Descartes",
      "Stephen King", "Ancient Proverb", "Anonymous", "Wallace Stevens",
      "William Styron", "Jorge Luis Borges"
    ],
    lores: [
      "Holding the beautiful weight of written volumes in your quiet mind.",
      "Collecting digital leaves of knowledge from the forest of the web.",
      "Diving into deep rivers of words, swimming towards the source of truth.",
      "Sipping tea with the ancient dead, listening to their silent advice.",
      "Making your thoughts bold and large, shouting gently into the archive.",
      "Gathering lines of verse to soothe the rough edges of daily routine.",
      "Turning your display into a glowing scroll of endless wisdom.",
      "Contemplating the vast, ungraspable boundaries of the endless universe.",
      "Letting your letters lean forward, rushing with intense focus.",
      "Enlisting silicon assistants to highlight the golden needles in paper haystacks."
    ]
  },
  {
    name: 'Acoustic Whisperer',
    icon: Music,
    rarity: 'Rare' as const,
    xp: 75,
    titles: [
      'Melody Weaver', 'Sonic Sentinel', 'Voice Archivist', 'Harmonic Explorer',
      'Ambient Scribe', 'Rhythm Keeper', 'Echo Tracker', 'Lullaby Guard',
      'Timbre Curator', 'Symphony Sovereign'
    ],
    descriptions: [
      'Record your first voice memory note.',
      'Save a song link from Spotify or YouTube Music.',
      'Log a quote about the power of silence or music.',
      'Archive an album review note.',
      'Log 3 songs that share the same warm mood tag.',
      'Record a voice note of exactly 30 seconds.',
      'Organize a custom playlist of 5 music nodes.',
      'Scrape an article about acoustic theory or music.',
      'Favorite a music card with a blue dominant color.',
      'Listen to your own recorded thoughts in the inspector.'
    ],
    quotes: [
      "Music is the shorthand of emotion.",
      "Where words fail, music speaks.",
      "Without music, life would be a mistake.",
      "The only truth is music.",
      "Music can change the world because it can change people.",
      "Silence is the fabric upon which notes are woven.",
      "Your voice is the acoustic imprint of your unique soul.",
      "Rhythm is the heartbeat of existence.",
      "A song is a short, beautiful journey through a warm emotional landscape.",
      "The music of the spheres hums quietly inside your own chest."
    ],
    authors: [
      "Leo Tolstoy", "Hans Christian Andersen", "Friedrich Nietzsche", "Jack Kerouac",
      "Bono", "Zen Master", "Acoustic Scientist", "Ancient Proverb",
      "Aesthetic Composer", "Pythagoras"
    ],
    lores: [
      "Catching the subtle, invisible vibrations of emotion in digital waveforms.",
      "Storing links to the soundtracks that accompanied your deepest realizations.",
      "Resting in the beautiful pause between the notes of your busy life.",
      "Filing away the critiques of human expressions for future review.",
      "Painting your workspace in the rich, deep colors of minor chords.",
      "A precise half-minute slice of pure, unedited human contemplation.",
      "Creating a customized library of sounds that trigger instant focus.",
      "Studying how sound moves through space and time.",
      "An ocean-blue card holding a melody that calms a rushing mind.",
      "Playing back your own past thoughts, hearing how much you have grown."
    ]
  },
  {
    name: 'Celluloid Dreamer',
    icon: Film,
    rarity: 'Rare' as const,
    xp: 70,
    titles: [
      'Kinetoscope Keeper', 'Frame Archivist', 'Noir Detective', 'Montage Weaver',
      'Cinephile Pilgrim', 'Silver Screen Sentry', 'Director of Thoughts', 'Scene Registrar',
      'Technicolor Mystic', 'Auteur Chronicler'
    ],
    descriptions: [
      'Save 3 movie or documentary review notes.',
      'Log a movie poster or visual movie bookmark.',
      'Favorite a quote from a classic film.',
      'Save 2 items with the movie category.',
      'Add a video link from Vimeo or YouTube.',
      'Group 3 film notes under a single genre tag.',
      'Log a film memory with a dark gray noir vibe.',
      'Scrape a critique of an independent film.',
      'Mark a movie as "watched" in your checklist.',
      'Keep track of your favorite film directors.'
    ],
    quotes: [
      "Cinema is a matter of what's in the frame and what's out.",
      "A film is a petrified dream that you can play back at will.",
      "Cinema is a mirror that can show us our own hidden faces.",
      "To make a great film, you need three things: a great script, a great script, and a great script.",
      "Photography is truth. Cinema is truth twenty-four times a second.",
      "The screen is a magical window into a thousand alternative lives.",
      "Every great scene is a battle between light and shadow.",
      "Cinema is the most beautiful fraud in the world.",
      "Film is like a battleground: love, hate, action, violence, death.",
      "An auteur is someone who writes their signature in light."
    ],
    authors: [
      "Martin Scorsese", "Jean Cocteau", "Ingmar Bergman", "Alfred Hitchcock",
      "Jean-Luc Godard", "Anonymous", "Cinematographer Proverb", "Jean-Luc Godard",
      "Samuel Fuller", "Andrew Sarris"
    ],
    lores: [
      "Slicing up time and space to capture the pure motion of human drama.",
      "Preserving the iconic visual posters of worlds you have visited.",
      "Repeating lines of dialogue that echo through your own life.",
      "Building a theater of classic masterpieces inside your database.",
      "Embedding windows of motion and light into your silent notes.",
      "Connecting stories of love, courage, and sorrow across different tags.",
      "Gazing at the high-contrast aesthetic of a classic monochrome world.",
      "Reading between the frames of obscure, beautiful artistic statements.",
      "Checking off film reel memories like a satisfied digital projectionist.",
      "Listing the master craftsmen who taught you how to see."
    ]
  },
  {
    name: 'Midnight Mystic',
    icon: Moon,
    rarity: 'Legendary' as const,
    xp: 150,
    titles: [
      'Nocturnal Sentry', 'Eclipse Witness', 'Labyrinth Walker', 'Shadow Scholar',
      'Midnight Alchemist', 'Dreamweaver', 'Somnambulist', 'Phantasm Curator',
      'Obsidian Quill', 'Eternal Starlight Guard'
    ],
    descriptions: [
      'Write 3 thoughts between 2:00 AM and 4:00 AM.',
      'Log a dream description in a highly styled note.',
      'Log an obsidian-black memory card.',
      'Use the dark mode theme for 3 consecutive days.',
      'Scrape an article about night sky phenomena.',
      'Add a quote about shadows or the quiet of the night.',
      'Save a purple card under the tag "mystic".',
      'Favorite a quote by Friedrich Nietzsche.',
      'Log 5 thoughts in complete silence with no background audio.',
      'Anchor a dream memory to your Top of Mind focus pin.'
    ],
    quotes: [
      "I love the dark. It is where the stars are born, and where secrets sleep.",
      "He who fights with monsters should look to it that he himself does not become a monster.",
      "What is done out of love always takes place beyond good and evil.",
      "There is a crack in everything, that's how the light gets in.",
      "The dream is the small hidden door in the deepest and most intimate sanctum of the soul.",
      "The night is more alive and more richly colored than the day.",
      "Shadows are just reminders that light is shining somewhere nearby.",
      "I have loved the stars too fondly to be fearful of the night.",
      "In the middle of the night, when the world is asleep, the mind speaks in a whisper.",
      "We are such stuff as dreams are made on, and our little life is rounded with a sleep."
    ],
    authors: [
      "Nocturnal Proverb", "Friedrich Nietzsche", "Friedrich Nietzsche", "Leonard Cohen",
      "Carl Jung", "Vincent van Gogh", "Ruth E. Renkel", "Sarah Williams",
      "Scribe of Shadows", "William Shakespeare"
    ],
    lores: [
      "Guarding the silent temple of thought when the rest of the world has closed its eyes.",
      "Translating the chaotic, gorgeous theater of your sleeping mind into text.",
      "Wearing the comforting, absolute quiet of dark obsidian stones.",
      "Plunging your digital workplace into a state of beautiful, eye-safe twilight.",
      "Studying the dance of binary code and meteors across the cold cosmos.",
      "Recognizing that shadows are essential to give form and depth to the light.",
      "Draping a violet veil over your deepest, most sacred intuitive moments.",
      "Staring into the brilliant, terrifying abyss of your own potential.",
      "Stripping away all sound to hear the absolute core frequency of your soul.",
      "Holding fast to the fragile dream-keys before they evaporate into morning mist."
    ]
  },
  {
    name: 'Architect of Thought',
    icon: Layers,
    rarity: 'Legendary' as const,
    xp: 200,
    titles: [
      'Grand Weaver', 'Cognitive Builder', 'Workspace Sovereign', 'Mind Palace Mason',
      'Systematic Sage', 'Metadata King', 'Tag Master', 'Synthesis General',
      'Infinite Scholar', 'Grand Archivist'
    ],
    descriptions: [
      'Have at least 50 total items in your workspace.',
      'Create 15 distinct tags across your entire archive.',
      'Toggle view layouts between grid, list, and kanban 10 times.',
      'Maintain 10 items pinned to your Top of Mind.',
      'Group items into 5 distinct categorizations.',
      'Search for "architecture" or "system" in your search bar.',
      'Favorite 15 items to build a pristine collection.',
      'Style 5 notes with custom background colors and serif fonts.',
      'Import 5 articles and let the AI extract complex tags for all.',
      'Check off 20 total check-items across your checklists.'
    ],
    quotes: [
      "Order and simplification are the first steps toward the mastery of a subject.",
      "He who can no longer pause to wonder and stand rapt in awe, is as good as dead.",
      "The structure of a system is a physical manifestation of the architect's mind.",
      "We build our workspaces, and then our workspaces build us.",
      "Knowledge is a magnificent palace, but its doors are opened only by order.",
      "The mind is a superb instrument if used rightly. Used wrongly, however, it becomes very destructive.",
      "To organize is to give life to a pile of stones.",
      "A place for everything, and everything in its place.",
      "The quiet systematic order of an archive is a cathedral of the human intellect.",
      "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
    ],
    authors: [
      "Thomas Mann", "Albert Einstein", "Systems Engineer Proverb", "Architectural Saying",
      "Socrates", "Eckhart Tolle", "Aesthetic Curator", "Samuel Smiles",
      "Librarian's Creed", "Aristotle"
    ],
    lores: [
      "Weaving a massive, beautiful tapestry of human experience, logic, and art.",
      "Filing thoughts away into a perfectly organized mind palace of your own design.",
      "Changing the camera angle of your mind to see the same world in entirely new ways.",
      "Constructing a high-focus zone for your most critical current challenges.",
      "Dividing the infinite stream of consciousness into clean, manageable channels.",
      "Searching for the core structural rules that govern the universe.",
      "A magnificent, hand-selected vault of your absolute highest intellectual peaks.",
      "Dressing up your thoughts in beautiful visual gowns of rich paper and ink.",
      "Unleashing advanced cybernetic tools to index and connect huge volumes of data.",
      "Constructing beautiful ladders of daily tasks and climbing them step-by-step."
    ]
  }
];

// Compile all achievements
export const ACHIEVEMENTS: Achievement[] = (() => {
  const list: Achievement[] = [...BASE_ACHIEVEMENTS];
  
  const baseImages = [
    '/assets/images/first_spark_art_1782894430119.jpg',
    '/assets/images/wandering_mind_art_1782894717720.jpg',
    '/assets/images/curator_art_1782894792146.jpg',
    '/assets/images/colorful_thinker_art_1782894805753.jpg',
    '/assets/images/knowledge_seeker_art_1782894817660.jpg',
    '/assets/images/time_weaver_art_1782895575062.jpg',
    '/assets/images/deep_thinker_art_1782894457729.jpg',
    '/assets/images/cosmic_synthesis_art_1782895593620.jpg',
    '/assets/images/hoarder_art_1782894471697.jpg',
    '/assets/images/grand_alchemist_art_1782895609598.jpg'
  ];

  // Generate 100 achievements (10 themes * 10 items)
  THEMES.forEach((theme, themeIdx) => {
    for (let i = 0; i < 10; i++) {
      const id = `generated_${themeIdx}_${i}`;
      const title = theme.titles[i];
      const description = theme.descriptions[i];
      const quote = theme.quotes[i];
      const author = theme.authors[i];
      const lore = theme.lores[i];
      
      const imageUrl = baseImages[(themeIdx + i) % baseImages.length];
      
      list.push({
        id,
        title,
        description,
        rarity: theme.rarity,
        icon: theme.icon,
        xp: theme.xp,
        image: imageUrl,
        quote,
        author,
        lore
      });
    }
  });
  
  return list;
})();

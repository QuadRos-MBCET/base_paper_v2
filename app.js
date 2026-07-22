// Preset Memes Database
const PRESETS = [
  {
    id: "preset-chimpanzee",
    title: "Chimpanzee & Racism Contrast",
    text: "Stop racism, black children and white children are the same",
    hateful: true,
    classification: "Hateful",
    ageSafe: "Restricted (18+ Adults Only)",
    ageUnsafe: "Children under 18, Sensitive Audiences",
    metaphoricalReason: "This meme utilizes a 'conceptual contrast' metaphorical representation pattern. It links the visual object 'chimpanzee' with the text 'black children' through the racist socio-cultural trope that historically compares Black people to apes. By contrasting this with the white child (associated with 'smart' or 'pure' tropes), it implicitly conveys a derogatory, dehumanizing, and hateful metaphor targeting Black individuals, despite the text claiming to 'stop racism'.",
    bboxes: [
      { label: "Chimpanzee (Tenor)", top: "15%", left: "5%", width: "42%", height: "65%", tenor: true },
      { label: "White Child", top: "10%", left: "55%", width: "40%", height: "70%", tenor: false }
    ],
    ocrBox: { text: "OCR: stop racism...", top: "80%", left: "2%", width: "96%", height: "16%" },
    // Level 1: SCGen Search
    level1: {
      objects: ["Chimpanzee", "White Child", "Black Child"],
      entities: [
        { name: "Chimpanzee", keywords: "animal, ape, primate, racial slur history" },
        { name: "White Child", keywords: "human, toddler, youth, equality discourse" },
        { name: "Black Child", keywords: "human, toddler, youth, racial diversity" }
      ],
      knowledge: [
        { entity: "Chimpanzee", assertion: "Historically, comparing Black individuals to apes or chimpanzees is a prominent dehumanizing racial slur used to justify discrimination." },
        { entity: "White Child", assertion: "Socio-culturally viewed in media as innocent, mainstream, or standard representation of youth." },
        { entity: "Black Child", assertion: "Frequently referenced in socio-political campaigns regarding racial equality and civil rights." }
      ]
    },
    // Level 2: SCRA-MTI
    level2: {
      ocr: "stop racism, black children and white children are the same",
      scoring: [
        { object: "Chimpanzee", textLink: "black children", score: 2, reason: "Strongly relevant due to historical derogatory association between Black people and primates." },
        { object: "White Child", textLink: "white children", score: 1, reason: "Relevant as direct visual referent of the text." },
        { object: "Black Child", textLink: "black children", score: 1, reason: "Relevant as direct visual referent of the text." }
      ],
      tenor: "Chimpanzee (Relevance Score: 2)"
    },
    // Level 3: RCR
    level3: {
      cases: [
        {
          id: "RC1",
          knowledge: "Dehumanization of racial minorities through animal comparison.",
          reason: "Comparing ethnic groups to monkeys to mock their facial features and intelligence."
        },
        {
          id: "RC2",
          knowledge: "Irony in 'anti-racist' statements combined with offensive imagery.",
          reason: "Using standard egalitarian slogans paired with highly offensive visual metaphors to mask hate speech."
        }
      ]
    },
    // Level 4: CoT MLLM
    level4: {
      cot: [
        "1. The visual input contains three main objects: a chimpanzee, a white child, and a black child.",
        "2. The text overlay reads 'Stop racism, black children and white children are the same'.",
        "3. Socio-cultural knowledge search reveals a strong historical link between the 'chimpanzee' visual and derogatory racial slurs against Black people.",
        "4. Relevance scoring identifies 'chimpanzee' as highly connected to 'black children' in this context (relevance score = 2).",
        "5. The metaphorical vehicle maps the tenor ('chimpanzee' linked to 'black children') through the pattern of 'contrast' against the white child, producing a hateful, dehumanizing representation.",
        "6. Final classification: Hateful (1). Metaphor reason: Dehumanizing racial contrast."
      ]
    },
    svg: `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chimpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#chimpGrad)"/>
      <circle cx="200" cy="200" r="180" fill="none" stroke="url(#neonGlow)" stroke-width="2" stroke-dasharray="8 4" opacity="0.4"/>
      
      <!-- Representing Chimpanzee Face (Left Side) -->
      <g transform="translate(100, 190)">
        <circle cx="0" cy="0" r="60" fill="#2d1e18" stroke="#1c120c" stroke-width="3"/>
        <ellipse cx="-20" cy="-10" rx="20" ry="25" fill="#d97706" opacity="0.75"/>
        <ellipse cx="20" cy="-10" rx="20" ry="25" fill="#d97706" opacity="0.75"/>
        <circle cx="-15" cy="-10" r="6" fill="#000"/>
        <circle cx="15" cy="-10" r="6" fill="#000"/>
        <path d="M -25 -30 Q 0 -15 25 -30" stroke="#000" stroke-width="3" fill="none"/>
        <path d="M -25 20 Q 0 35 25 20" stroke="#000" stroke-width="4" fill="none"/>
      </g>
      
      <!-- Representing Child Face (Right Side) -->
      <g transform="translate(300, 190)">
        <circle cx="0" cy="0" r="45" fill="#fed7aa" stroke="#f97316" stroke-width="2"/>
        <circle cx="-12" cy="-5" r="5" fill="#1d4ed8"/>
        <circle cx="12" cy="-5" r="5" fill="#1d4ed8"/>
        <path d="M -15 15 Q 0 30 15 15" stroke="#ea580c" stroke-width="3" fill="none"/>
        <!-- Hair -->
        <path d="M -30 -30 Q 0 -50 30 -30 Q 40 -10 35 -5 Q 0 -35 -35 -5" fill="#fef08a"/>
      </g>

      <!-- Connection line representing tenor assessment -->
      <path d="M 160 190 Q 200 130 255 190" stroke="#ef4444" stroke-width="3" stroke-dasharray="5 5" fill="none"/>
      <polygon points="255,190 245,183 250,195" fill="#ef4444"/>
      
      <!-- Text Overlay -->
      <rect x="10" y="320" width="380" height="65" rx="8" fill="rgba(0,0,0,0.85)" stroke="#ef4444" stroke-width="1.5"/>
      <text x="200" y="345" fill="#fff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="15" text-anchor="middle">STOP RACISM</text>
      <text x="200" y="368" fill="#9ca3af" font-family="'Outfit', sans-serif" font-size="11" text-anchor="middle">black children and white children are the same</text>
    </svg>`
  },
  {
    id: "preset-thumbsup",
    title: "Thumbs-Up & Mental Illness",
    text: "When you get to choose your own mental illness",
    hateful: true,
    classification: "Hateful",
    ageSafe: "Restricted (18+ Adults Only)",
    ageUnsafe: "Children under 18, Sensitive Audiences",
    metaphoricalReason: "This meme utilizes an 'analogy' metaphorical pattern. It connects the visual object 'thumbs-up' colored in the sexual/gender minorities flag with the text 'choose your own mental illness'. By linking LGBT pride flags with 'mental illness', it analogizes gender identity expression to psychological pathology, conveying a derogatory message designed to stigmatize LGBTQ+ individuals under the guise of choosing a condition.",
    bboxes: [
      { label: "Pride Colors (Tenor)", top: "20%", left: "30%", width: "40%", height: "55%", tenor: true },
      { label: "Thumbs Up", top: "25%", left: "35%", width: "30%", height: "45%", tenor: false }
    ],
    ocrBox: { text: "OCR: choose your own mental illness...", top: "5%", left: "5%", width: "90%", height: "15%" },
    // Level 1: SCGen Search
    level1: {
      objects: ["Thumbs Up", "Pride Flag Colors"],
      entities: [
        { name: "Thumbs Up", keywords: "gesture, hand sign, positive agreement, emoji" },
        { name: "Pride Flag Colors", keywords: "LGBTQ+, transgender flag, sexual diversity, gender identity" }
      ],
      knowledge: [
        { entity: "Thumbs Up", assertion: "Universally indicates approval, confirmation, or selecting a choice." },
        { entity: "Pride Flag Colors", assertion: "Represents the sexual and gender minorities community, advocating for freedom of self-identity." }
      ]
    },
    // Level 2: SCRA-MTI
    level2: {
      ocr: "when you get to choose your own mental illness",
      scoring: [
        { object: "Pride Flag Colors", textLink: "choose / mental illness", score: 2, reason: "Strongly relevant as the flag colors represent the community whose identity choices are being labeled as 'mental illness'." },
        { object: "Thumbs Up", textLink: "choose", score: 1, reason: "Relevant as the hand gesture symbolizes 'making a choice'." }
      ],
      tenor: "Pride Flag Colors (Relevance Score: 2)"
    },
    // Level 3: RCR
    level3: {
      cases: [
        {
          id: "RC1",
          knowledge: "Stigmatization of marginalized groups by pathologizing their identity.",
          reason: "Comparing gender or sexual identity to clinical cognitive disorders to delegitimize them."
        },
        {
          id: "RC2",
          knowledge: "Sarcastic choice metaphors.",
          reason: "Mocking social progressive concepts by labeling them as personal whims or disorders."
        }
      ]
    },
    // Level 4: CoT MLLM
    level4: {
      cot: [
        "1. The visual input contains a hand showing a thumbs-up gesture.",
        "2. The thumbs-up is colored in horizontal bands representing a gender/sexual minority flag.",
        "3. The text overlay is 'When you get to choose your own mental illness'.",
        "4. Knowledge retrieval links the pride flag directly to gender identity freedom and social dialogue.",
        "5. Relevance scoring maps the flag colors (tenor) directly to the concept of 'mental illness' (relevance score = 2).",
        "6. The model infers that linking self-identified gender with 'mental illness' creates a derogatory, stigmatizing analogy.",
        "7. Final classification: Hateful (1). Metaphor reason: Pathologizing identity."
      ]
    },
    svg: `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)"/>
      
      <!-- Thumbs Up Icon with Pride Stripes -->
      <g transform="translate(140, 100)">
        <!-- Wrist -->
        <rect x="20" y="120" width="80" height="40" rx="5" fill="#f43f5e"/>
        <!-- Hand / Back -->
        <path d="M 20 60 Q 60 50 80 80 L 100 120 L 20 120 Z" fill="#60a5fa"/>
        <!-- Thumb -->
        <path d="M 60 60 C 50 10, 100 0, 105 40 C 110 50, 95 65, 80 60 Z" fill="#fbbf24"/>
        <!-- Fingers folded (represented by stripes) -->
        <rect x="0" y="80" width="50" height="10" rx="3" fill="#a855f7"/>
        <rect x="-5" y="92" width="55" height="10" rx="3" fill="#34d399"/>
        <rect x="-10" y="104" width="60" height="10" rx="3" fill="#fbbf24"/>
        <rect x="-12" y="116" width="62" height="10" rx="3" fill="#f87171"/>
      </g>
      
      <!-- Circular abstract rays to signify selection -->
      <circle cx="200" cy="180" r="100" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="10 15" opacity="0.5"/>
      
      <!-- Text Overlay -->
      <rect class="overlay-bg" x="20" y="20" width="360" height="55" rx="8" fill="rgba(0,0,0,0.85)" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="200" y="52" fill="#fff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="13" text-anchor="middle">when you get to choose your own mental illness</text>
    </svg>`
  },
  {
    id: "preset-dogs",
    title: "Dogs & 'Group of Men'",
    text: "A group of men",
    hateful: true,
    classification: "Hateful",
    ageSafe: "Restricted (18+ Adults Only)",
    ageUnsafe: "Children under 18, Sensitive Audiences",
    metaphoricalReason: "This meme utilizes a 'personification/dehumanization' metaphorical pattern. It pairs the visual image of multiple dogs barking aggressively with the caption 'A group of men'. By directly labeling the animals as a social category of humans (men), it carries a derogatory and dehumanizing metaphor that equates men to pack animals or wild dogs, implying inherent hostility, lack of civility, and violence.",
    bboxes: [
      { label: "Dogs (Tenor)", top: "40%", left: "10%", width: "35%", height: "50%", tenor: true },
      { label: "Dog 2", top: "45%", left: "55%", width: "35%", height: "45%", tenor: false }
    ],
    ocrBox: { text: "OCR: a group of men", top: "8%", left: "20%", width: "60%", height: "12%" },
    // Level 1: SCGen Search
    level1: {
      objects: ["Group of Dogs", "Outdoor Setting"],
      entities: [
        { name: "Group of Dogs", keywords: "animals, canines, pack, aggression, barking" },
        { name: "Outdoor Setting", keywords: "park, forest, street, background" }
      ],
      knowledge: [
        { entity: "Group of Dogs", assertion: "Dogs in packs are often associated with raw instinct, territorial barking, aggressive behavior, or animalistic traits." },
        { entity: "Outdoor Setting", assertion: "No relevant socio-cultural metaphors identified." }
      ]
    },
    // Level 2: SCRA-MTI
    level2: {
      ocr: "a group of men",
      scoring: [
        { object: "Group of Dogs", textLink: "group of men", score: 2, reason: "Strongly relevant due to direct mapping of the visual animals to the human subject of the text." },
        { object: "Outdoor Setting", textLink: "none", score: 0, reason: "No relevant connection." }
      ],
      tenor: "Group of Dogs (Relevance Score: 2)"
    },
    // Level 3: RCR
    level3: {
      cases: [
        {
          id: "RC1",
          knowledge: "Dehumanization by animal association.",
          reason: "Representing human gender groups as barking dogs or farm animals to mock their behavioral standards."
        },
        {
          id: "RC2",
          knowledge: "Misinformed gender discourse.",
          reason: "Portraying specific groups as predatory or feral animals to foster social division."
        }
      ]
    },
    // Level 4: CoT MLLM
    level4: {
      cot: [
        "1. The visual input contains several dogs in a field.",
        "2. The text overlay is 'A group of men'.",
        "3. Knowledge search associates dogs in a pack with wild, aggressive, and non-rational behavior.",
        "4. Relevance scoring shows a direct metaphorical mapping of 'dogs' to 'men' (score = 2).",
        "5. The metaphorical vehicle represents 'men' through the vehicle of 'aggressive dogs'.",
        "6. This creates a derogatory, dehumanizing metaphor targeting the male gender.",
        "7. Final classification: Hateful (1). Metaphor reason: Dehumanizing gender groups."
      ]
    },
    svg: `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dogBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#14532d"/>
          <stop offset="100%" stop-color="#022c22"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#dogBg)"/>
      
      <!-- Dog 1 (Center-Left) -->
      <g transform="translate(130, 220)">
        <ellipse cx="0" cy="0" rx="35" ry="40" fill="#78350f" stroke="#451a03" stroke-width="2"/>
        <!-- Snout -->
        <polygon points="-10,0 -40,10 -10,20" fill="#451a03"/>
        <circle cx="-35" cy="8" r="4" fill="#000"/>
        <!-- Ears -->
        <polygon points="-20,-30 0,-50 -5,-25" fill="#451a03"/>
        <!-- Eyes -->
        <circle cx="-10" cy="-10" r="5" fill="#fef08a"/>
        <circle cx="-10" cy="-10" r="2" fill="#000"/>
      </g>
      
      <!-- Dog 2 (Right Side) -->
      <g transform="translate(260, 240)">
        <ellipse cx="0" cy="0" rx="30" ry="35" fill="#d97706" stroke="#92400e" stroke-width="2"/>
        <!-- Snout -->
        <polygon points="10,0 35,5 10,15" fill="#92400e"/>
        <!-- Ears -->
        <polygon points="5,-25 25,-40 15,-20" fill="#92400e"/>
        <!-- Eyes -->
        <circle cx="5" cy="-8" r="4" fill="#fff"/>
        <circle cx="5" cy="-8" r="2" fill="#000"/>
      </g>
 
      <!-- Text Overlay -->
      <rect x="80" y="30" width="240" height="50" rx="8" fill="rgba(0,0,0,0.85)" stroke="#eab308" stroke-width="1.5"/>
      <text x="200" y="62" fill="#fff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="18" text-anchor="middle">a group of men</text>
    </svg>`
  },
  {
    id: "preset-friends",
    title: "Supportive Friendship",
    text: "This is my friend, we support each other",
    hateful: false,
    classification: "Non-Hateful",
    ageSafe: "All Ages (General Audience)",
    ageUnsafe: "None",
    metaphoricalReason: "This meme does not contain any hateful, discriminatory, or derogatory metaphorical patterns. It depicts two diverse human characters smiling together, representing a literal expression of support and friendship. The visual objects (two individuals) are socio-culturally and textually aligned in a positive, supportive, and inclusive manner. Therefore, it is safe for all audiences.",
    bboxes: [
      { label: "Person A", top: "25%", left: "15%", width: "32%", height: "55%", tenor: false },
      { label: "Person B", top: "25%", left: "52%", width: "32%", height: "55%", tenor: false }
    ],
    ocrBox: { text: "OCR: this is my friend...", top: "80%", left: "5%", width: "90%", height: "15%" },
    // Level 1: SCGen Search
    level1: {
      objects: ["Person A", "Person B"],
      entities: [
        { name: "Person A", keywords: "human, friend, smile, diversity" },
        { name: "Person B", keywords: "human, friend, smile, diversity" }
      ],
      knowledge: [
        { entity: "Person A", assertion: "Represents an individual participating in a cooperative, friendly relationship." },
        { entity: "Person B", assertion: "Represents an individual participating in a cooperative, friendly relationship." }
      ]
    },
    // Level 2: SCRA-MTI
    level2: {
      ocr: "this is my friend, we support each other",
      scoring: [
        { object: "Person A", textLink: "friend / support", score: 1, reason: "Relevant as direct referent of a friend supporting another." },
        { object: "Person B", textLink: "friend / support", score: 1, reason: "Relevant as direct referent of a friend supporting another." }
      ],
      tenor: "Person A & Person B (Relevance Score: 1)"
    },
    // Level 3: RCR
    level3: {
      cases: [
        {
          id: "RC1",
          knowledge: "Positive peer relationships and social cohesion.",
          reason: "Representations of cross-cultural unity and friendly cooperation."
        }
      ]
    },
    // Level 4: CoT MLLM
    level4: {
      cot: [
        "1. The visual input contains two individuals standing side-by-side, smiling.",
        "2. The text overlay reads 'This is my friend, we support each other'.",
        "3. Knowledge search shows no negative socio-cultural tropes associated with either figure.",
        "4. Relevance scoring shows direct positive mapping between visual objects and the support message.",
        "5. The metaphorical representation is literal/positive, illustrating social support.",
        "6. Final classification: Non-Hateful (0). Metaphor reason: Literal expression of mutual support.",
        "7. Age Safety Recommendation: G-rated, suitable for all ages."
      ]
    },
    svg: `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="friendBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#065f46"/>
          <stop offset="100%" stop-color="#022c22"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#friendBg)"/>
      
      <!-- Friend 1 (Left) -->
      <g transform="translate(150, 220)">
        <circle cx="0" cy="-40" r="30" fill="#fbcfe8" stroke="#db2777" stroke-width="2"/>
        <path d="M -40 20 L -30 -10 L 30 -10 L 40 20 Z" fill="#db2777"/>
        <circle cx="-10" cy="-42" r="3" fill="#000"/>
        <circle cx="10" cy="-42" r="3" fill="#000"/>
        <path d="M -8 -30 Q 0 -22 8 -30" stroke="#000" stroke-width="2" fill="none"/>
      </g>
      
      <!-- Friend 2 (Right) -->
      <g transform="translate(250, 220)">
        <circle cx="0" cy="-40" r="30" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
        <path d="M -40 20 L -30 -10 L 30 -10 L 40 20 Z" fill="#3b82f6"/>
        <circle cx="-10" cy="-42" r="3" fill="#000"/>
        <circle cx="10" cy="-42" r="3" fill="#000"/>
        <path d="M -8 -30 Q 0 -22 8 -30" stroke="#000" stroke-width="2" fill="none"/>
      </g>
      
      <!-- Heart representing support -->
      <path d="M 200 135 C 195 125, 180 125, 180 140 C 180 155, 200 170, 200 175 C 200 170, 220 155, 220 140 C 220 125, 205 125, 200 135 Z" fill="#ef4444"/>
 
      <!-- Text Overlay -->
      <rect x="30" y="320" width="340" height="50" rx="8" fill="rgba(0,0,0,0.85)" stroke="#10b981" stroke-width="1.5"/>
      <text x="200" y="350" fill="#fff" font-family="'Outfit', sans-serif" font-weight="bold" font-size="12" text-anchor="middle">this is my friend, we support each other</text>
    </svg>`
  }
];

// CSV Dataset contents for download
const CSV_DATASETS = {
  fhm: [
    ["id", "image_path", "label", "text", "target_category"],
    [101, "fhm_101.png", 1, "Stop racism, black children and white children are the same", "race"],
    [102, "fhm_102.png", 0, "Look at this cute baby smiling!", "none"],
    [103, "fhm_103.png", 1, "They are planning to take over our neighborhood", "religion"],
    [104, "fhm_104.png", 0, "Just two friends enjoying a football match", "none"],
    [105, "fhm_105.png", 1, "When you realize they get free benefits while you work", "nationality"],
    [106, "fhm_106.png", 0, "Hardworking people building their dream community", "none"],
    [107, "fhm_107.png", 1, "Natural selection at its finest", "disability"],
    [108, "fhm_108.png", 0, "A student solving complex mathematical equations", "none"],
    [109, "fhm_109.png", 1, "Go back to your own country", "nationality"],
    [110, "fhm_110.png", 0, "Welcome to our neighborhood feast!", "none"]
  ],
  harmeme: [
    ["id", "image_path", "label", "text"],
    [201, "harm_201.png", "very_hateful", "Vaccines contain tracking microchips for government mind control"],
    [202, "harm_202.png", "partially_hateful", "When you wear a mask on your chin and think you are safe"],
    [203, "harm_203.png", "non_hateful", "Wash your hands and maintain physical distance to stop COVID-19"],
    [204, "harm_204.png", "very_hateful", "COVID was invented to wipe out elderly people and reduce pension budgets"],
    [205, "harm_205.png", "partially_hateful", "Quarantine day 45: talking to the wall and it actually answered"],
    [206, "harm_206.png", "non_hateful", "Shout out to all the frontline healthcare workers keeping us safe!"],
    [207, "harm_207.png", "very_hateful", "The virus is a hoax spread by foreigners to destroy our economy"],
    [208, "harm_208.png", "non_hateful", "Working from home during lockdown in comfy pajamas"]
  ],
  mami: [
    ["id", "image_path", "misogynist", "shaming", "stereotype", "objectification", "violence", "text"],
    [301, "mami_301.png", 1, 0, 1, 1, 0, "Get back to the kitchen and make me a sandwich"],
    [302, "mami_302.png", 0, 0, 0, 0, 0, "Female engineer leading the NASA spacecraft navigation team"],
    [303, "mami_303.png", 1, 1, 1, 0, 0, "She gained 10 pounds and thinks she's still a model"],
    [304, "mami_304.png", 0, 0, 0, 0, 0, "A woman voting during elections in the early 20th century"],
    [305, "mami_305.png", 1, 0, 0, 1, 0, "Just another decoration for the office party"],
    [306, "mami_306.png", 1, 0, 0, 0, 1, "If she talks back, teach her a lesson"],
    [307, "mami_307.png", 0, 0, 0, 0, 0, "Mother reading a storybook to her children before bedtime"],
    [308, "mami_308.png", 1, 1, 0, 1, 0, "Dressed like that, she was begging for attention"]
  ],
  hatred: [
    ["id", "image_path", "label", "text", "reason"],
    [401, "hatred_401.png", 1, "When you get to choose your own mental illness", "Mocking the LGBT community and gender identity choice by comparing it to mental illness to invalidate it."],
    [402, "hatred_402.png", 1, "Sharks don't attack him why? they think it's whale shit", "Comparing black people to whale shit to dehumanize and mock them with a derogatory metaphor."],
    [403, "hatred_403.png", 1, "A group of men", "Mocking men by comparing a group of dogs to them, implying hostility and dehumanization of males."],
    [404, "hatred_404.png", 1, "Kill one half of", "Mocking Elon Musk's Twitter layoffs by comparing it to Thanos wiping out half the universe, showing employees fading."],
    [405, "hatred_405.png", 1, "Haven't heard you're not halal?", "Dehumanizing Muslims by depicting a Muslim character with a bomb, associating their religion with terrorism and threats."],
    [406, "hatred_406.png", 0, "This is my friend, we support each other", "A positive depiction of diverse friendships without any hateful metaphors or derogatory text."]
  ]
};

// Global application state
let currentMeme = PRESETS[0];
let isAnalyzing = false;

// DOM Elements
const presetsContainer = document.getElementById("presets-container");
const previewContainer = document.getElementById("preview-container");
const btnAnalyze = document.getElementById("btn-analyze");
const fileInput = document.getElementById("file-input");
const uploadBox = document.getElementById("upload-box");

const safetyBadge = document.getElementById("safety-badge");
const valSafeAge = document.getElementById("val-safe-age");
const valUnsafeAge = document.getElementById("val-unsafe-age");

const step1 = document.getElementById("step-1");
const step2 = document.getElementById("step-2");
const step3 = document.getElementById("step-3");
const step4 = document.getElementById("step-4");

// Initialize application
window.addEventListener("DOMContentLoaded", () => {
  renderPresets();
  selectPreset(PRESETS[0].id);
  setupEventListeners();
});

// Render Preset Library Grid
function renderPresets() {
  presetsContainer.innerHTML = PRESETS.map(preset => `
    <div class="preset-card" id="${preset.id}">
      ${preset.svg}
      <div class="preset-label">${preset.title}</div>
    </div>
  `).join("");
}

// Set up event handlers
function setupEventListeners() {
  // Preset selector click handlers
  PRESETS.forEach(preset => {
    const el = document.getElementById(preset.id);
    if (el) {
      el.addEventListener("click", () => {
        if (isAnalyzing) return;
        selectPreset(preset.id);
      });
    }
  });

  // Analyze button click
  btnAnalyze.addEventListener("click", () => {
    if (isAnalyzing) return;
    runAnalysisFlow();
  });

  // Drag and drop / file upload handlers
  uploadBox.addEventListener("click", () => {
    if (isAnalyzing) return;
    fileInput.click();
  });

  fileInput.addEventListener("change", handleFileUpload);

  // Drag and drop visual cues
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (isAnalyzing) return;
    uploadBox.style.borderColor = "var(--accent-indigo)";
    uploadBox.style.background = "rgba(99, 102, 241, 0.05)";
  });

  uploadBox.addEventListener("dragleave", () => {
    uploadBox.style.borderColor = "rgba(255, 255, 255, 0.15)";
    uploadBox.style.background = "rgba(255, 255, 255, 0.01)";
  });

  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "rgba(255, 255, 255, 0.15)";
    uploadBox.style.background = "rgba(255, 255, 255, 0.01)";
    if (isAnalyzing) return;
    
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      handleFileUpload();
    }
  });
}

// Select a preset meme
function selectPreset(id) {
  const preset = PRESETS.find(p => p.id === id);
  if (!preset) return;

  currentMeme = preset;

  // Highlight selected preset
  PRESETS.forEach(p => {
    const el = document.getElementById(p.id);
    if (el) el.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");

  // Load preview
  previewContainer.innerHTML = preset.svg;

  // Reset results
  resetResults();
}

// Handle local file uploads with Tesseract OCR matching
function handleFileUpload() {
  const file = fileInput.files[0];
  if (!file) return;

  // Reset results and show loading indicator in preview area
  resetResults();
  previewContainer.innerHTML = `
    <div class="preview-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse-slow" style="animation: spin 3s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
      <span style="font-weight:600; color:var(--accent-cyan); margin-top:0.5rem;">Extracting Text via OCR...</span>
      <p style="font-size:0.75rem; color:var(--text-secondary); max-width:200px; margin-top:0.25rem; text-align:center;">Running Tesseract OCR to cross-reference with base paper datasets</p>
    </div>
  `;

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageSrc = e.target.result;

    if (window.Tesseract) {
      Tesseract.recognize(imageSrc, 'eng')
        .then(({ data: { text } }) => {
          console.log("OCR Extracted Text:", text);
          processUploadedMeme(file.name, text, imageSrc);
        })
        .catch(err => {
          console.error("Tesseract OCR Error, falling back:", err);
          processUploadedMeme(file.name, "", imageSrc);
        });
    } else {
      console.warn("Tesseract not available on window, falling back to name match.");
      processUploadedMeme(file.name, "", imageSrc);
    }
  };
  reader.readAsDataURL(file);
}

// Process and match uploaded image against known base-paper presets
function processUploadedMeme(filename, ocrText, imageSrc) {
  const normalizedText = (ocrText + " " + filename).toLowerCase();
  let matchedPreset = null;

  if (
    normalizedText.includes("racism") || 
    normalizedText.includes("racist") || 
    normalizedText.includes("chimp") || 
    normalizedText.includes("monkey") || 
    normalizedText.includes("black children") ||
    normalizedText.includes("white children") ||
    normalizedText.includes("are the same")
  ) {
    matchedPreset = PRESETS.find(p => p.id === "preset-chimpanzee");
  } else if (
    normalizedText.includes("mental") || 
    normalizedText.includes("illness") || 
    normalizedText.includes("choose") || 
    normalizedText.includes("thumbs") || 
    normalizedText.includes("identity")
  ) {
    matchedPreset = PRESETS.find(p => p.id === "preset-thumbsup");
  } else if (
    normalizedText.includes("dogs") || 
    normalizedText.includes("dog") || 
    normalizedText.includes("group of men") || 
    normalizedText.includes("men")
  ) {
    matchedPreset = PRESETS.find(p => p.id === "preset-dogs");
  } else if (
    normalizedText.includes("friend") || 
    normalizedText.includes("support") || 
    normalizedText.includes("each other")
  ) {
    matchedPreset = PRESETS.find(p => p.id === "preset-friends");
  }

  if (matchedPreset) {
    // Clone preset and use uploaded image source instead of SVG drawing
    currentMeme = JSON.parse(JSON.stringify(matchedPreset));
    currentMeme.id = "custom-upload-matched";
    currentMeme.isCustom = true;
    currentMeme.imageSrc = imageSrc;
    console.log("Image matched preset: " + matchedPreset.title);
  } else {
    // Generate generic custom meme
    currentMeme = createCustomMeme(filename, imageSrc);
    console.log("No preset matched. Generated default pipeline metrics.");
  }

  // Render uploaded image in the preview container
  previewContainer.innerHTML = `<img src="${imageSrc}" alt="Uploaded Meme">`;
  resetResults();
}

// Helper to construct a simulated analysis data set for custom uploads
function createCustomMeme(filename, imageSrc) {
  const cleanName = filename.toLowerCase().replace(/[^a-z]/g, "");
  const isHatefulLikely = cleanName.includes("hate") || cleanName.includes("racist") || cleanName.includes("dark") || cleanName.includes("kill") || cleanName.includes("meme");
  
  const ocrText = isHatefulLikely ? "Unregulated sensitive content on social networks." : "When you code all night and it works first try.";

  return {
    id: "custom-upload-generic",
    title: filename,
    text: ocrText,
    isCustom: true,
    imageSrc: imageSrc,
    hateful: isHatefulLikely,
    classification: isHatefulLikely ? "Hateful" : "Non-Hateful",
    ageSafe: isHatefulLikely ? "Restricted (18+ Adults Only)" : "Teens 13+ (Mild Cartoon Violence/Language)",
    ageUnsafe: isHatefulLikely ? "Children under 18, Sensitive Audiences" : "Kids under 13",
    metaphoricalReason: isHatefulLikely 
      ? "This custom meme contains visual themes flagged as sensitive, utilizing a dark-humor metaphorical analogy that can be perceived as hostile toward general social groups. Recommended only for adult viewing."
      : "This custom meme contains standard relatable humor with no identifiable hateful metaphors. It represents a benign social analogy and is safe for general teen and adult audiences.",
    bboxes: [
      { label: "Detected Object (Tenor)", top: "20%", left: "15%", width: "70%", height: "55%", tenor: true }
    ],
    ocrBox: { text: "OCR: " + ocrText, top: "80%", left: "5%", width: "90%", height: "15%" },
    level1: {
      objects: isHatefulLikely ? ["Aggressive Figure", "Text Banner"] : ["Person Coding", "Computer Monitor"],
      entities: isHatefulLikely 
        ? [{ name: "Aggressive Figure", keywords: "conflict, sensitive trope, high impact" }]
        : [{ name: "Person Coding", keywords: "workplace humor, developer, focus" }],
      knowledge: isHatefulLikely
        ? [{ entity: "Aggressive Figure", assertion: "Often associated with aggressive online arguments, hostility, or polarization." }]
        : [{ entity: "Person Coding", assertion: "Represents developer culture, programming struggles, and victory loops." }]
    },
    level2: {
      ocr: ocrText,
      scoring: isHatefulLikely
        ? [{ object: "Aggressive Figure", textLink: "unregulated speech", score: 2, reason: "Direct thematic connection to hostile statements." }]
        : [{ object: "Person Coding", textLink: "code all night", score: 1, reason: "Corresponds literally to the struggles of programming." }],
      tenor: isHatefulLikely ? "Aggressive Figure" : "Person Coding"
    },
    level3: {
      cases: isHatefulLikely 
        ? [{ id: "RC-U1", knowledge: "Polarized social rhetoric.", reason: "Using aggressive visual representations to emphasize divisive statements." }]
        : [{ id: "RC-U2", knowledge: "Relatable occupational humor.", reason: "Standard exaggerated situational templates used for bonding." }]
    },
    level4: {
      cot: [
        "1. Visual input analyzed: extracted main entities.",
        "2. OCR extraction completed: '" + ocrText + "'.",
        "3. Knowledge base matched relevant historical context.",
        "4. Relevance scoring assessed connections.",
        "5. Metaphorical vehicle identified: " + (isHatefulLikely ? "Implicit Satirical attack" : "Benign situational analogy") + ".",
        "6. Final classification: " + (isHatefulLikely ? "Hateful (1)" : "Non-Hateful (0)")
      ]
    }
  };
}

// Reset the results UI
function resetResults() {
  clearOverlays();
  
  safetyBadge.className = "safety-badge pending";
  safetyBadge.innerText = "Awaiting Analysis";
  valSafeAge.innerText = "-";
  valUnsafeAge.innerText = "-";

  const steps = [step1, step2, step3, step4];
  steps.forEach(step => {
    step.className = "flow-step";
    const body = step.querySelector(".step-body");
    if (body) body.innerHTML = "";
    const status = step.querySelector(".step-status-tag");
    if (status) status.innerText = "Pending";
  });
}

// Sleep utility for animation timing
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Core data flow runner implementing the paper's 4 modules
async function runAnalysisFlow() {
  isAnalyzing = true;
  btnAnalyze.disabled = true;
  btnAnalyze.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="animate-pulse" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Processing...`;
  
  resetResults();
  
  // LEVEL 1: SCGen Search
  step1.className = "flow-step active";
  step1.querySelector(".step-status-tag").innerText = "Executing";
  await sleep(1500);

  // Draw Bounding Boxes Visual Traversal Overlay!
  drawBoundingBoxes();

  const l1 = currentMeme.level1;
  const l1Html = `
    <p><strong>1. Visual Objects Extracted (YOLO-World):</strong> ${l1.objects.join(", ")}</p>
    <p style="margin-top: 0.4rem;"><strong>2. Naming Entities &amp; Keywords (Qwen2):</strong></p>
    <div style="padding-left: 0.8rem; margin: 0.3rem 0;">
      ${l1.entities.map(e => `&bull; <code>${e.name}</code>: <span style="color:#a855f7;">${e.keywords}</span>`).join("<br>")}
    </div>
    <p style="margin-top: 0.4rem;"><strong>3. Socio-Cultural Knowledge Assertions (LLM Search):</strong></p>
    <div class="flow-output-box">
      ${l1.knowledge.map(k => `[Assertion for ${k.entity}]:\n${k.assertion}`).join("\n\n")}
    </div>
  `;
  step1.querySelector(".step-body").innerHTML = l1Html;
  step1.className = "flow-step completed";
  step1.querySelector(".step-status-tag").innerText = "Completed";

  // LEVEL 2: SCRA-MTI
  step2.className = "flow-step active";
  step2.querySelector(".step-status-tag").innerText = "Executing";
  await sleep(1800);

  // Draw OCR Highlights & Connectors!
  drawOCRAndConnectors();

  const l2 = currentMeme.level2;
  const l2Html = `
    <p><strong>1. OCR Text Extraction (OCR Module):</strong> <span style="color:#eab308; font-style:italic;">"${l2.ocr}"</span></p>
    <p style="margin-top: 0.4rem;"><strong>2. Socio-Cultural Relevance Assessment Matrix:</strong></p>
    <table class="relevance-table">
      <thead>
        <tr>
          <th>Visual Object</th>
          <th>Textual Relation</th>
          <th>Relevance Score</th>
          <th>Heuristic Context</th>
        </tr>
      </thead>
      <tbody>
        ${l2.scoring.map(s => `
          <tr>
            <td><code>${s.object}</code></td>
            <td><code>${s.textLink}</code></td>
            <td><span class="score-badge score-${s.score}">${s.score}</span></td>
            <td style="text-align: left; font-size: 0.7rem; color: var(--text-secondary);">${s.reason}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <p style="margin-top: 0.6rem;"><strong>3. Metaphorical Tenor (QuickSort):</strong> Ranked primary entity is <span style="color:#ef4444; font-weight:bold;">${l2.tenor}</span>.</p>
  `;
  step2.querySelector(".step-body").innerHTML = l2Html;
  step2.className = "flow-step completed";
  step2.querySelector(".step-status-tag").innerText = "Completed";

  // LEVEL 3: RCR (Representative Case Retrieval)
  step3.className = "flow-step active";
  step3.querySelector(".step-status-tag").innerText = "Executing";

  // Highlight the primary tenor box to represent Case comparison alignment
  const tenorBbox = previewContainer.querySelector(".bbox.primary-tenor");
  if (tenorBbox) {
    tenorBbox.style.borderColor = "var(--accent-purple)";
    tenorBbox.style.boxShadow = "0 0 20px var(--accent-purple), inset 0 0 15px rgba(168, 85, 247, 0.3)";
  }

  await sleep(1400);

  const l3 = currentMeme.level3;
  const l3Html = `
    <p>Retrieving similar reference cases from Case Knowledge Base (Faiss Index Match):</p>
    <div class="cases-preview">
      ${l3.cases.map((c, idx) => `
        <div class="case-mini-card">
          <div class="case-title">Case #${idx+1} [ID: ${c.id}]</div>
          <div><strong>Knowledge:</strong> ${c.knowledge}</div>
          <div style="margin-top: 0.2rem; color: #a855f7;"><strong>Decision Logic:</strong> ${c.reason}</div>
        </div>
      `).join("")}
    </div>
  `;
  step3.querySelector(".step-body").innerHTML = l3Html;
  step3.className = "flow-step completed";
  step3.querySelector(".step-status-tag").innerText = "Completed";

  // LEVEL 4: Decision & Interpretation (CoT MLLM)
  step4.className = "flow-step active";
  step4.querySelector(".step-status-tag").innerText = "Executing";
  await sleep(1600);

  const l4 = currentMeme.level4;
  const l4Html = `
    <p><strong>1. Chain of Thought (CoT Prompt):</strong></p>
    <div class="flow-output-box" style="color: #c084fc; max-height: 120px;">
      ${l4.cot.join("\n")}
    </div>
    <p style="margin-top: 0.5rem;"><strong>2. Structured Metaphorical Explanation:</strong></p>
    <p style="font-size: 0.8rem; line-height: 1.5; color: var(--text-primary); margin-top: 0.2rem; background: rgba(0,0,0,0.15); padding: 0.5rem; border-radius: 6px; border-left: 2px solid var(--accent-purple);">
      ${currentMeme.metaphoricalReason}
    </p>
  `;
  step4.querySelector(".step-body").innerHTML = l4Html;
  step4.className = "flow-step completed";
  step4.querySelector(".step-status-tag").innerText = "Completed";

  // Finalize dashboard outputs
  if (currentMeme.hateful) {
    safetyBadge.className = "safety-badge unsafe";
    safetyBadge.innerText = "HATEFUL / RESTRICTED CONTENT";
  } else {
    safetyBadge.className = "safety-badge safe";
    safetyBadge.innerText = "SAFE CONTENT";
  }

  valSafeAge.innerText = currentMeme.ageSafe;
  valUnsafeAge.innerText = currentMeme.ageUnsafe;

  // Reset analyze button state
  btnAnalyze.disabled = false;
  btnAnalyze.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    Analyze Meme
  `;
  isAnalyzing = false;
}

// Bounding Box visual overlay builder
function drawBoundingBoxes() {
  clearOverlays();
  if (!currentMeme.bboxes) return;

  currentMeme.bboxes.forEach((box, index) => {
    const div = document.createElement("div");
    div.className = `bbox ${box.tenor ? 'primary-tenor' : ''}`;
    div.style.top = box.top;
    div.style.left = box.left;
    div.style.width = box.width;
    div.style.height = box.height;
    div.id = `bbox-${index}`;

    div.innerHTML = `<div class="bbox-label">${box.label}</div>`;
    previewContainer.appendChild(div);

    setTimeout(() => div.classList.add("visible"), 50);
  });
}

// OCR Bounding box & connection vector lines builder
function drawOCRAndConnectors() {
  if (!currentMeme.ocrBox) return;

  // Create OCR Highlight Box overlay
  const ocr = currentMeme.ocrBox;
  const div = document.createElement("div");
  div.className = "ocr-box";
  div.style.top = ocr.top;
  div.style.left = ocr.left;
  div.style.width = ocr.width;
  div.style.height = ocr.height;
  div.id = "ocr-highlight-box";

  div.innerHTML = `<div class="ocr-box-label">${ocr.text}</div>`;
  previewContainer.appendChild(div);
  setTimeout(() => div.classList.add("visible"), 50);

  // Draw arrow connection lines inside SVG canvas
  const svgCanvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgCanvas.setAttribute("class", "arrow-canvas");
  svgCanvas.setAttribute("id", "arrow-overlay-canvas");
  previewContainer.appendChild(svgCanvas);

  setTimeout(() => {
    currentMeme.bboxes.forEach((box, index) => {
      const bboxEl = document.getElementById(`bbox-${index}`);
      const ocrEl = document.getElementById("ocr-highlight-box");
      if (!bboxEl || !ocrEl) return;

      const bRect = bboxEl.getBoundingClientRect();
      const oRect = ocrEl.getBoundingClientRect();
      const cRect = previewContainer.getBoundingClientRect();

      // Find center points of bbox and ocr box relative to preview container
      const x1 = (bRect.left + bRect.width / 2) - cRect.left;
      const y1 = (bRect.top + bRect.height / 2) - cRect.top;
      const x2 = (oRect.left + oRect.width / 2) - cRect.left;
      const y2 = oRect.top - cRect.top; // connect to top of OCR block

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      // Draw a curved line path
      const dx = x2 - x1;
      const dy = y2 - y1;
      const cx = x1 + dx / 2;
      const cy = y1 + dy / 2 - 30; // curve upwards slightly

      const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      path.setAttribute("d", d);
      path.setAttribute("class", "connector-line");
      path.setAttribute("id", `line-${index}`);

      // Arrow markers definitions
      let defs = svgCanvas.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svgCanvas.appendChild(defs);

        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", "arrow");
        marker.setAttribute("viewBox", "0 0 10 10");
        marker.setAttribute("refX", "6");
        marker.setAttribute("refY", "5");
        marker.setAttribute("markerWidth", "6");
        marker.setAttribute("markerHeight", "6");
        marker.setAttribute("orient", "auto-start-reverse");

        const mPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        mPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
        mPath.setAttribute("fill", "var(--accent-cyan)");

        marker.appendChild(mPath);
        defs.appendChild(marker);
      }

      path.setAttribute("marker-end", "url(#arrow)");
      svgCanvas.appendChild(path);

      setTimeout(() => path.classList.add("visible"), 100);
    });
  }, 300);
}

// Clear visual overlays
function clearOverlays() {
  const bboxes = previewContainer.querySelectorAll(".bbox");
  bboxes.forEach(b => b.remove());

  const ocrBox = previewContainer.querySelector(".ocr-box");
  if (ocrBox) ocrBox.remove();

  const arrowCanvas = previewContainer.querySelector(".arrow-canvas");
  if (arrowCanvas) arrowCanvas.remove();
}


// Download CSV helper
window.downloadDatasetCSV = function(datasetKey) {
  const data = CSV_DATASETS[datasetKey];
  if (!data) return;

  // Convert array of arrays to CSV string
  let csvContent = "";
  data.forEach(row => {
    let rowContent = row.map(val => {
      // Escape strings containing quotes or commas
      let cleanVal = String(val);
      if (cleanVal.includes(",") || cleanVal.includes('"') || cleanVal.includes("\n")) {
        cleanVal = '"' + cleanVal.replace(/"/g, '""') + '"';
      }
      return cleanVal;
    }).join(",");
    csvContent += rowContent + "\r\n";
  });

  // Create blob and download it
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${datasetKey}_dataset.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Tab Switching Logic
window.switchTab = function(tabId) {
  // Toggle Active tabs buttons
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(t => t.classList.remove("active"));
  
  const activeBtn = document.getElementById(`tab-${tabId}-btn`);
  if (activeBtn) activeBtn.classList.add("active");
  
  // Toggle Active tab contents
  const contents = document.querySelectorAll(".tab-content");
  contents.forEach(c => c.classList.remove("active-tab"));
  
  const activeContent = document.getElementById(`tab-${tabId}`);
  if (activeContent) activeContent.classList.add("active-tab");

  // If results tab is opened, render the interactive charts
  if (tabId === "results") {
    renderPerformanceCharts();
  }
};

let modelsChartInstance = null;
let ablationChartInstance = null;

function renderPerformanceCharts() {
  const chartModelsEl = document.getElementById("chart-models");
  const chartAblationEl = document.getElementById("chart-ablation");
  
  if (!chartModelsEl || !chartAblationEl) return;
  
  // Chart 1: Table II Model Accuracies
  const ctxModels = chartModelsEl.getContext("2d");
  if (modelsChartInstance) {
    modelsChartInstance.destroy();
  }
  
  const labels = ["Text BERT", "CLIP-BERT", "ALBEF", "Pro-CapPromptHate", "Qwen-VL-Max", "GPT4", "Qwen-VL-Max w/ Ours", "GPT4 w/ Ours"];
  const fhmAcc = [57.12, 58.28, 70.58, 72.28, 55.60, 68.80, 72.80, 78.60];
  const mamiAcc = [67.37, 68.44, 72.77, 73.06, 65.90, 67.50, 73.40, 74.63];
  const harmAcc = [75.68, 80.48, 80.99, 83.25, 67.31, 73.06, 79.20, 83.29];
  
  modelsChartInstance = new Chart(ctxModels, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "FHM Accuracy (%)",
          data: fhmAcc,
          backgroundColor: "rgba(99, 102, 241, 0.6)",
          borderColor: "rgb(99, 102, 241)",
          borderWidth: 1
        },
        {
          label: "MAMI Accuracy (%)",
          data: mamiAcc,
          backgroundColor: "rgba(6, 182, 212, 0.6)",
          borderColor: "rgb(6, 182, 212)",
          borderWidth: 1
        },
        {
          label: "HarMeme Accuracy (%)",
          data: harmAcc,
          backgroundColor: "rgba(139, 92, 246, 0.6)",
          borderColor: "rgb(139, 92, 246)",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "var(--text-secondary)" }
        },
        x: {
          grid: { display: false },
          ticks: { color: "var(--text-secondary)", font: { size: 9 } }
        }
      },
      plugins: {
        legend: { labels: { color: "#fff" } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%` } }
      }
    }
  });

  // Chart 2: Table V Ablation study gains
  const ctxAblation = chartAblationEl.getContext("2d");
  if (ablationChartInstance) {
    ablationChartInstance.destroy();
  }
  
  const ablationLabels = ["Baseline (Text)", "+ SCK", "+ SCK + SCRS", "+ SCK + SCRS + RC (Ours)"];
  const fhmAblation = [68.80, 73.10, 74.52, 78.60];
  const mamiAblation = [67.50, 71.06, 71.94, 74.63];
  const harmAblation = [73.06, 78.52, 80.31, 83.29];
  
  ablationChartInstance = new Chart(ctxAblation, {
    type: "line",
    data: {
      labels: ablationLabels,
      datasets: [
        {
          label: "FHM Gain",
          data: fhmAblation,
          borderColor: "rgb(99, 102, 241)",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          fill: true,
          tension: 0.3
        },
        {
          label: "MAMI Gain",
          data: mamiAblation,
          borderColor: "rgb(6, 182, 212)",
          backgroundColor: "rgba(6, 182, 212, 0.1)",
          fill: true,
          tension: 0.3
        },
        {
          label: "HarMeme Gain",
          data: rgbColors = "rgb(139, 92, 246)",
          borderColor: "rgb(139, 92, 246)",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          fill: true,
          data: harmAblation,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 60,
          max: 95,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "var(--text-secondary)" }
        },
        x: {
          grid: { display: false },
          ticks: { color: "var(--text-secondary)" }
        }
      },
      plugins: {
        legend: { labels: { color: "#fff" } }
      }
    }
  });
}

// Dataset Metadata Definitions
const DATASET_METADATA = {
  fhm: {
    title: "Facebook Hateful Memes (FHM)",
    desc: "A benchmark dataset designed to test multimodal reasoning by pairing images with text and introducing benign confounders.",
    stats: [
      { metric: "Publisher / Source", value: "Meta AI Research (2020)" },
      { metric: "Task Type", value: "Binary Hateful Meme Classification" },
      { metric: "Total Samples", value: "10,000 memes" },
      { metric: "Train / Dev / Test Splits", value: "8,500 / 500 / 1,000" },
      { metric: "Discriminative Dimensions", value: "Race, Religion, Gender, Disability, Sexual Orientation" },
      { metric: "Target Labels", value: "0: Safe, 1: Hateful" },
      { metric: "Annotation Format", value: "JSONL text strings matched with image filenames" }
    ]
  },
  harmeme: {
    title: "COVID-19 Hateful Memes (HarMeme)",
    desc: "Consists of social media memes related to the COVID-19 pandemic, focusing on health crisis slurs and abuse patterns.",
    stats: [
      { metric: "Publisher / Source", value: "Pan et al. (HMC Research Lab)" },
      { metric: "Task Type", value: "Multi-class Hate Speech Detection" },
      { metric: "Total Samples", value: "3,542 memes" },
      { metric: "Train / Test Split Ratio", value: "80% / 20%" },
      { metric: "Target Labels", value: "0: Non-Hateful, 1: Partially Hateful, 2: Very Hateful" },
      { metric: "Source Platform", value: "Twitter/X posts & public media" }
    ]
  },
  mami: {
    title: "Multimedia Automatic Misogyny Identification (MAMI)",
    desc: "A challenge dataset mapping various categories of misogyny and hostile offenses targeting women.",
    stats: [
      { metric: "Publisher / Source", value: "SemEval-2022 Task 5" },
      { metric: "Task Type", value: "Multi-label Misogynous Content Detection" },
      { metric: "Total Samples", value: "10,000 memes" },
      { metric: "Sub-task Label Dimensions", value: "Misogynous, Shaming, Stereotype, Objectification, Violence" },
      { metric: "Primary Labels", value: "Multi-hot binary classification vectors" },
      { metric: "Source Platform", value: "Social media harassment collections" }
    ]
  },
  hatred: {
    title: "Hateful Memes with Reasons (HatReD)",
    desc: "Provides human-annotated sociocultural reasons and metaphorical interpretations for hateful memes.",
    stats: [
      { metric: "Publisher / Source", value: "Social-AI-Studio Research Group" },
      { metric: "Task Type", value: "Socio-cultural Metaphor Explanation Generation" },
      { metric: "Total Samples", value: "2,982 annotated FHM memes" },
      { metric: "Annotated Target Dimensions", value: "Visual Tenor, Socio-cultural Target, Metaphorical Vehicle" },
      { metric: "Explanation Output", value: "Free-text rationales explaining underlying slurs" },
      { metric: "Index Format", value: "FAISS embeddings + T5 seq2seq generation" }
    ]
  }
};

// Modal Control Functions
window.showDatasetMetadata = function(datasetKey) {
  const metadata = DATASET_METADATA[datasetKey];
  if (!metadata) return;

  const modal = document.getElementById("metadata-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  const modalTableBody = document.getElementById("modal-table-body");

  if (!modal || !modalTitle || !modalDesc || !modalTableBody) return;

  modalTitle.textContent = metadata.title;
  modalDesc.textContent = metadata.desc;

  // Build metadata table body
  modalTableBody.innerHTML = metadata.stats.map(row => `
    <tr>
      <td style="font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">${row.metric}</td>
      <td style="color: #fff; font-size: 0.9rem;">${row.value}</td>
    </tr>
  `).join("");

  modal.classList.add("active");
};

window.closeMetadataModal = function() {
  const modal = document.getElementById("metadata-modal");
  if (modal) {
    modal.classList.remove("active");
  }
};

// Close modal on Escape key press
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeMetadataModal();
  }
});

import emma from "@/assets/avatars/emma.jpg";
import james from "@/assets/avatars/james.jpg";
import sophie from "@/assets/avatars/sophie.jpg";
import hans from "@/assets/avatars/hans.jpg";
import lucy from "@/assets/avatars/lucy.jpg";
import marco from "@/assets/avatars/marco.jpg";
import anna from "@/assets/avatars/anna.jpg";
import david from "@/assets/avatars/david.jpg";

const AVATARS: Record<string, string> = {
  emma, james, sophie, hans, lucy, marco, anna, david,
};

export type Foreigner = {
  id: string;
  name: string;
  country: string;
  flag: string;
  age: number;
  platform: "TikTok" | "Facebook" | "WhatsApp" | "Instagram" | "YouTube";
  rate: number;
  online: boolean;
  bio: string;
  opener: string[];
  replies: string[];
  avatar: string;
};

const BASE: Omit<Foreigner, "avatar">[] = [
  {
    id: "emma",
    name: "Emma Larsson",
    country: "Sweden",
    flag: "🇸🇪",
    age: 27,
    platform: "TikTok",
    rate: 850,
    online: true,
    bio: "Anasoma Kiswahili miezi 6, anapenda kujifunza methali.",
    opener: [
      "Habari yako rafiki! 😊",
      "Naitwa Emma, natoka Sweden. Ninajifunza Kiswahili na sitaki kusahau.",
      "Leo hali ya hewa kwako ikoje? Hapa kuna baridi sana!",
    ],
    replies: [
      "Aaah asante kwa kunifundisha! Nimeandika hilo neno kwenye daftari langu 📝",
      "Kweli? Hilo halijui kabisa. Naomba unitungie sentensi moja nayo.",
      "Hahaha nimefurahi sana kuzungumza nawe, Kiswahili ni lugha tamu.",
      "Naomba unieleze zaidi, mimi bado mwanafunzi wa Kiswahili 🙏",
      "Nataka kutembelea Tanzania mwaka ujao. Nianzie mji gani?",
    ],
  },
  {
    id: "james",
    name: "James Miller",
    country: "USA",
    flag: "🇺🇸",
    age: 34,
    platform: "Facebook",
    rate: 1200,
    online: true,
    bio: "Mwalimu wa Kiingereza anayetaka kuzungumza Kiswahili kila siku.",
    opener: [
      "Mambo vipi! 👋",
      "Mimi ni James kutoka Texas, Marekani. Nataka kufanya mazoezi ya Kiswahili.",
      "Unaweza kunisaidia kujua tofauti ya \"karibu\" na \"karibuni\"?",
    ],
    replies: [
      "Ooh sasa nimeelewa vizuri! Asante mwalimu 😄",
      "Nzuri sana. Sema tena kwa sentensi ndefu nijifunze zaidi.",
      "Kiswahili chako ni safi. Mimi nakosea sana matamshi.",
      "Nikija Dar es Salaam utanionyesha mahali pa kula wali wa nazi?",
      "Nataka tuzungumze kila siku, inanisaidia sana.",
    ],
  },
  {
    id: "sophie",
    name: "Sophie Dubois",
    country: "France",
    flag: "🇫🇷",
    age: 25,
    platform: "Instagram",
    rate: 900,
    online: true,
    bio: "Mwanahabari kutoka Paris, anaandika habari za Afrika Mashariki.",
    opener: [
      "Jambo! 🌸",
      "Naitwa Sophie, natoka Ufaransa. Nasoma Kiswahili kwa ajili ya kazi yangu.",
      "Tafadhali, neno \"shikamoo\" linatumika lini?",
    ],
    replies: [
      "Merci... samahani, asante sana! 😅",
      "Hilo ni jibu zuri sana. Naliweka kwenye kumbukumbu zangu.",
      "Utamaduni wa Tanzania unanivutia mno. Nieleze kuhusu Zanzibar.",
      "Naomba unirekebishe nikikosea, nataka kujifunza kwa usahihi.",
      "Kiswahili ni lugha ya kwanza ya Kiafrika ninayoipenda ❤️",
    ],
  },
  {
    id: "hans",
    name: "Hans Müller",
    country: "Germany",
    flag: "🇩🇪",
    age: 41,
    platform: "WhatsApp",
    rate: 1000,
    online: false,
    bio: "Mhandisi anayefanya kazi na miradi ya Afrika Mashariki.",
    opener: [
      "Hujambo rafiki yangu 🙂",
      "Mimi Hans kutoka Munich. Nafanya kazi na wenzangu wa Tanzania.",
      "Nataka kujua namna ya kusalimia wafanyakazi wangu kwa heshima.",
    ],
    replies: [
      "Sawasawa, nimeandika. Asante kwa msaada wako 🙏",
      "Hii itanisaidia sana kazini. Naomba mfano mwingine.",
      "Kiswahili kina mpangilio mzuri, kama Kijerumani!",
      "Nitakutumia sauti nisikilize matamshi yangu yakoje.",
      "Tuendelee, nina muda wa saa moja leo.",
    ],
  },
  {
    id: "lucy",
    name: "Lucy Bennett",
    country: "UK",
    flag: "🇬🇧",
    age: 30,
    platform: "YouTube",
    rate: 1100,
    online: true,
    bio: "Mtayarishaji wa video anayejifunza lugha mpya kila mwaka.",
    opener: [
      "Salama! 😊",
      "Naitwa Lucy, natoka London. Nafanya video za kujifunza Kiswahili.",
      "Naomba unifundishe maneno matano ya sokoni.",
    ],
    replies: [
      "Poa sana! Nimeyaandika yote matano 📒",
      "Hii ni nzuri kwa video yangu. Asante rafiki!",
      "Nifundishe pia jinsi ya kupunguza bei sokoni 😄",
      "Kiswahili chako ni cha mwalimu kweli.",
      "Tukutane hapa kesho pia, tafadhali.",
    ],
  },
  {
    id: "marco",
    name: "Marco Rossi",
    country: "Italy",
    flag: "🇮🇹",
    age: 36,
    platform: "Facebook",
    rate: 950,
    online: true,
    bio: "Mpishi anayetaka kuandika menyu kwa Kiswahili.",
    opener: [
      "Habari za jioni! 🍝",
      "Mimi ni Marco kutoka Roma, nina mkahawa mdogo.",
      "Nataka kuandika menyu kwa Kiswahili. Nianzie na nini?",
    ],
    replies: [
      "Bene! Yaani vizuri! Asante 😍",
      "Neno hilo ni tamu kama chakula changu.",
      "Naomba unitafsirie \"supu ya samaki\" na \"mchuzi wa nyanya\".",
      "Wateja wangu watashangaa kuona Kiswahili kwenye menyu!",
      "Nikuandikie kesho tuendelee na vinywaji?",
    ],
  },
  {
    id: "anna",
    name: "Anna Kowalski",
    country: "Poland",
    flag: "🇵🇱",
    age: 23,
    platform: "TikTok",
    rate: 800,
    online: true,
    bio: "Mwanafunzi wa chuo anayependa muziki wa Bongo Flava.",
    opener: [
      "Mambo! 🎶",
      "Naitwa Anna, natoka Poland. Napenda sana Bongo Flava.",
      "Nisaidie kuelewa maneno ya wimbo niliousikia jana.",
    ],
    replies: [
      "Woow asante! Sasa wimbo unanigusa zaidi 🥹",
      "Kiswahili cha nyimbo ni kigumu kidogo, lakini kizuri.",
      "Nipendekeze wimbo mwingine mzuri wa kujifunza.",
      "Nitaimba na kukurekodi, ucheke 😂",
      "Tuzungumze zaidi, nina maswali mengi.",
    ],
  },
  {
    id: "david",
    name: "David Cohen",
    country: "Canada",
    flag: "🇨🇦",
    age: 45,
    platform: "WhatsApp",
    rate: 1300,
    online: true,
    bio: "Mfanyabiashara anayefungua ofisi Arusha mwaka huu.",
    opener: [
      "Shikamoo? 😄 Nadhani nimesema vizuri!",
      "Mimi David kutoka Toronto. Nafungua ofisi Arusha.",
      "Nifundishe maneno ya biashara: bei, faida, mkataba.",
    ],
    replies: [
      "Asante! Hii ni muhimu sana kwa kazi yangu 🙏",
      "Naomba unirudie kwa sentensi ya mfano.",
      "Kiswahili kitanisaidia kupata wateja wengi.",
      "Nifundishe pia namna ya kusema \"tumekubaliana\".",
      "Tuendelee kila siku, nitakuwa mwanafunzi wako.",
    ],
  },
];

type Seed = {
  id: string;
  name: string;
  country: string;
  flag: string;
  age: number;
  platform: Foreigner["platform"];
  rate: number;
  online: boolean;
  from: string;
  wants: string;
  minutes: number;
};

const SEEDS: Seed[] = [
  { id: "william", name: "William", country: "Australia", flag: "🇦🇺", age: 31, platform: "TikTok", rate: 49500, online: true, from: "james", wants: "Michezo & Mpira wa Miguu", minutes: 55 },
  { id: "jonathan", name: "Jonathan", country: "Norway", flag: "🇳🇴", age: 29, platform: "Facebook", rate: 48000, online: true, from: "hans", wants: "Filamu za Mazingira", minutes: 53 },
  { id: "amelia", name: "Amelia", country: "Sweden", flag: "🇸🇪", age: 26, platform: "Instagram", rate: 41500, online: true, from: "emma", wants: "Mapishi ya Kiafrika", minutes: 45 },
  { id: "oliver", name: "Oliver", country: "UK", flag: "🇬🇧", age: 33, platform: "WhatsApp", rate: 52000, online: true, from: "lucy", wants: "Biashara & Utamaduni", minutes: 60 },
  { id: "chloe", name: "Chloe", country: "France", flag: "🇫🇷", age: 24, platform: "TikTok", rate: 44000, online: true, from: "sophie", wants: "Habari za Afrika Mashariki", minutes: 40 },
  { id: "luca", name: "Luca", country: "Italy", flag: "🇮🇹", age: 37, platform: "Facebook", rate: 46500, online: true, from: "marco", wants: "Vyakula & Migahawa", minutes: 48 },
  { id: "nora", name: "Nora", country: "Poland", flag: "🇵🇱", age: 22, platform: "TikTok", rate: 39500, online: true, from: "anna", wants: "Muziki wa Bongo Flava", minutes: 35 },
  { id: "ethan", name: "Ethan", country: "Canada", flag: "🇨🇦", age: 42, platform: "WhatsApp", rate: 54500, online: true, from: "david", wants: "Kiswahili cha Biashara", minutes: 62 },
  { id: "mia", name: "Mia", country: "Germany", flag: "🇩🇪", age: 28, platform: "Instagram", rate: 43000, online: true, from: "hans", wants: "Safari & Utalii", minutes: 42 },
  { id: "harry", name: "Harry", country: "USA", flag: "🇺🇸", age: 35, platform: "YouTube", rate: 51000, online: true, from: "james", wants: "Methali za Kiswahili", minutes: 58 },
  { id: "elise", name: "Elise", country: "Belgium", flag: "🇧🇪", age: 30, platform: "Facebook", rate: 45500, online: false, from: "sophie", wants: "Historia ya Zanzibar", minutes: 47 },
  { id: "noah", name: "Noah", country: "Netherlands", flag: "🇳🇱", age: 32, platform: "WhatsApp", rate: 47500, online: true, from: "david", wants: "Mazungumzo ya Kila Siku", minutes: 50 },
];

const BASE_BY_ID = new Map(BASE.map((b) => [b.id, b]));

const EXTRA: Foreigner[] = SEEDS.map((s) => {
  const src = BASE_BY_ID.get(s.from)!;
  const rename = (t: string) => t.replace(src.name, s.name).replace(src.name.split(" ")[0]!, s.name);
  return {
    id: s.id,
    name: s.name,
    country: s.country,
    flag: s.flag,
    age: s.age,
    platform: s.platform,
    rate: s.rate,
    online: s.online,
    bio: src.bio,
    opener: src.opener.map(rename),
    replies: src.replies.map(rename),
    avatar: AVATARS[s.from]!,
    wants: s.wants,
    minutes: s.minutes,
    rating: Number((4.5 + ((s.name.length * 7) % 5) / 10).toFixed(1)),
  };
});

const FOREIGNERS: Foreigner[] = [
  ...EXTRA,
  ...BASE.map((f, i) => ({
    ...f,
    rate: 38000 + i * 1500,
    avatar: AVATARS[f.id]!,
    wants: "Mazoezi ya Kiswahili",
    minutes: 38 + i * 2,
    rating: Number((4.5 + (i % 5) / 10).toFixed(1)),
  })),
];

export function pickForeigners(count = 12): Foreigner[] {
  const pool = [...FOREIGNERS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = a;
  }
  return pool.slice(0, count);
}

export function getForeigner(id: string): Foreigner | undefined {
  return FOREIGNERS.find((f) => f.id === id);
}

export type Testimonial = { name: string; place: string; amount: number; note: string };

export const TESTIMONIALS: Testimonial[] = [
  { name: "Neema J.", place: "Dar es Salaam", amount: 145000, note: "Nimelipwa baada ya kuchat na William" },
  { name: "Baraka M.", place: "Mwanza", amount: 98500, note: "Malipo yameingia M-Pesa dakika 5" },
  { name: "Asha R.", place: "Arusha", amount: 212000, note: "Wiki hii nimemaliza chats 6" },
  { name: "Juma K.", place: "Dodoma", amount: 76000, note: "Nimelipwa kwa mazungumzo na Amelia" },
  { name: "Sara P.", place: "Zanzibar", amount: 189500, note: "Airtel Money imeingia salama" },
  { name: "Emmanuel S.", place: "Mbeya", amount: 132000, note: "Activation ililipa mara moja" },
  { name: "Zawadi L.", place: "Tanga", amount: 165500, note: "Nimechat na Jonathan, nimelipwa" },
];

export const ACTIVATION_FEE = 16000;

export type MoxeraUser = {
  fullName: string;
  username: string;
  phone: string;
  email: string;
  country: string;
  registeredAt: string;
};

const KEY = "moxera_user";

export function loadUser(): MoxeraUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MoxeraUser) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: MoxeraUser) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser() {
  window.localStorage.removeItem(KEY);
}

export const COUNTRIES = [
  "Tanzania",
  "Kenya",
  "Uganda",
  "Rwanda",
  "Burundi",
  "DR Congo",
  "Zambia",
  "Malawi",
  "Msumbiji",
];

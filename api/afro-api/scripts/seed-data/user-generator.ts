/**
 * User Generator for Seed Database
 * Creates 1000 diverse South African users
 */

import { Types } from 'mongoose';

export interface SeedUser {
  username: string;
  displayName: string;
  phoneNumber: string;
  tribeId: Types.ObjectId;
  bio?: string;
  languagePreferences: string[];
  regionPreference?: string;
  createdAt: Date;
}

const firstNames = [
  // Nguni names
  'Thabo', 'Sipho', 'Mandla', 'Bongani', 'Zanele', 'Noma', 'Thandi', 'Nomsa',
  'Nkosinathi', 'Siphiwe', 'Lungile', 'Ayanda', 'Lindiwe', 'Zinhle', 'Mbali',
  // Sotho-Tswana names
  'Lerato', 'Kgotso', 'Mpho', 'Thato', 'Karabo', 'Rethabile', 'Tshepo', 'Boipelo',
  // Venda/Tsonga names
  'Rofhiwa', 'Pfarelo', 'Azwidowi', 'Mukhethwa', 'Xikombiso', 'Nhlamulo',
  // Gender-neutral/Modern
  'Kai', 'Neo', 'Lebo', 'Refilwe', 'Oratile', 'Naledi', 'Katlego', 'Kagiso',
  // Afrikaans
  'Pieter', 'Johan', 'Annelie', 'Marietjie', 'Francois', 'Elmarie',
  // English/Modern
  'Tumi', 'Sello', 'Gugu', 'Siya', 'Nandi', 'Jabu', 'Noxolo', 'Vusi',
];

const lastNames = [
  // Common SA surnames
  'Dlamini', 'Nkosi', 'Zulu', 'Mthembu', 'Khumalo', 'Mkhize', 'Ntuli', 'Shabalala',
  'Ndlovu', 'Mbatha', 'Cele', 'Ngcobo', 'Sithole', 'Buthelezi', 'Zwane',
  'Mokoena', 'Molefe', 'Mofokeng', 'Mahlangu', 'Nkomo', 'Maseko', 'Radebe',
  'Van der Merwe', 'Botha', 'Pretorius', 'Du Plessis', 'Viljoen', 'Smith',
  'Naidoo', 'Pillay', 'Govender', 'Reddy', 'Chetty',
  'Abrahams', 'Samuels', 'Williams', 'Hendricks', 'Adams',
  'Dube', 'Zungu', 'Gumede', 'Khoza', 'Mnisi', 'Maluleke', 'Chauke',
];

const regions = [
  'Gauteng', 'KZN', 'WC', 'EC', 'Limpopo', 'Mpumalanga', 
  'North West', 'Free State', 'Northern Cape'
];

const languages = [
  'en', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho', 'Setswana', 
  'Sepedi', 'Xitsonga', 'siSwati', 'Tshivenda', 'isiNdebele', 'SASL'
];

const bioTemplates = [
  '{REGION} | {VIBE} | {INTEREST}',
  '{VIBE} soul • {REGION} based',
  '{INTEREST} × {VIBE} | Proudly {REGION}',
  '{REGION} | Living my best {VIBE} life',
  '{INTEREST} • {VIBE} energy • {REGION}',
  null, // 20% have no bio
  null,
];

const vibes = [
  'Creative', 'Artist', 'Visionary', 'Explorer', 'Innovator', 'Dreamer',
  'Rebel', 'Royal', 'Warrior', 'Peaceful', 'Free spirit', 'Entrepreneur',
  'Cultural', 'Modern', 'Future-focused', 'Heritage-proud', 'Renaissance'
];

const interests = [
  'Fashion', 'Music', 'Art', 'Tech', 'Culture', 'Design', 'Photography',
  'Dance', 'Style', 'Heritage', 'Future', 'Community', 'Innovation',
  'Creativity', 'Expression', 'Identity', 'Storytelling'
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateBio(): string | undefined {
  const template = randomChoice(bioTemplates);
  if (!template) return undefined;
  
  return template
    .replace('{REGION}', randomChoice(regions))
    .replace('{VIBE}', randomChoice(vibes))
    .replace('{INTEREST}', randomChoice(interests));
}

function generateUsername(firstName: string, lastName: string, index: number): string {
  const variations = [
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${index}`,
    `${firstName.toLowerCase()}_za`,
    `${lastName.toLowerCase()}_${firstName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 99)}`,
  ];
  
  return randomChoice(variations);
}

export function generateSeedUsers(count: number, tribeIds: Types.ObjectId[]): SeedUser[] {
  const users: SeedUser[] = [];
  const usedUsernames = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    
    let username = generateUsername(firstName, lastName, i);
    let attempts = 0;
    while (usedUsernames.has(username) && attempts < 10) {
      username = generateUsername(firstName, lastName, i + Math.floor(Math.random() * 1000));
      attempts++;
    }
    usedUsernames.add(username);
    
    const displayName = `${firstName} ${lastName}`;
    
    // Generate realistic SA phone number (format: +27 XX XXX XXXX)
    const phoneNumber = `+2771${Math.floor(100 + Math.random() * 900)}${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Assign tribe (evenly distributed)
    const tribeId = tribeIds[i % tribeIds.length];
    
    // Language preferences (1-3 languages)
    const langCount = Math.random() < 0.3 ? 1 : Math.random() < 0.6 ? 2 : 3;
    const languagePreferences = randomChoices(languages, langCount);
    
    // Region preference (70% have one)
    const regionPreference = Math.random() < 0.7 ? randomChoice(regions) : undefined;
    
    const bio = generateBio();
    
    // Stagger creation dates over last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    users.push({
      username,
      displayName,
      phoneNumber,
      tribeId,
      bio,
      languagePreferences,
      regionPreference,
      createdAt,
    });
  }
  
  return users;
}

// Generate user metadata for diversity tracking
export interface UserDemographics {
  ageGroup: '18-25' | '26-35' | '36-45' | '46+';
  primaryLanguage: string;
  region?: string;
  joinDate: Date;
}

export function generateUserDemographics(): UserDemographics {
  const ageDistribution = [
    { group: '18-25', weight: 0.35 },
    { group: '26-35', weight: 0.40 },
    { group: '36-45', weight: 0.18 },
    { group: '46+', weight: 0.07 },
  ] as const;
  
  const rand = Math.random();
  let cumulative = 0;
  let ageGroup: UserDemographics['ageGroup'] = '26-35';
  
  for (const { group, weight } of ageDistribution) {
    cumulative += weight;
    if (rand < cumulative) {
      ageGroup = group;
      break;
    }
  }
  
  return {
    ageGroup,
    primaryLanguage: randomChoice(languages),
    region: Math.random() < 0.7 ? randomChoice(regions) : undefined,
    joinDate: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)),
  };
}


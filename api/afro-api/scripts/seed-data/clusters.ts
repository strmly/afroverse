/**
 * AfroMoji South Africa Seed Library
 * Cultural Clusters and Style DNA
 */

export interface StyleCluster {
  id: string;
  name: string;
  category: 'cultural_root' | 'urban_modern' | 'cross_cultural' | 'onboarding';
  count: number;
  culturalTags: string[];
  languageTags: string[];
  regionTags: string[];
  styleIntensity: 'accessible' | 'editorial' | 'mythic';
  promptTemplate: string;
}

// A) Cultural Root Anchors — 480 images (8 × 60)
export const culturalRootClusters: StyleCluster[] = [
  {
    id: 'ZULU_AUTHENTIC',
    name: 'Zulu',
    category: 'cultural_root',
    count: 60,
    culturalTags: ['Zulu', 'Nguni', 'amaZulu', 'isibheshu', 'isicholo', 'beadwork', 'ceremonial'],
    languageTags: ['isiZulu', 'en'],
    regionTags: ['KZN', 'Gauteng'],
    styleIntensity: 'accessible',
    promptTemplate: 'Authentic Zulu person wearing traditional isibheshu (leather skirt), isicholo (married woman headdress) or warrior regalia, intricate beadwork patterns in traditional Zulu colors (black, white, red, blue), ceremonial accessories, authentic Zulu cultural context, {MODERN_LAYER}, respectful authentic representation, natural lighting',
  },
  {
    id: 'XHOSA_AUTHENTIC',
    name: 'Xhosa',
    category: 'cultural_root',
    count: 60,
    culturalTags: ['Xhosa', 'amaXhosa', 'Nguni', 'umqhele', 'intsimbi', 'ochre', 'beadwork', 'initiation'],
    languageTags: ['isiXhosa', 'en'],
    regionTags: ['EC', 'WC'],
    styleIntensity: 'accessible',
    promptTemplate: 'Authentic Xhosa person with traditional ochre face paint (umqhele), white beaded accessories (intsimbi), traditional Xhosa attire, authentic Xhosa cultural context, ceremonial elements, {MODERN_LAYER}, respectful authentic representation, golden hour lighting',
  },
  {
    id: 'NDEBELE_AUTHENTIC',
    name: 'Ndebele',
    category: 'cultural_root',
    count: 60,
    culturalTags: ['Ndebele', 'amaNdebele', 'Nguni', 'geometric patterns', 'house painting', 'beadwork'],
    languageTags: ['isiNdebele', 'en'],
    regionTags: ['Mpumalanga', 'Limpopo'],
    styleIntensity: 'editorial',
    promptTemplate: 'Authentic Ndebele person wearing traditional Ndebele geometric patterns, vibrant color blocks (turquoise, pink, yellow, black, white), traditional Ndebele beadwork and accessories, authentic Ndebele cultural context, {MODERN_LAYER}, high-fashion editorial styling with cultural authenticity',
  },
  {
    id: 'SWATI_AUTHENTIC',
    name: 'Swati',
    category: 'cultural_root',
    count: 60,
    culturalTags: ['Swati', 'emaSwati', 'Nguni', 'lihhiya', 'emahiya', 'traditional textiles', 'beadwork'],
    languageTags: ['siSwati', 'en'],
    regionTags: ['Mpumalanga', 'KZN'],
    styleIntensity: 'accessible',
    promptTemplate: 'Authentic Swati person wearing traditional Swati textiles (lihhiya, emahiya), traditional Swati beadwork and accessories, authentic Swati cultural context, ceremonial elements, {MODERN_LAYER}, respectful authentic representation, soft natural lighting',
  },
  {
    id: 'SOTHO_TSWANA_SEPEDI_AUTHENTIC',
    name: 'Sesotho/Setswana/Sepedi',
    category: 'cultural_root',
    count: 60,
    culturalTags: ['Basotho', 'Sesotho', 'Setswana', 'Sepedi', 'mokorotlo', 'blanket', 'traditional attire'],
    languageTags: ['Sesotho', 'Setswana', 'Sepedi', 'en'],
    regionTags: ['Free State', 'North West', 'Limpopo'],
    styleIntensity: 'accessible',
    promptTemplate: 'Authentic Basotho/Setswana/Sepedi person wearing traditional Basotho blanket (Seanamarena), mokorotlo hat, traditional Sotho-Tswana attire, earth-tone palette, authentic cultural context, {MODERN_LAYER}, respectful authentic representation, warm natural lighting',
  },
  {
    id: 'TSONGA_AUTHENTIC',
    name: 'Tsonga',
    category: 'cultural_root',
    count: 60,
    culturalTags: ['Tsonga', 'Shangaan', 'Vatsonga', 'xibelani', 'traditional dance', 'beadwork'],
    languageTags: ['Xitsonga', 'en'],
    regionTags: ['Limpopo', 'Mpumalanga'],
    styleIntensity: 'accessible',
    promptTemplate: 'Authentic Tsonga person wearing traditional xibelani (colorful skirt), Tsonga traditional attire, vibrant Tsonga textile patterns, traditional Tsonga beadwork and accessories, authentic Tsonga cultural context, {MODERN_LAYER}, respectful authentic representation, dynamic lighting',
  },
  {
    id: 'VENDA_AUTHENTIC',
    name: 'Venda',
    category: 'cultural_root',
    count: 60,
    culturalTags: ['Venda', 'Vhavenda', 'python motifs', 'sacred lake', 'traditional patterns', 'ceremonial'],
    languageTags: ['Tshivenda', 'en'],
    regionTags: ['Limpopo'],
    styleIntensity: 'editorial',
    promptTemplate: 'Authentic Venda person wearing traditional Venda attire with python-inspired motifs, traditional Venda patterns and beadwork, authentic Venda cultural context, ceremonial elements, {MODERN_LAYER}, respectful authentic representation, ethereal lighting',
  },
  {
    id: 'KHOI_SAN_AUTHENTIC',
    name: 'Khoi/Khoisan',
    category: 'cultural_root',
    count: 60,
    culturalTags: ['Khoi', 'Khoisan', 'San', 'Bushman', 'traditional hunter-gatherer', 'indigenous'],
    languageTags: ['Khoekhoe', 'en'],
    regionTags: ['NC', 'WC', 'EC'],
    styleIntensity: 'accessible',
    promptTemplate: 'Authentic Khoi/Khoisan person wearing traditional Khoisan attire, traditional Khoisan accessories and adornments, authentic Khoisan cultural context, connection to land and heritage, {MODERN_LAYER}, respectful authentic representation, natural outdoor lighting',
  },
];

// B) Urban Modern SA — 360 images (6 × 60)
export const urbanModernClusters: StyleCluster[] = [
  {
    id: 'AMAPIANO_ROYALTY',
    name: 'Amapiano Royalty',
    category: 'urban_modern',
    count: 60,
    culturalTags: ['amapiano', 'nightlife', 'club culture'],
    languageTags: ['en', 'isiZulu', 'Sesotho'],
    regionTags: ['Gauteng', 'Pretoria', 'Johannesburg'],
    styleIntensity: 'editorial',
    promptTemplate: 'South African persona in amapiano nightlife editorial style, luxury streetwear, bold jewelry, confidence, neon-accented studio lighting, club aesthetic, premium fashion',
  },
  {
    id: 'AFROTECH_JOBURG',
    name: 'Afro-tech Johannesburg',
    category: 'urban_modern',
    count: 60,
    culturalTags: ['cyberpunk', 'afrofuturism', 'tech'],
    languageTags: ['en', 'isiZulu', 'Sepedi'],
    regionTags: ['Gauteng', 'Johannesburg'],
    styleIntensity: 'mythic',
    promptTemplate: 'South African persona in afrofuturist cyberpunk style, techwear elements, neon city backdrop, Johannesburg skyline vibes, holographic accents, sci-fi premium aesthetic',
  },
  {
    id: 'CAPE_COASTAL_LUXURY',
    name: 'Cape Town Coastal Luxury',
    category: 'urban_modern',
    count: 60,
    culturalTags: ['coastal', 'minimalist', 'luxury'],
    languageTags: ['en', 'Afrikaans', 'isiXhosa'],
    regionTags: ['WC', 'Cape Town'],
    styleIntensity: 'editorial',
    promptTemplate: 'South African persona in Cape Town coastal luxury style, minimalist linen and natural fabrics, ocean-inspired color palette, premium resort aesthetic, soft golden hour lighting',
  },
  {
    id: 'DURBAN_FESTIVAL',
    name: 'Durban Heatwave Festival',
    category: 'urban_modern',
    count: 60,
    culturalTags: ['festival', 'beach culture', 'tropical'],
    languageTags: ['en', 'isiZulu', 'isiXhosa'],
    regionTags: ['KZN', 'Durban'],
    styleIntensity: 'accessible',
    promptTemplate: 'South African persona in Durban festival style, tropical beach vibes, colorful summer fashion, surf culture influence, warm sunset lighting, coastal energy',
  },
  {
    id: 'STREETWEAR_HERITAGE',
    name: 'Streetwear × Heritage Fusion',
    category: 'urban_modern',
    count: 60,
    culturalTags: ['streetwear', 'heritage fusion', 'contemporary'],
    languageTags: ['en', 'isiZulu', 'Sesotho', 'Setswana'],
    regionTags: ['Gauteng', 'KZN', 'WC'],
    styleIntensity: 'accessible',
    promptTemplate: 'South African persona blending modern streetwear with heritage beadwork and textile accents, contemporary urban style, cultural pride, natural lighting, editorial street style',
  },
  {
    id: 'SPORT_DRIP_CULTURE',
    name: 'Sport Drip Culture',
    category: 'urban_modern',
    count: 60,
    culturalTags: ['sport', 'athletic', 'drip'],
    languageTags: ['en', 'isiZulu', 'Afrikaans', 'Sesotho'],
    regionTags: ['Gauteng', 'KZN', 'WC'],
    styleIntensity: 'accessible',
    promptTemplate: 'South African persona in sport-inspired drip culture style, athletic luxury fashion, green and gold color accents, confident stance, stadium or urban backdrop, premium sportswear aesthetic',
  },
];

// C) Cross-cultural Blends — 160 images (8 × 20)
export const crossCulturalClusters: StyleCluster[] = [
  {
    id: 'NDEBELE_TECHWEAR',
    name: 'Ndebele Geometry × Techwear',
    category: 'cross_cultural',
    count: 20,
    culturalTags: ['Ndebele', 'techwear', 'fusion'],
    languageTags: ['isiNdebele', 'en'],
    regionTags: ['Mpumalanga', 'Gauteng'],
    styleIntensity: 'mythic',
    promptTemplate: 'South African persona fusing authentic Ndebele geometric patterns with futuristic techwear, traditional Ndebele color blocks integrated into cyberpunk fashion, high-fashion editorial, neon lighting',
  },
  {
    id: 'SOTHO_BLANKET_FUTURIST',
    name: 'Sesotho Blanket × Futurist Armor',
    category: 'cross_cultural',
    count: 20,
    culturalTags: ['Basotho', 'Sesotho', 'futurism', 'armor'],
    languageTags: ['Sesotho', 'en'],
    regionTags: ['Free State', 'Gauteng'],
    styleIntensity: 'mythic',
    promptTemplate: 'South African persona with authentic Basotho blanket (Seanamarena) silhouettes transformed into futuristic armor, traditional earth tones with metallic accents, sci-fi warrior aesthetic, dramatic lighting',
  },
  {
    id: 'XHOSA_HAUTE_COUTURE',
    name: 'Xhosa Beadwork × High Fashion Runway',
    category: 'cross_cultural',
    count: 20,
    culturalTags: ['Xhosa', 'haute couture', 'runway'],
    languageTags: ['isiXhosa', 'en'],
    regionTags: ['EC', 'WC', 'Gauteng'],
    styleIntensity: 'editorial',
    promptTemplate: 'South African persona with authentic Xhosa beadwork color palette and patterns integrated into high-fashion runway couture, traditional Xhosa elements in avant-garde silhouettes, premium editorial styling, studio lighting',
  },
  {
    id: 'VENDA_SCIFI_REGAL',
    name: 'Venda Patterns × Sci-Fi Regal',
    category: 'cross_cultural',
    count: 20,
    culturalTags: ['Venda', 'sci-fi', 'regal'],
    languageTags: ['Tshivenda', 'en'],
    regionTags: ['Limpopo', 'Gauteng'],
    styleIntensity: 'mythic',
    promptTemplate: 'South African persona with authentic Venda mystical patterns and python motifs in sci-fi regal attire, traditional Venda elements as holographic accents, otherworldly royal aesthetic, ethereal lighting',
  },
  {
    id: 'ZULU_WARRIOR_MODERN',
    name: 'Zulu Warrior × Modern Tactical',
    category: 'cross_cultural',
    count: 20,
    culturalTags: ['Zulu', 'warrior', 'tactical'],
    languageTags: ['isiZulu', 'en'],
    regionTags: ['KZN', 'Gauteng'],
    styleIntensity: 'editorial',
    promptTemplate: 'South African persona blending authentic Zulu warrior aesthetics and ceremonial beadwork with modern tactical gear, traditional Zulu elements on contemporary armor, powerful stance, dramatic lighting',
  },
  {
    id: 'TSONGA_DANCE_URBAN',
    name: 'Tsonga Dance × Urban Movement',
    category: 'cross_cultural',
    count: 20,
    culturalTags: ['Tsonga', 'dance', 'urban'],
    languageTags: ['Xitsonga', 'en'],
    regionTags: ['Limpopo', 'Gauteng'],
    styleIntensity: 'accessible',
    promptTemplate: 'South African persona combining authentic Tsonga dance movement and xibelani with urban contemporary fashion, traditional Tsonga vibrant colors, dynamic pose, street photography style',
  },
  {
    id: 'CAPE_MALAY_FUSION',
    name: 'Cape Malay × Contemporary Luxury',
    category: 'cross_cultural',
    count: 20,
    culturalTags: ['Cape Malay-inspired', 'contemporary', 'luxury'],
    languageTags: ['en', 'Afrikaans'],
    regionTags: ['WC', 'Cape Town'],
    styleIntensity: 'editorial',
    promptTemplate: 'South African persona with Cape Malay-inspired colorful patterns in contemporary luxury fashion, rich jewel tones, elegant styling, soft studio lighting',
  },
  {
    id: 'MULTI_HERITAGE_PRIDE',
    name: 'Multi-Heritage Pride',
    category: 'cross_cultural',
    count: 20,
    culturalTags: ['multicultural', 'rainbow nation', 'unity'],
    languageTags: ['en', 'isiZulu', 'Afrikaans', 'isiXhosa'],
    regionTags: ['Gauteng', 'WC', 'KZN'],
    styleIntensity: 'accessible',
    promptTemplate: 'South African persona celebrating multicultural heritage, blend of various SA cultural elements in harmonious contemporary style, inclusive aesthetic, natural lighting',
  },
];

// D) Welcome Home Onboarding — 0 images (focus on deep cultural authenticity)
export const onboardingClusters: StyleCluster[] = [
  {
    id: 'WELCOME_HOME_MIX',
    name: 'Welcome Home Collection',
    category: 'onboarding',
    count: 0,
    culturalTags: ['diverse', 'welcoming', 'inclusive'],
    languageTags: ['en', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho', 'Setswana'],
    regionTags: ['all'],
    styleIntensity: 'accessible',
    promptTemplate: 'South African persona in {STYLE_MIX}, designed for instant belonging, diverse and welcoming aesthetic, premium yet approachable, natural lighting',
  },
];

// All clusters combined
export const allClusters = [
  ...culturalRootClusters,
  ...urbanModernClusters,
  ...crossCulturalClusters,
  ...onboardingClusters,
];

// Modern layer variations for prompts
export const modernLayers = [
  'contemporary fashion',
  'modern techwear fusion',
  'urban streetwear elements',
  'minimalist contemporary styling',
  'high-fashion editorial twist',
  'futuristic design elements',
  'luxury modern accessories',
  'neo-traditional blend',
];

// Diversity variation axes
export interface DiversityProfile {
  skinTone: string;
  age: string;
  gender: string;
  hair: string;
  mood: string;
  composition: string;
  background: string;
  lighting: string;
}

export const diversityProfiles: Partial<DiversityProfile>[] = [
  // Skin tones
  { skinTone: 'deep mahogany' },
  { skinTone: 'rich brown' },
  { skinTone: 'warm bronze' },
  { skinTone: 'golden tan' },
  { skinTone: 'light brown' },
  { skinTone: 'olive' },
  
  // Ages
  { age: 'young adult (18-25)' },
  { age: 'mid twenties' },
  { age: 'early thirties' },
  { age: 'late thirties' },
  { age: 'mature adult (40s)' },
  
  // Gender expressions
  { gender: 'feminine' },
  { gender: 'masculine' },
  { gender: 'androgynous' },
  
  // Hair
  { hair: 'natural coils' },
  { hair: 'short locs' },
  { hair: 'long locs' },
  { hair: 'braids' },
  { hair: 'fade cut' },
  { hair: 'shaved head' },
  { hair: 'head wrap' },
  { hair: 'natural afro' },
  
  // Moods
  { mood: 'confident' },
  { mood: 'serene' },
  { mood: 'powerful' },
  { mood: 'joyful' },
  { mood: 'contemplative' },
  { mood: 'regal' },
  
  // Compositions
  { composition: 'portrait headshot' },
  { composition: 'three-quarter body shot' },
  { composition: 'upper body portrait' },
  
  // Backgrounds
  { background: 'soft studio backdrop' },
  { background: 'urban cityscape' },
  { background: 'natural outdoor setting' },
  { background: 'abstract gradient' },
  { background: 'minimalist solid color' },
  
  // Lighting
  { lighting: 'soft editorial lighting' },
  { lighting: 'golden hour natural light' },
  { lighting: 'dramatic studio lighting' },
  { lighting: 'neon city lights' },
  { lighting: 'warm natural lighting' },
];

// Negative prompt (always applied)
export const safetyNegativePrompt = 
  'no caricature, no exaggerated facial features, no racist stereotypes, no poverty depiction, ' +
  'no sexualization, no minors, no political propaganda, no sacred regalia, no weapons, ' +
  'no distorted faces, no uncanny valley, no offensive imagery, no hateful symbols, ' +
  'no copyrighted brands, no text overlays, high quality, realistic skin texture';


/**
 * Prompt Builder for AfroMoji Seed Generation
 * Combines clusters, diversity profiles, and safety constraints
 */

import {
  StyleCluster,
  modernLayers,
  diversityProfiles,
  DiversityProfile,
  safetyNegativePrompt,
} from './clusters';

export interface GenerationPrompt {
  seedId: string;
  clusterId: string;
  clusterName: string;
  prompt: string;
  negativePrompt: string;
  styleDNA: StyleDNA;
  metadata: SeedMetadata;
}

export interface StyleDNA {
  basePalette: string[];
  patternMotifs: string[];
  wardrobeSilhouette: string;
  lightingProfile: string;
  backgroundProfile: string;
  culturalInspiration: string[];
  modernElements: string[];
}

export interface SeedMetadata {
  culturalTags: string[];
  languageTags: string[];
  regionTags: string[];
  styleIntensity: 'accessible' | 'editorial' | 'mythic';
  category: string;
  diversityProfile: Partial<DiversityProfile>;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function selectDiversityAttributes(): Partial<DiversityProfile> {
  // Select one from each category for variety
  const profiles = diversityProfiles;
  
  return {
    skinTone: randomChoice(profiles.filter(p => p.skinTone).map(p => p.skinTone!)),
    age: randomChoice(profiles.filter(p => p.age).map(p => p.age!)),
    gender: randomChoice(profiles.filter(p => p.gender).map(p => p.gender!)),
    hair: randomChoice(profiles.filter(p => p.hair).map(p => p.hair!)),
    mood: randomChoice(profiles.filter(p => p.mood).map(p => p.mood!)),
    composition: randomChoice(profiles.filter(p => p.composition).map(p => p.composition!)),
    background: randomChoice(profiles.filter(p => p.background).map(p => p.background!)),
    lighting: randomChoice(profiles.filter(p => p.lighting).map(p => p.lighting!)),
  };
}

function generateStyleDNA(cluster: StyleCluster, diversity: Partial<DiversityProfile>): StyleDNA {
  // Extract style DNA from cluster and diversity profile
  const basePalette = extractPalette(cluster);
  const patternMotifs = extractMotifs(cluster);
  
  return {
    basePalette,
    patternMotifs,
    wardrobeSilhouette: extractSilhouette(cluster),
    lightingProfile: diversity.lighting || 'soft editorial lighting',
    backgroundProfile: diversity.background || 'soft studio backdrop',
    culturalInspiration: cluster.culturalTags,
    modernElements: [randomChoice(modernLayers)],
  };
}

function extractPalette(cluster: StyleCluster): string[] {
  const palettes: Record<string, string[]> = {
    ZULU_INSPIRED: ['#000000', '#FFFFFF', '#C41E3A', '#0047AB'],
    XHOSA_INSPIRED: ['#D2691E', '#FFFFFF', '#8B4513', '#F5DEB3'],
    NDEBELE_INSPIRED: ['#00CED1', '#FF69B4', '#FFD700', '#000000'],
    SWATI_INSPIRED: ['#8B0000', '#FFD700', '#000000', '#FFFFFF'],
    SOTHO_TSWANA_SEPEDI: ['#8B4513', '#CD853F', '#DEB887', '#F5DEB3'],
    TSONGA_INSPIRED: ['#FF6347', '#FFD700', '#4169E1', '#32CD32'],
    VENDA_INSPIRED: ['#4B0082', '#9370DB', '#F5DEB3', '#8B4513'],
    AMAPIANO_ROYALTY: ['#FFD700', '#000000', '#FF1493', '#00CED1'],
    AFROTECH_JOBURG: ['#00FFFF', '#FF00FF', '#808080', '#000000'],
    CAPE_COASTAL_LUXURY: ['#F5F5DC', '#87CEEB', '#FFFFFF', '#D2B48C'],
    DURBAN_FESTIVAL: ['#FF6347', '#FFD700', '#00CED1', '#FF69B4'],
    STREETWEAR_HERITAGE: ['#000000', '#FFFFFF', '#FF6347', '#4169E1'],
    SPORT_DRIP_CULTURE: ['#008000', '#FFD700', '#000000', '#FFFFFF'],
  };
  
  return palettes[cluster.id] || ['#000000', '#FFFFFF', '#FFD700', '#4169E1'];
}

function extractMotifs(cluster: StyleCluster): string[] {
  const motifs: Record<string, string[]> = {
    ZULU_INSPIRED: ['beadwork', 'geometric patterns', 'shield motifs'],
    XHOSA_INSPIRED: ['ochre details', 'white beading', 'linear patterns'],
    NDEBELE_INSPIRED: ['bold geometric shapes', 'color blocks', 'symmetrical patterns'],
    SWATI_INSPIRED: ['feather motifs', 'beadwork', 'traditional textiles'],
    SOTHO_TSWANA_SEPEDI: ['blanket patterns', 'earth tones', 'mokorotlo inspiration'],
    TSONGA_INSPIRED: ['xibelani patterns', 'dance-inspired', 'vibrant textiles'],
    VENDA_INSPIRED: ['python motifs', 'sacred symbols', 'mystical patterns'],
    AMAPIANO_ROYALTY: ['luxury jewelry', 'bold accessories', 'club aesthetic'],
    AFROTECH_JOBURG: ['holographic elements', 'circuit patterns', 'neon accents'],
    CAPE_COASTAL_LUXURY: ['minimalist lines', 'natural textures', 'ocean-inspired'],
    DURBAN_FESTIVAL: ['tropical prints', 'beach culture', 'festival energy'],
    STREETWEAR_HERITAGE: ['streetwear silhouettes', 'cultural accents', 'urban style'],
    SPORT_DRIP_CULTURE: ['athletic details', 'team colors', 'sporty luxury'],
  };
  
  return motifs[cluster.id] || ['contemporary', 'modern', 'stylish'];
}

function extractSilhouette(cluster: StyleCluster): string {
  const silhouettes: Record<string, string> = {
    ZULU_INSPIRED: 'traditional-inspired with modern fit',
    XHOSA_INSPIRED: 'elegant draped fabrics',
    NDEBELE_INSPIRED: 'structured geometric forms',
    SWATI_INSPIRED: 'traditional textiles in contemporary cut',
    SOTHO_TSWANA_SEPEDI: 'blanket-inspired layering',
    TSONGA_INSPIRED: 'flowing dance-ready silhouettes',
    VENDA_INSPIRED: 'mystical elegant forms',
    AMAPIANO_ROYALTY: 'luxury streetwear',
    AFROTECH_JOBURG: 'futuristic techwear',
    CAPE_COASTAL_LUXURY: 'minimalist resort wear',
    DURBAN_FESTIVAL: 'casual tropical festival',
    STREETWEAR_HERITAGE: 'urban contemporary',
    SPORT_DRIP_CULTURE: 'athletic luxury',
  };
  
  return silhouettes[cluster.id] || 'contemporary modern';
}

export function buildPrompt(
  cluster: StyleCluster,
  index: number,
  totalInCluster: number
): GenerationPrompt {
  const seedId = `SA_${String(index).padStart(4, '0')}`;
  
  // Select diversity attributes
  const diversity = selectDiversityAttributes();
  
  // For cultural_root clusters, emphasize authenticity and remove modern layer
  // For other clusters, add modern layer
  let basePrompt = cluster.promptTemplate;
  
  if (cluster.category === 'cultural_root') {
    // Deep cultural authenticity - remove {MODERN_LAYER} or make it subtle
    basePrompt = basePrompt.replace('{MODERN_LAYER}', 'contemporary context while maintaining deep cultural authenticity');
  } else {
    // For urban/cross-cultural, keep modern layer
    const modernLayer = randomChoice(modernLayers);
    basePrompt = basePrompt.replace('{MODERN_LAYER}', modernLayer);
  }
  
  // For onboarding, add specific style mix
  if (cluster.category === 'onboarding') {
    const styleMix = index % 2 === 0 ? 'accessible contemporary style' : 'editorial premium aesthetic';
    basePrompt = basePrompt.replace('{STYLE_MIX}', styleMix);
  }
  
  // Build full prompt with diversity attributes
  const diversityDetails = [
    diversity.skinTone && `${diversity.skinTone} skin tone`,
    diversity.age && `${diversity.age} years old`,
    diversity.gender && `${diversity.gender} expression`,
    diversity.hair && `${diversity.hair} hairstyle`,
    diversity.mood && `${diversity.mood} mood`,
  ].filter(Boolean).join(', ');
  
  const compositionDetail = diversity.composition || 'portrait';
  const backgroundDetail = diversity.background || 'soft studio backdrop';
  const lightingDetail = diversity.lighting || 'soft editorial lighting';
  
  // For cultural_root, emphasize authenticity
  const authenticityEmphasis = cluster.category === 'cultural_root' 
    ? 'deeply authentic cultural representation, traditional elements, cultural pride, authentic context'
    : '';
  
  const fullPrompt = [
    basePrompt,
    diversityDetails,
    compositionDetail,
    backgroundDetail,
    lightingDetail,
    authenticityEmphasis,
    'high quality, professional photography, realistic skin texture, sharp focus, detailed',
    '85mm lens aesthetic, photorealistic, premium editorial style'
  ].filter(Boolean).join(', ');
  
  // Generate style DNA
  const styleDNA = generateStyleDNA(cluster, diversity);
  
  // Build metadata
  const metadata: SeedMetadata = {
    culturalTags: cluster.culturalTags,
    languageTags: cluster.languageTags,
    regionTags: cluster.regionTags,
    styleIntensity: cluster.styleIntensity,
    category: cluster.category,
    diversityProfile: diversity,
  };
  
  return {
    seedId,
    clusterId: cluster.id,
    clusterName: cluster.name,
    prompt: fullPrompt,
    negativePrompt: safetyNegativePrompt,
    styleDNA,
    metadata,
  };
}

// Build all prompts for seeding
export function buildAllPrompts(clusters: StyleCluster[]): GenerationPrompt[] {
  const prompts: GenerationPrompt[] = [];
  let globalIndex = 1;
  
  for (const cluster of clusters) {
    for (let i = 0; i < cluster.count; i++) {
      const prompt = buildPrompt(cluster, globalIndex, cluster.count);
      prompts.push(prompt);
      globalIndex++;
    }
  }
  
  return prompts;
}


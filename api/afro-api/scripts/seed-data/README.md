# AfroMoji South Africa Seed Library

## Overview

This seeding system creates a foundational content library of **1,000 culturally diverse South African transformation images** with **1,000 corresponding user profiles**. The seed library is designed to:

1. **Ensure instant belonging** - Users see "someone like me" immediately
2. **Enable "Try This Style"** - Every post has reusable style DNA
3. **Celebrate diversity** - Coverage across SA's cultural, linguistic, and regional spectrum
4. **Maintain cultural safety** - Respectful "inspired" language, no stereotypes

---

## Architecture

### Components

```
seed-data/
├── clusters.ts           # Cultural cluster definitions (420+360+160+60)
├── user-generator.ts     # Generates 1000 diverse user profiles
├── prompt-builder.ts     # Combines clusters + diversity → prompts
└── README.md            # This file

scripts/
└── seed-sa-database.ts  # Main orchestration script
```

---

## Content Distribution

### Total: 1,000 Posts

#### A) Cultural Root Anchors — 420 posts (7 clusters × 60)
- **Zulu-inspired** (60) - Nguni ceremonial beadwork aesthetics
- **Xhosa-inspired** (60) - Ochre and white beading traditions
- **Ndebele-inspired** (60) - Bold geometric patterns
- **Swati-inspired** (60) - Traditional textile patterns
- **Sesotho/Setswana/Sepedi-inspired** (60) - Blanket silhouettes
- **Tsonga-inspired** (60) - Vibrant dance-inspired textiles
- **Venda-inspired** (60) - Mystical python motifs

#### B) Urban Modern SA — 360 posts (6 clusters × 60)
- **Amapiano Royalty** (60) - Nightlife luxury streetwear
- **Afro-tech Johannesburg** (60) - Cyberpunk futurism
- **Cape Town Coastal Luxury** (60) - Minimalist resort aesthetic
- **Durban Heatwave Festival** (60) - Tropical beach culture
- **Streetwear × Heritage Fusion** (60) - Contemporary urban pride
- **Sport Drip Culture** (60) - Athletic luxury, national colors

#### C) Cross-Cultural Blends — 160 posts (8 clusters × 20)
- Ndebele Geometry × Techwear (20)
- Sesotho Blanket × Futurist Armor (20)
- Xhosa Beadwork × High Fashion Runway (20)
- Venda Patterns × Sci-Fi Regal (20)
- Zulu Warrior × Modern Tactical (20)
- Tsonga Dance × Urban Movement (20)
- Cape Malay × Contemporary Luxury (20)
- Multi-Heritage Pride (20)

#### D) Welcome Home Onboarding — 60 posts
- Curated mix for instant belonging in first session

---

## Diversity Axes

Each cluster deliberately varies across:

### Identity Diversity
- **Skin tones**: Deep mahogany → light brown (6+ variations)
- **Ages**: 18-25, 26-35, 36-45, 46+ (weighted distribution)
- **Gender expressions**: Feminine, masculine, androgynous
- **Hair**: Natural coils, locs, braids, shaved, wraps, afro

### Visual Variety
- **Compositions**: Portrait (70%), ¾ body (30%)
- **Backgrounds**: Studio (50%), urban (20%), natural (20%), abstract (10%)
- **Lighting**: Soft editorial, golden hour, dramatic, neon

### Style Intensity
- **Accessible** (wearable, relatable): 50%
- **Editorial** (premium, aspirational): 35%
- **Mythic** (viral, fantasy): 15%

---

## Language & Region Coverage

### 12 Official SA Languages
- English (`en`)
- isiZulu (`isiZulu`)
- isiXhosa (`isiXhosa`)
- Afrikaans (`Afrikaans`)
- Sesotho (`Sesotho`)
- Setswana (`Setswana`)
- Sepedi (`Sepedi`)
- Xitsonga (`Xitsonga`)
- siSwati (`siSwati`)
- Tshivenda (`Tshivenda`)
- isiNdebele (`isiNdebele`)
- SASL (`SASL`)

### 9 Provinces
- Gauteng, KZN, Western Cape, Eastern Cape, Limpopo, Mpumalanga, North West, Free State, Northern Cape

---

## Style DNA System

Each post includes reusable **Style DNA** for "Try This Style":

```typescript
interface StyleDNA {
  basePalette: string[];           // 4 hex colors
  patternMotifs: string[];         // Cultural/style patterns
  wardrobeSilhouette: string;      // Clothing style
  lightingProfile: string;         // Lighting aesthetic
  backgroundProfile: string;       // Scene/backdrop
  culturalInspiration: string[];   // Source tags
  modernElements: string[];        // Contemporary twists
}
```

---

## Safety & Cultural Respect

### Prompt Safety (Always Applied)
```
no caricature, no exaggerated facial features, no racist stereotypes, 
no poverty depiction, no sexualization, no minors, no political propaganda, 
no sacred regalia, no weapons, high quality, realistic skin texture
```

### Language Policy
- Use **"inspired"** language (e.g., "Zulu-inspired")
- **Never claim** absolute authenticity
- **Avoid** reducing groups to clichés
- **Include** modern + traditional blend

### Cultural Review Checkpoints
Before publishing (in production):
- [ ] Respectful depiction
- [ ] No stereotype cues
- [ ] Premium style quality
- [ ] Face realism
- [ ] No minors
- [ ] No political messaging
- [ ] No copyrighted brands/symbols

---

## Usage

### Run Seeding Script

```bash
# Preview (safe, shows what will happen)
cd afro-api
npm run seed-sa

# Actually execute
npm run seed-sa -- --confirm
```

### Expected Output
```
🌍 AfroMoji South Africa Database Seeding
============================================================
Target: 1000 users, 1000 posts

✅ Connected to database
✅ Found 5 tribes

👥 Step 1: Generating users...
   Progress: 1000/1000 users
✅ Users created

🎨 Step 2: Building generation prompts...
   Generated 1000 prompts across 16 clusters
   
   Distribution by cluster:
   - ZULU_INSPIRED: 60
   - XHOSA_INSPIRED: 60
   ... (full list)

🖼️  Step 3: Creating generations and posts...
   Progress: 1000/1000 posts
✅ Generations and posts created

============================================================
✅ Seeding Complete!
============================================================
Users created:       1000
Generations created: 1000
Posts created:       1000
Errors:              0
Duration:            45s
============================================================
```

---

## Important Notes

### 🚨 Database Records Only
This script creates **database records** with placeholder image paths.

**It does NOT generate actual AI images.**

To generate real images:
1. Use your AI generation service (Gemini, Replicate, etc.)
2. Follow the prompts from `buildAllPrompts()`
3. Upload images to GCS
4. Update database records with real signed URLs

### 📦 What Gets Created

**Users:**
- 1000 diverse SA profiles
- Realistic names, usernames, phone numbers
- Language preferences, region tags
- Staggered join dates (last 90 days)

**Generations:**
- Complete generation records
- Prompt + negative prompt
- Style DNA metadata
- Cultural/language/region tags
- Status: `complete`

**Posts:**
- Public feed posts (80% public, 20% tribe)
- Linked to users and generations
- Initial engagement (random respects)
- Captions (60% have captions)
- Seed metadata for feed algorithms

---

## Integration with Feed System

### Cold Start Personalization

Onboarding captures:
- **Languages** (from 12 SA official)
- **Region** (optional)
- **Style vibe** (Warrior/Royal/Futurist/etc.)

Feed then pulls:
- 30% from matching language/culture clusters
- 40% from urban modern SA
- 20% from cross-cultural blends
- 10% mythic/viral

### Inclusion Guarantee

First 20 feed items **must include**:
- ✅ 4 different clusters
- ✅ 3 different skin tones
- ✅ 2 age groups
- ✅ 2 gender expressions

---

## Extending the System

### Adding New Clusters

```typescript
// In clusters.ts
export const newCluster: StyleCluster = {
  id: 'YOUR_CLUSTER_ID',
  name: 'Display Name',
  category: 'cultural_root' | 'urban_modern' | 'cross_cultural',
  count: 60,
  culturalTags: ['tag1', 'tag2'],
  languageTags: ['en', 'isiZulu'],
  regionTags: ['Gauteng'],
  styleIntensity: 'accessible',
  promptTemplate: 'Your prompt with {MODERN_LAYER} placeholder...',
};

// Add to allClusters array
export const allClusters = [
  ...culturalRootClusters,
  ...urbanModernClusters,
  ...crossCulturalClusters,
  ...onboardingClusters,
  newCluster, // Add here
];
```

### Adjusting Distribution

Edit `count` in cluster definitions:
- More accessible: Increase count for accessible clusters
- More regional: Increase specific region clusters
- More traditional: Increase cultural root counts

---

## Production Checklist

Before running in production:

- [ ] Review all cluster definitions for cultural accuracy
- [ ] Test prompt generation on sample batches
- [ ] Set up cultural review board
- [ ] Configure AI generation service
- [ ] Set up GCS bucket structure
- [ ] Test "Try This Style" with seed posts
- [ ] Monitor feed distribution analytics
- [ ] Collect user feedback on belonging/representation

---

## Support & Questions

For questions about:
- **Cultural accuracy**: Consult with cultural advisors
- **Technical issues**: Check script logs, database connection
- **Content moderation**: Review safety prompt constraints
- **Feed algorithms**: See feed service documentation

---

**Built with respect for South Africa's rich cultural tapestry** 🇿🇦


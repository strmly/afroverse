# AfroMoji Web Application

> **BECOME • BELONG • WITNESS**

An identity-first AI transformation platform celebrating African culture, heritage, and community.

---

## 🎨 What's Been Built

### Complete UI Implementation
Following the detailed Information Architecture specification, this implementation includes:

#### ✅ Core Screens
- **Home** (`/`) - Smart router with loading state
- **Onboarding** (`/onboarding`) - Welcome + tribe selection
- **Create** (`/create`) - AI transformation canvas (70/30 split layout)
- **Feed** (`/feed`) - Full-screen immersive feed with swipe navigation
- **Tribe** (`/tribe/[slug]`) - Cultural home with tabs (Posts, Members, About)
- **Profile** (`/profile`) - Identity archive with earned aesthetic
- **Post Viewer** (`/post/[id]`) - Deep-dive modal view

#### ✅ Navigation System
- **Bottom Navigation** - Minimal, icons-only, with elevated Create button
- Auto-hide behavior on scroll
- Active state morphing animations
- Safe area aware for notched devices

#### ✅ Design System
- **Tokens** - Complete design token system (colors, spacing, typography, etc.)
- **Animations** - 20+ animations with reduced-motion support
- **Components** - 10+ reusable UI components
- **Tribe Theming** - Dynamic color system for 5 tribes

#### ✅ Identity Gating
- Enforced authentication flow
- Identity-based access control
- Automatic redirects based on completion state
- `useAuth` hook managing all logic

#### ✅ Component Library
- Icon (13 custom icons)
- Button (3 variants, 3 sizes)
- Avatar (with tribe badge overlay)
- Modal & Sheet
- Toast notifications
- Skeleton loaders

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📐 Architecture Highlights

### Mental Model: BECOME → BELONG → WITNESS

| State   | Screen             | Purpose                |
| ------- | ------------------ | ---------------------- |
| Become  | Create / Transform | Identity formation     |
| Belong  | Tribe              | Social anchoring       |
| Witness | Feed               | Retention + aspiration |

### Identity Gating Rules

```
No user → Onboarding
User + No identity (no transformedAvatar/tribe) → Create
User + Identity → Full access to Feed/Tribe/Profile
```

### Tribe System

Five cultural homes, each with unique:
- Color scheme (applied via CSS data attributes)
- Symbol/Icon
- Motto
- Community guidelines
- Style focus

**Tribes:**
- 🟣 Wakandan Lineage - Innovation meets tradition
- 🔴 Zulu Nation - Strength in unity  
- 🟠 Nile Royals - Ancient wisdom, modern grace
- 🟢 Lagos Lions - Energy of the new Africa
- 🔵 Diaspora Rising - Bridging worlds, honoring roots

---

## 🎯 Key Features

### Immersive Experience
- Edge-to-edge content
- Full-screen post viewing
- Auto-hiding navigation
- Minimal chrome, maximum content

### Identity-First Design
- Transformed avatar prominently displayed
- Tribe badge appears with every identity signal
- Colors follow user tribe
- Visual consistency across all screens

### Gesture-Based Navigation
- Swipe up/down in feed
- Double-tap to respect
- Pull to close modals
- Natural mobile interactions

### Cultural Anchoring
- Tribe selection mandatory during onboarding
- Tribe colors theme the entire experience
- Community guidelines visible
- Social proof through members

---

## 📁 File Structure

```
afro-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── create/            # Transform/identity formation
│   │   ├── feed/              # Social feed
│   │   ├── onboarding/        # Welcome & tribe select
│   │   ├── post/[id]/         # Post viewer
│   │   ├── profile/           # User profiles
│   │   ├── tribe/[slug]/      # Tribe pages
│   │   ├── layout.tsx         # Root layout with nav
│   │   └── page.tsx           # Home router
│   ├── components/
│   │   ├── common/            # Reusable UI components
│   │   └── navigation/        # Nav components
│   ├── hooks/
│   │   └── useAuth.ts         # Auth + identity gating
│   ├── styles/
│   │   ├── animations.css     # Animation library
│   │   ├── globals.css        # Global styles
│   │   └── tokens.css         # Design tokens
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── README.md                  # This file
├── QUICK_START.md            # Quick reference guide
└── UI_IMPLEMENTATION.md      # Full documentation
```

---

## 🎨 Design Philosophy

### Principles

1. **A Place, Not a Product** - Users inhabit this space
2. **Earned, Not Given** - Features unlock as identity forms
3. **Minimal, Not Minimal** - Rich meaning with few elements
4. **Cultural, Not Generic** - Tribe identity everywhere
5. **Immersive, Not Cluttered** - UI fades behind content

### What's Intentionally NOT Included (MVP)

- Comments (future)
- Direct messages (future)
- Notifications (future)
- Search (future)
- Settings complexity (future)
- Monetization UI (post-MVP)
- Social graph/followers (week 2+)

---

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: CSS Variables (no CSS-in-JS library)
- **State**: React hooks + localStorage (temporary)
- **Icons**: Custom SVG system
- **Animations**: CSS animations + transitions

### Why These Choices?

- **No external UI library**: Custom design requires custom components
- **CSS Variables**: Dynamic theming (tribe colors) without runtime cost
- **Inline styles**: Co-located with components, type-safe via TypeScript
- **localStorage**: Simple MVP persistence (will migrate to API)

---

## 📱 Browser Support

### Tested & Supported
- Safari iOS 15+
- Chrome Android 90+
- Chrome Desktop (latest)
- Safari Desktop (latest)

### Required Features
- CSS Grid & Flexbox
- CSS Custom Properties
- Touch Events API
- localStorage API
- SVG support

---

## 🧪 Testing

### Manual Test Flows

1. **Onboarding Flow**
   - Start at `/`
   - Complete welcome screen
   - Select a tribe
   - Land on create screen

2. **Identity Formation**
   - Enter prompt on create screen
   - Watch generation animation
   - See action buttons appear
   - Set as profile or post

3. **Feed Experience**
   - Swipe through posts
   - Double-tap to respect
   - Tap "Try This Style"
   - Navigate to profiles/tribes

4. **Tribe Exploration**
   - View tribe header with identity
   - Switch between tabs
   - Tap posts to view full screen
   - See member list

5. **Profile Journey**
   - View own profile
   - See stats and grid
   - Edit profile (future)
   - Share profile (future)

---

## 🔮 Future Enhancements

### Phase 2 (Post-MVP)
- Real API integration
- Image uploads
- Tribe switching
- Advanced editing
- Social features

### Phase 3
- Comments system
- Direct messages
- Notifications
- Search & discovery
- Moderation tools

### Phase 4
- Video transformations
- Collaborative creations
- Events & challenges
- Monetization

---

## 📚 Documentation

- **[QUICK_START.md](../QUICK_START.md)** - Get started in 30 seconds
- **[UI_IMPLEMENTATION.md](../UI_IMPLEMENTATION.md)** - Complete UI documentation
- **Design Tokens** - See `src/styles/tokens.css`
- **Component API** - See individual component files

---

## 🤝 Contributing

### Adding New Features

1. Follow existing patterns (inline styles + tokens)
2. Respect the identity-first philosophy
3. Test on mobile devices first
4. Ensure tribe theming applies
5. Update documentation

### Code Style

```typescript
// ✅ Good - Uses design tokens
<div style={{
  padding: 'var(--space-lg)',
  color: 'var(--color-text-primary)',
}}>

// ❌ Bad - Hardcoded values
<div style={{
  padding: '24px',
  color: '#FFFFFF',
}}>
```

---

## 🐛 Known Issues

### Current Limitations
- All data is mocked (no real API yet)
- No real authentication (localStorage only)
- Images are placeholders
- No error boundaries
- No analytics

### Performance
- Feed could benefit from virtualization
- Image optimization needed
- Code splitting opportunities

---

## 📄 License

[Your License Here]

---

## 🌍 About AfroMoji

AfroMoji is more than a social app—it's an **identity environment** where African and diaspora communities can:

- **Transform** themselves through AI-powered cultural lens
- **Belong** to tribes that celebrate specific heritages
- **Witness** the creative expressions of their community

Built with the understanding that identity is not optional—it is the key to everything.

---

**Made with 💜 for the culture**

**BECOME • BELONG • WITNESS**








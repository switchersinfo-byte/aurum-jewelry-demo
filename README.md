# AURUM - Luxury Jewelry E-commerce Demo

A cinematic, elegant e-commerce demo for the fictional luxury jewelry brand "Aurum".

## Brand Identity

- **Name**: Aurum
- **Style**: Luxury, minimal, elegant
- **Colors**: Black (#000000) and Gold (#D4AF37)
- **Font**: Modern sans-serif (Inter)
- **Visual Tone**: Cinematic, artistic, black/gold richness

## Structure

The demo replicates the layout and section order from the reference site with custom Aurum branding:

### Sections (in order)

1. **Loader** - Animated page loader with Aurum branding
2. **Header**
   - Scrolling marquee top bar with promotional messaging
   - Main navigation with logo, menu, search, account, cart
   - Mobile responsive menu
3. **Hero Slider** - Full-width carousel with 3 slides showcasing collections
4. **Quick Links** - Horizontal scrollable category icons
5. **Promotional Banner** - Limited time offer with countdown timer
6. **Featured Products** - New arrivals product carousel
7. **Featured Collection** - Grid layout showcasing signature collections
8. **About Section** - Brand story and heritage
9. **Features Section** - 4 key value propositions (Lifetime Craftsmanship, Authenticity, Gift Service, Expert Consultation)
10. **Newsletter** - Email subscription form
11. **Footer** - Multi-column footer with brand info, navigation, and social links

## Features

### Interactive Elements
- Responsive mobile menu
- Hero slider with autoplay
- Product carousels using Swiper.js
- Countdown timer
- Wishlist functionality (localStorage)
- Shopping cart (localStorage)
- Newsletter subscription
- Smooth scroll navigation
- Toast notifications

### Design Highlights
- Black and gold color scheme
- Elegant typography with Inter font
- Cinematic gradients and animations
- Hover effects on cards and buttons
- Responsive design (mobile-first)
- Loading animations on placeholder images

## Technologies

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox, animations
- **JavaScript (Vanilla)** - No frameworks, pure JS
- **Swiper.js** - Touch-enabled sliders
- **Google Fonts** - Inter typeface

## File Structure

```
/vercel/sandbox/
├── index.html       # Main HTML structure
├── styles.css       # All styling (black/gold theme)
├── script.js        # Interactive functionality
└── README.md        # Documentation
```

## How to Run

1. Open `index.html` in a modern web browser
2. Or use a local server:
   ```bash
   python -m http.server 8000
   # or
   npx serve
   ```

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Key Design Decisions

### Layout Approach
- Maintained exact section order from reference site
- Replaced original brand content with Aurum luxury branding
- Used placeholder gradients instead of images for demo purposes
- Kept similar structure but applied black/gold aesthetic

### Brand Positioning
- Premium, exclusive tone in all copy
- Emphasis on craftsmanship and artistry
- Timeless elegance messaging
- High-end pricing ($1,500 - $4,500 range)

### Responsive Strategy
- Desktop-first design with mobile breakpoints
- Hamburger menu for mobile navigation
- Stacked layouts on small screens
- Touch-optimized sliders

## Credits

**Design & Development**: Collaborative agent team
- **Claude**: Content strategy and brand voice
- **Codex**: Frontend implementation
- **Blackbox**: Integration and deployment

**Brand**: Aurum (fictional)
**Reference**: https://72djzk.zid.store/

---

© 2026 Aurum. All rights reserved.

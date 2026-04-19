# Pin Bead Studio

A full-featured bead pattern design tool for Perler, Hama, and Artkal beads. Create, edit, and export bead art patterns with an intuitive grid-based canvas and powerful image-to-pattern quantization.

## Features

- **Grid-based Canvas** - Draw and edit bead patterns on customizable grid sizes (29x29 to 200x200)
- **Image Quantization** - Upload any image and convert it to a bead pattern using advanced CIEDE2000 color matching
- **Multiple Brand Palettes** - Support for Perler (P01-P77), Hama (H01-H56), and Artkal (C01-C72) color palettes
- **Dithering Options** - Floyd-Steinberg serpentine or Bayer 4x4 ordered dithering
- **Realistic Export** - Export patterns as PNG or SVG with realistic bead rendering (gradients, highlights, center holes)
- **Template Gallery** - Browse and use built-in templates
- **Undo/Redo** - Full history support for canvas operations
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Internationalization** - Supports Chinese, English, Japanese, and Korean

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/Aswellle/Pin-Bead-Studio.git
cd Pin-Bead-Studio

# Install dependencies
npm install

# Start development server
npm run dev
```

The dev server will start at `http://localhost:5173` (accessible on LAN via `http://<your-ip>:5173`)

### Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- **Framework** - React 18 + Vite 5
- **State** - React useState (primary), Zustand (available but not wired)
- **Styling** - Tailwind CSS v4
- **i18n** - react-i18next
- **Image Processing** - Web Workers with zero-copy Transferable ArrayBuffer
- **Color Science** - CIEDE2000 perceptual color difference algorithm
- **Storage** - IndexedDB via Dexie.js (available), localStorage (Gallery)

## Project Structure

```
src/
├── App.jsx              # Main component with all state and handlers
├── components/
│   ├── Canvas.jsx       # Grid canvas with drawing/touch support
│   ├── ImageQuantizer/  # Image upload and quantization modal
│   ├── ColorPalette/    # Color palette components
│   ├── Tools/           # Drawing tool components
│   ├── ExportPanel.jsx # PNG/SVG export UI
│   └── Gallery.jsx     # Template browser and saved works
├── hooks/
│   ├── useImageQuantizer.js  # Web Worker bridge
│   └── useResponsive.js      # Responsive breakpoint detection
├── workers/
│   └── imageQuantizer.worker.js  # Quantization algorithm
├── data/
│   └── palettes/       # Perler, Hama, Artkal palette data
├── services/
│   └── BeadPatternExporter.js  # Export with realistic bead rendering
└── utils/
    └── colorDiff.js    # Standalone CIEDE2000 utilities
```

## Color Resolution

canvasData stores **hex strings** (e.g., `'#F0B08A'`), never brand IDs. The quantization worker outputs brand IDs (e.g., `'P18'`) which are resolved to hex before storing:

```
Worker: 'P18' → resolveToHex() → '#F0B08A' → canvasData → ctx.fillStyle
```

## License

MIT

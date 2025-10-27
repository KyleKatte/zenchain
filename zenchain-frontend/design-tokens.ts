import crypto from "crypto";

//////////////////////////////////////////////////////////////////////////////
// DETERMINISTIC DESIGN SYSTEM
// Generates unique design tokens based on project metadata
//////////////////////////////////////////////////////////////////////////////

// Seed calculation: sha256(projectName + network + YYYYMM + contractFile)
const projectName = "ZenChain";
const network = "sepolia";
const yearMonth = "202510";
const contractName = "ZenChainDiary.sol";
const seedString = `${projectName}${network}${yearMonth}${contractName}`;
const seed = crypto.createHash("sha256").update(seedString).digest("hex");

// Convert seed to number for deterministic selection
const seedNum = parseInt(seed.substring(0, 8), 16);

// Design system selection based on seed
// Seed mod 5 = 2 → Neumorphism
const designSystems = [
  "Material",
  "Fluent",
  "Neumorphism",
  "Glassmorphism",
  "Minimal",
];
const selectedDesignSystem = designSystems[seedNum % 5];

// Color scheme selection based on seed
// Seed mod 8 = 5 → Group F (Teal/Green/Cyan)
const colorSchemes = {
  A: { primary: "#4F46E5", secondary: "#9333EA", accent: "#EC4899" },
  B: { primary: "#3B82F6", secondary: "#06B6D4", accent: "#14B8A6" },
  C: { primary: "#10B981", secondary: "#84CC16", accent: "#EAB308" },
  D: { primary: "#F97316", secondary: "#F59E0B", accent: "#EF4444" },
  E: { primary: "#A855F7", secondary: "#7C3AED", accent: "#6366F1" },
  F: { primary: "#14B8A6", secondary: "#10B981", accent: "#06B6D4" },
  G: { primary: "#EF4444", secondary: "#EC4899", accent: "#F97316" },
  H: { primary: "#06B6D4", secondary: "#3B82F6", accent: "#0EA5E9" },
};
const colorSchemeKeys = Object.keys(colorSchemes) as Array<
  keyof typeof colorSchemes
>;
const selectedColorScheme =
  colorSchemes[colorSchemeKeys[(seedNum >> 3) % 8]];

// Typography selection based on seed
// Seed mod 3 = 0 → Sans-Serif
const typographySystems = [
  { name: "Sans-Serif", fonts: ["Inter", "system-ui", "sans-serif"], scale: 1.25 },
  { name: "Serif", fonts: ["Georgia", "Playfair Display", "serif"], scale: 1.2 },
  { name: "Monospace", fonts: ["JetBrains Mono", "Fira Code", "monospace"], scale: 1.15 },
];
const selectedTypography = typographySystems[(seedNum >> 6) % 3];

// Layout selection
// Seed mod 5 = 0 → Sidebar
const layouts = ["sidebar", "masonry", "tabs", "grid", "wizard"];
const selectedLayout = layouts[(seedNum >> 9) % 5];

// Component style
const borderRadiusSizes = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
};
const selectedBorderRadius = borderRadiusSizes.lg; // Using 'lg' for Neumorphism

// Animation duration
const animationDurations = [100, 200, 300];
const selectedDuration = animationDurations[(seedNum >> 12) % 3];

//////////////////////////////////////////////////////////////////////////////
// DESIGN TOKENS EXPORT
//////////////////////////////////////////////////////////////////////////////

export const designTokens = {
  meta: {
    system: selectedDesignSystem,
    seed: seed,
    projectName,
    network,
  },

  colors: {
    light: {
      // Primary colors
      primary: selectedColorScheme.primary,
      primaryHover: adjustColor(selectedColorScheme.primary, -10),
      primaryActive: adjustColor(selectedColorScheme.primary, -20),

      // Secondary colors
      secondary: selectedColorScheme.secondary,
      secondaryHover: adjustColor(selectedColorScheme.secondary, -10),
      secondaryActive: adjustColor(selectedColorScheme.secondary, -20),

      // Accent colors
      accent: selectedColorScheme.accent,
      accentHover: adjustColor(selectedColorScheme.accent, -10),
      accentActive: adjustColor(selectedColorScheme.accent, -20),

      // Neutral colors (Neumorphism requires subtle grays)
      background: "#E6E7EB",
      surface: "#E6E7EB",
      surfaceRaised: "#F0F1F5",
      surfaceDepressed: "#D1D3D9",
      
      // Text colors
      text: "#2C3E50",
      textSecondary: "#5A6C7D",
      textTertiary: "#8B9CAD",

      // Borders
      border: "#BCC2CC",
      borderLight: "#D9DDE3",

      // Status colors
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    },
    dark: {
      // Primary colors
      primary: lightenColor(selectedColorScheme.primary, 20),
      primaryHover: lightenColor(selectedColorScheme.primary, 30),
      primaryActive: lightenColor(selectedColorScheme.primary, 40),

      // Secondary colors
      secondary: lightenColor(selectedColorScheme.secondary, 20),
      secondaryHover: lightenColor(selectedColorScheme.secondary, 30),
      secondaryActive: lightenColor(selectedColorScheme.secondary, 40),

      // Accent colors
      accent: lightenColor(selectedColorScheme.accent, 20),
      accentHover: lightenColor(selectedColorScheme.accent, 30),
      accentActive: lightenColor(selectedColorScheme.accent, 40),

      // Neutral colors (Dark Neumorphism)
      background: "#1E293B",
      surface: "#1E293B",
      surfaceRaised: "#293548",
      surfaceDepressed: "#15202E",

      // Text colors
      text: "#F8FAFC",
      textSecondary: "#CBD5E1",
      textTertiary: "#94A3B8",

      // Borders
      border: "#334155",
      borderLight: "#475569",

      // Status colors
      success: "#22C55E",
      warning: "#FACC15",
      error: "#F87171",
      info: "#60A5FA",
    },
  },

  typography: {
    fontFamily: {
      sans: selectedTypography.fonts,
      mono: ["JetBrains Mono", "Fira Code", "monospace"],
    },
    scale: selectedTypography.scale,
    sizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    weights: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeights: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },

  spacing: {
    unit: 8, // Base spacing unit (8px)
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },

  borderRadius: {
    none: "0",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    full: "9999px",
  },

  shadows: {
    // Neumorphism shadows (soft, dual-direction)
    neumorphicRaised: `
      8px 8px 16px rgba(163, 177, 198, 0.6),
      -8px -8px 16px rgba(255, 255, 255, 0.5)
    `,
    neumorphicPressed: `
      inset 4px 4px 8px rgba(163, 177, 198, 0.6),
      inset -4px -4px 8px rgba(255, 255, 255, 0.5)
    `,
    neumorphicFlat: `
      4px 4px 8px rgba(163, 177, 198, 0.4),
      -4px -4px 8px rgba(255, 255, 255, 0.4)
    `,
    
    // Standard shadows
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },

  transitions: {
    duration: {
      fast: "100ms",
      normal: `${selectedDuration}ms`,
      slow: "500ms",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  layout: {
    mode: selectedLayout,
    maxWidth: "1440px",
    sidebarWidth: "280px",
    headerHeight: "72px",
  },

  density: {
    compact: {
      padding: {
        sm: "4px 8px",
        md: "8px 16px",
        lg: "12px 24px",
      },
      gap: "8px",
      fontSize: "0.875rem",
    },
    comfortable: {
      padding: {
        sm: "8px 16px",
        md: "16px 24px",
        lg: "20px 32px",
      },
      gap: "16px",
      fontSize: "1rem",
    },
  },

  breakpoints: {
    mobile: "0px",
    tablet: "768px",
    desktop: "1024px",
  },
} as const;

//////////////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS
//////////////////////////////////////////////////////////////////////////////

/**
 * Adjust color brightness (simple hex manipulation)
 * @param hex Color in hex format (#RRGGBB)
 * @param amount Amount to adjust (-100 to 100)
 * @returns Adjusted color
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Lighten a color by percentage
 * @param hex Color in hex format
 * @param percent Percentage to lighten (0-100)
 * @returns Lightened color
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const b = Math.min(255, (num & 0x0000ff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export type DesignTokens = typeof designTokens;






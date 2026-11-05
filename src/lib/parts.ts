export type PartCategory =
  | "skin"
  | "hair"
  | "eyes"
  | "outfit"
  | "accessory"
  | "backdrop";

export type PartOption = {
  id: string;
  label: string;
  category: PartCategory;
  /** SVG fragment rendered inside the 320×360 art stage */
  svg: string;
};

export type PartsSelection = Record<PartCategory, string>;

export const PART_CATEGORIES: { id: PartCategory; label: string }[] = [
  { id: "backdrop", label: "Backdrop" },
  { id: "skin", label: "Skin" },
  { id: "outfit", label: "Outfit" },
  { id: "hair", label: "Hair" },
  { id: "eyes", label: "Eyes" },
  { id: "accessory", label: "Accessory" },
];

export const PARTS: PartOption[] = [
  // Backdrops
  {
    id: "bg-sunny-street",
    label: "Sunny Street",
    category: "backdrop",
    svg: `
      <rect width="320" height="360" fill="#87CEEB"/>
      <rect y="220" width="320" height="140" fill="#FFE56A"/>
      <rect x="20" y="140" width="90" height="100" fill="#F4D35E" stroke="#2A2A2A" stroke-width="3"/>
      <rect x="130" y="110" width="70" height="130" fill="#E8F1FF" stroke="#2A2A2A" stroke-width="3"/>
      <rect x="220" y="150" width="80" height="90" fill="#FFB703" stroke="#2A2A2A" stroke-width="3"/>
      <circle cx="60" cy="60" r="28" fill="#FFF3A0"/>
      <path d="M40 95 Q80 40 120 100" stroke="#FFD400" stroke-width="4" fill="none"/>
      <path d="M200 40 L210 70 L240 70 L216 88 L226 118 L200 98 L174 118 L184 88 L160 70 L190 70 Z" fill="#FFF"/>
    `,
  },
  {
    id: "bg-pumpkin",
    label: "Pumpkin Patch",
    category: "backdrop",
    svg: `
      <rect width="320" height="360" fill="#7EC8E8"/>
      <rect y="210" width="320" height="150" fill="#C65D1A"/>
      <ellipse cx="70" cy="250" rx="36" ry="28" fill="#E87722"/>
      <ellipse cx="130" cy="265" rx="30" ry="24" fill="#F4A261"/>
      <ellipse cx="250" cy="255" rx="40" ry="30" fill="#E76F51"/>
      <rect x="180" y="220" width="50" height="40" fill="#E9C46A" stroke="#6B4F1D" stroke-width="2"/>
      <path d="M20 120 Q80 40 140 110" stroke="#E8A020" stroke-width="3" fill="none"/>
      <path d="M160 90 Q210 30 280 100" stroke="#D9891A" stroke-width="3" fill="none"/>
    `,
  },
  {
    id: "bg-aura-city",
    label: "Aura City",
    category: "backdrop",
    svg: `
      <rect width="320" height="360" fill="#081428"/>
      <circle cx="40" cy="50" r="2" fill="#9EC5FF"/>
      <circle cx="90" cy="30" r="1.5" fill="#fff"/>
      <circle cx="160" cy="60" r="2" fill="#A8C4FF"/>
      <circle cx="240" cy="40" r="1.5" fill="#fff"/>
      <circle cx="290" cy="80" r="2" fill="#9EC5FF"/>
      <rect x="30" y="160" width="70" height="120" fill="#163A8A" stroke="#3D7CFF" stroke-width="3"/>
      <rect x="120" y="130" width="80" height="150" fill="#0D224F" stroke="#2F6BFF" stroke-width="3"/>
      <rect x="220" y="170" width="70" height="110" fill="#1B3F8A" stroke="#A8C4FF" stroke-width="3"/>
      <path d="M40 300 Q160 220 280 300" stroke="#3D7CFF" stroke-width="8" fill="none" opacity="0.7"/>
    `,
  },
  {
    id: "bg-blossom",
    label: "Blossom Lane",
    category: "backdrop",
    svg: `
      <rect width="320" height="360" fill="#F7C8E8"/>
      <rect y="230" width="320" height="130" fill="#FFD6EA"/>
      <rect x="30" y="150" width="80" height="100" fill="#FFB3D6" stroke="#6B1F52" stroke-width="3"/>
      <rect x="140" y="120" width="60" height="130" fill="#E8D5FF" stroke="#6B1F52" stroke-width="3"/>
      <rect x="230" y="160" width="70" height="90" fill="#FF9AC8" stroke="#6B1F52" stroke-width="3"/>
      <circle cx="60" cy="80" r="14" fill="#FF7AB8"/>
      <circle cx="100" cy="60" r="10" fill="#FFB3D6"/>
      <circle cx="220" cy="70" r="12" fill="#C98BFF"/>
      <circle cx="270" cy="95" r="9" fill="#FF7AB8"/>
    `,
  },

  // Skin
  {
    id: "skin-warm",
    label: "Warm",
    category: "skin",
    svg: `
      <ellipse cx="160" cy="250" rx="58" ry="70" fill="#F1C27D"/>
      <ellipse cx="160" cy="145" rx="62" ry="68" fill="#F1C27D"/>
      <ellipse cx="118" cy="155" rx="12" ry="16" fill="#F1C27D"/>
      <ellipse cx="202" cy="155" rx="12" ry="16" fill="#F1C27D"/>
      <ellipse cx="135" cy="165" rx="10" ry="6" fill="#F3A6A6" opacity="0.55"/>
      <ellipse cx="185" cy="165" rx="10" ry="6" fill="#F3A6A6" opacity="0.55"/>
    `,
  },
  {
    id: "skin-peach",
    label: "Peach",
    category: "skin",
    svg: `
      <ellipse cx="160" cy="250" rx="58" ry="70" fill="#FFD1B3"/>
      <ellipse cx="160" cy="145" rx="62" ry="68" fill="#FFD1B3"/>
      <ellipse cx="118" cy="155" rx="12" ry="16" fill="#FFD1B3"/>
      <ellipse cx="202" cy="155" rx="12" ry="16" fill="#FFD1B3"/>
      <ellipse cx="135" cy="165" rx="10" ry="6" fill="#FF9E9E" opacity="0.5"/>
      <ellipse cx="185" cy="165" rx="10" ry="6" fill="#FF9E9E" opacity="0.5"/>
    `,
  },
  {
    id: "skin-tan",
    label: "Tan",
    category: "skin",
    svg: `
      <ellipse cx="160" cy="250" rx="58" ry="70" fill="#C68642"/>
      <ellipse cx="160" cy="145" rx="62" ry="68" fill="#C68642"/>
      <ellipse cx="118" cy="155" rx="12" ry="16" fill="#C68642"/>
      <ellipse cx="202" cy="155" rx="12" ry="16" fill="#C68642"/>
      <ellipse cx="135" cy="165" rx="10" ry="6" fill="#B85C5C" opacity="0.45"/>
      <ellipse cx="185" cy="165" rx="10" ry="6" fill="#B85C5C" opacity="0.45"/>
    `,
  },
  {
    id: "skin-deep",
    label: "Deep",
    category: "skin",
    svg: `
      <ellipse cx="160" cy="250" rx="58" ry="70" fill="#8D5524"/>
      <ellipse cx="160" cy="145" rx="62" ry="68" fill="#8D5524"/>
      <ellipse cx="118" cy="155" rx="12" ry="16" fill="#8D5524"/>
      <ellipse cx="202" cy="155" rx="12" ry="16" fill="#8D5524"/>
      <ellipse cx="135" cy="165" rx="10" ry="6" fill="#A34A4A" opacity="0.4"/>
      <ellipse cx="185" cy="165" rx="10" ry="6" fill="#A34A4A" opacity="0.4"/>
    `,
  },

  // Hair
  {
    id: "hair-bob-black",
    label: "Bob Black",
    category: "hair",
    svg: `
      <path d="M95 145 C95 70 225 70 225 145 L225 175 C200 155 120 155 95 175 Z" fill="#1C1C1C"/>
      <path d="M105 100 Q160 70 215 100" fill="#2A2A2A"/>
      <ellipse cx="115" cy="175" rx="14" ry="22" fill="#1C1C1C"/>
      <ellipse cx="205" cy="175" rx="14" ry="22" fill="#1C1C1C"/>
    `,
  },
  {
    id: "hair-wavy-brown",
    label: "Wavy Brown",
    category: "hair",
    svg: `
      <path d="M90 150 C85 60 235 60 230 150 L235 210 C210 180 110 180 85 210 Z" fill="#6B3E26"/>
      <path d="M100 95 Q160 55 220 95" fill="#8B5A2B"/>
      <ellipse cx="100" cy="195" rx="16" ry="28" fill="#6B3E26"/>
      <ellipse cx="220" cy="195" rx="16" ry="28" fill="#6B3E26"/>
    `,
  },
  {
    id: "hair-short-ink",
    label: "Short Ink",
    category: "hair",
    svg: `
      <path d="M100 140 C100 75 220 75 220 140 L215 155 C190 140 130 140 105 155 Z" fill="#111827"/>
      <path d="M120 95 L145 75 L160 95 L180 72 L200 95" fill="#1F2937"/>
    `,
  },
  {
    id: "hair-long-rose",
    label: "Long Rose",
    category: "hair",
    svg: `
      <path d="M88 150 C80 55 240 55 232 150 L240 250 C210 210 110 210 80 250 Z" fill="#5A2744"/>
      <path d="M105 90 Q160 50 215 90" fill="#7A3A5C"/>
      <ellipse cx="95" cy="220" rx="18" ry="40" fill="#5A2744"/>
      <ellipse cx="225" cy="220" rx="18" ry="40" fill="#5A2744"/>
    `,
  },

  // Eyes
  {
    id: "eyes-bright",
    label: "Bright",
    category: "eyes",
    svg: `
      <ellipse cx="138" cy="145" rx="14" ry="16" fill="#fff" stroke="#111" stroke-width="3"/>
      <ellipse cx="182" cy="145" rx="14" ry="16" fill="#fff" stroke="#111" stroke-width="3"/>
      <circle cx="140" cy="147" r="7" fill="#2B1B0E"/>
      <circle cx="184" cy="147" r="7" fill="#2B1B0E"/>
      <circle cx="143" cy="143" r="2.5" fill="#fff"/>
      <circle cx="187" cy="143" r="2.5" fill="#fff"/>
      <path d="M145 175 Q160 185 175 175" stroke="#5A2A2A" stroke-width="3" fill="none" stroke-linecap="round"/>
    `,
  },
  {
    id: "eyes-cool",
    label: "Cool",
    category: "eyes",
    svg: `
      <ellipse cx="138" cy="145" rx="14" ry="15" fill="#fff" stroke="#111" stroke-width="3"/>
      <ellipse cx="182" cy="145" rx="14" ry="15" fill="#fff" stroke="#111" stroke-width="3"/>
      <circle cx="142" cy="146" r="7" fill="#0B1F4A"/>
      <circle cx="186" cy="146" r="7" fill="#0B1F4A"/>
      <circle cx="145" cy="142" r="2" fill="#fff"/>
      <circle cx="189" cy="142" r="2" fill="#fff"/>
      <path d="M148 172 Q160 176 172 172" stroke="#3A2A2A" stroke-width="3" fill="none" stroke-linecap="round"/>
    `,
  },
  {
    id: "eyes-sparkle",
    label: "Sparkle",
    category: "eyes",
    svg: `
      <ellipse cx="138" cy="145" rx="14" ry="16" fill="#fff" stroke="#4A1840" stroke-width="3"/>
      <ellipse cx="182" cy="145" rx="14" ry="16" fill="#fff" stroke="#4A1840" stroke-width="3"/>
      <circle cx="140" cy="147" r="7" fill="#5C2E18"/>
      <circle cx="184" cy="147" r="7" fill="#5C2E18"/>
      <circle cx="143" cy="143" r="2.5" fill="#fff"/>
      <circle cx="187" cy="143" r="2.5" fill="#fff"/>
      <path d="M145 176 Q160 188 175 176" stroke="#C45A8A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M200 120 L205 130 L215 132 L207 139 L210 149 L200 143 L190 149 L193 139 L185 132 L195 130 Z" fill="#FF7AB8"/>
    `,
  },

  // Outfits
  {
    id: "outfit-sunhood",
    label: "Sun Hood",
    category: "outfit",
    svg: `
      <path d="M105 220 Q160 200 215 220 L230 320 L90 320 Z" fill="#FFD400" stroke="#1A1A1A" stroke-width="3"/>
      <ellipse cx="160" cy="235" rx="22" ry="18" fill="#F4A261" stroke="#1A1A1A" stroke-width="2"/>
      <path d="M95 95 Q160 40 225 95 L210 130 Q160 95 110 130 Z" fill="#FFD400" stroke="#1A1A1A" stroke-width="3"/>
      <ellipse cx="112" cy="70" rx="16" ry="28" fill="#FFD400" stroke="#1A1A1A" stroke-width="3"/>
      <ellipse cx="208" cy="70" rx="16" ry="28" fill="#FFD400" stroke="#1A1A1A" stroke-width="3"/>
      <rect x="108" y="78" width="8" height="20" fill="#6B3E26"/>
      <rect x="204" y="78" width="8" height="20" fill="#6B3E26"/>
      <circle cx="130" cy="270" r="6" fill="#1A1A1A"/>
      <circle cx="190" cy="270" r="6" fill="#1A1A1A"/>
    `,
  },
  {
    id: "outfit-maple-dress",
    label: "Maple Dress",
    category: "outfit",
    svg: `
      <path d="M110 220 Q160 205 210 220 L235 320 L85 320 Z" fill="#E76F51" stroke="#5C2E0A" stroke-width="3"/>
      <path d="M120 245 L135 270 L150 245 L165 270 L180 245 L195 270" stroke="#2A9D8F" stroke-width="4" fill="none"/>
      <rect x="145" y="215" width="30" height="18" fill="#F4A261" stroke="#5C2E0A" stroke-width="2"/>
    `,
  },
  {
    id: "outfit-aura-hoodie",
    label: "Aura Hoodie",
    category: "outfit",
    svg: `
      <path d="M105 220 Q160 200 215 220 L230 320 L90 320 Z" fill="#2F6BFF" stroke="#061433" stroke-width="3"/>
      <path d="M95 100 Q160 50 225 100 L210 135 Q160 105 110 135 Z" fill="#2F6BFF" stroke="#061433" stroke-width="3"/>
      <ellipse cx="110" cy="75" rx="14" ry="34" fill="#1B3F8A" stroke="#061433" stroke-width="3"/>
      <ellipse cx="210" cy="75" rx="14" ry="34" fill="#1B3F8A" stroke="#061433" stroke-width="3"/>
      <rect x="125" y="250" width="70" height="12" rx="6" fill="#0D224F"/>
      <circle cx="140" cy="275" r="5" fill="#A8C4FF"/>
      <circle cx="180" cy="275" r="5" fill="#A8C4FF"/>
    `,
  },
  {
    id: "outfit-kitty-hoodie",
    label: "Kitty Hoodie",
    category: "outfit",
    svg: `
      <path d="M105 220 Q160 200 215 220 L230 320 L90 320 Z" fill="#FF7AB8" stroke="#6B1F52" stroke-width="3"/>
      <path d="M95 105 Q160 55 225 105 L210 140 Q160 110 110 140 Z" fill="#FF7AB8" stroke="#6B1F52" stroke-width="3"/>
      <path d="M115 55 L130 95 L100 95 Z" fill="#FF9AC8" stroke="#6B1F52" stroke-width="3"/>
      <path d="M205 55 L220 95 L190 95 Z" fill="#FF9AC8" stroke="#6B1F52" stroke-width="3"/>
      <circle cx="140" cy="265" r="5" fill="#fff"/>
      <circle cx="180" cy="265" r="5" fill="#fff"/>
      <path d="M150 280 Q160 290 170 280" stroke="#fff" stroke-width="3" fill="none"/>
    `,
  },

  // Accessories
  {
    id: "acc-none",
    label: "None",
    category: "accessory",
    svg: ``,
  },
  {
    id: "acc-shades",
    label: "Pink Shades",
    category: "accessory",
    svg: `
      <rect x="118" y="138" width="28" height="18" rx="6" fill="#FF7AB8" stroke="#6B1F52" stroke-width="2" opacity="0.85"/>
      <rect x="174" y="138" width="28" height="18" rx="6" fill="#FF7AB8" stroke="#6B1F52" stroke-width="2" opacity="0.85"/>
      <path d="M146 146 H174" stroke="#6B1F52" stroke-width="3"/>
    `,
  },
  {
    id: "acc-bow-bag",
    label: "Bow Bag",
    category: "accessory",
    svg: `
      <rect x="220" y="240" width="42" height="36" rx="8" fill="#1A1A1A" stroke="#FF7AB8" stroke-width="3"/>
      <path d="M232 240 Q241 220 250 240" stroke="#FF7AB8" stroke-width="3" fill="none"/>
      <path d="M235 250 L241 258 L247 250 L253 258" stroke="#FFB3D6" stroke-width="2" fill="none"/>
    `,
  },
  {
    id: "acc-star-pin",
    label: "Star Pin",
    category: "accessory",
    svg: `
      <path d="M160 210 L166 222 L180 224 L170 234 L173 248 L160 240 L147 248 L150 234 L140 224 L154 222 Z" fill="#FFD400" stroke="#1A1A1A" stroke-width="2"/>
    `,
  },
];

export function partsByCategory(category: PartCategory): PartOption[] {
  return PARTS.filter((p) => p.category === category);
}

export function getPart(id: string): PartOption | undefined {
  return PARTS.find((p) => p.id === id);
}

export const DEFAULT_PARTS: PartsSelection = {
  backdrop: "bg-sunny-street",
  skin: "skin-warm",
  hair: "hair-bob-black",
  eyes: "eyes-bright",
  outfit: "outfit-sunhood",
  accessory: "acc-star-pin",
};

export const THEME_DEFAULT_PARTS: Record<string, PartsSelection> = {
  dana: {
    backdrop: "bg-sunny-street",
    skin: "skin-warm",
    hair: "hair-bob-black",
    eyes: "eyes-bright",
    outfit: "outfit-sunhood",
    accessory: "acc-star-pin",
  },
  thea: {
    backdrop: "bg-pumpkin",
    skin: "skin-peach",
    hair: "hair-wavy-brown",
    eyes: "eyes-bright",
    outfit: "outfit-maple-dress",
    accessory: "acc-shades",
  },
  ritsuki: {
    backdrop: "bg-aura-city",
    skin: "skin-tan",
    hair: "hair-short-ink",
    eyes: "eyes-cool",
    outfit: "outfit-aura-hoodie",
    accessory: "acc-none",
  },
  josephine: {
    backdrop: "bg-blossom",
    skin: "skin-peach",
    hair: "hair-long-rose",
    eyes: "eyes-sparkle",
    outfit: "outfit-kitty-hoodie",
    accessory: "acc-bow-bag",
  },
};

/**
 * One color source for CSS (`brandCss`) and the Three.js scene.
 *
 * SAMPLED values are pixel measurements from public/brand/cpl-logo.png
 * (same bytes as the store copy). They are not an owner-approved palette.
 * PROPOSED values were not measured as fields in the artwork.
 */
export const brand = {
  /** SAMPLED. Navy-window mode, n=3546. Nearby: #052B4D, #052A4D, #042A4D, #052C4E. */
  navy: "#052B4E",
  /** SAMPLED. Teal-window mode, n=1621. Nearby: #076A8E, #086B8F, #076B8E, #086C90. */
  teal: "#076B8F",
  /** SAMPLED. Green-window mode, n=330. Nearby: #01A76D, #01A56C, #01A66D, #01A56B. */
  signal: "#01A66C",
  /** SAMPLED. Dominant logo-plate pixel. Also #FFFFFF, #FFFEFE, #FDFDFD. Corners near rgb(253,255,254). */
  plate: "#FEFEFE",
  /** SAMPLED. Light-edge 8-step bucket, n=151. Neighbor bucket #D8F0E8, n=149. */
  highlight: "#D0F0E8",
  /** SAMPLED. Darkest shadow pixel in the file. Sparse, not a flat field. Also #00032B, #000A25, #000D2A. */
  shadow: "#000724",
  /** PROPOSED. Midpoint of sampled highlight #D0F0E8 and sampled teal #076B8F. Not a measured pixel. */
  muted: "#6CAEBC",
  /** PROPOSED. Functional error only. Not present in the mark. */
  danger: "#E15B4A",
  /** PROPOSED. Panel lift: 35% sampled navy mixed into sampled shadow. Not a measured pixel. */
  panel: "#021433",
} as const;

export type BrandToken = keyof typeof brand;

export function brandCss(): string {
  const decls = Object.entries(brand)
    .map(([name, value]) => `--${name}:${value}`)
    .join(";");
  return `:root{${decls}}`;
}

# CPL service pirate agents

Supporting illustrations for the homepage Voice Agents and Chat Agents cards.
The approved `public/brand/cpl-logo.png` is unchanged. These illustrations are
decorative, with no public character names or live-agent behavior.

## Source and preparation

The square transparent PNG masters were created with the built-in image-generation
tool, using the approved logo as a visual reference. The chat prompt additionally
used the finished voice portrait to match the crew's materials, facial proportions,
camera, and lighting. There is no generation dependency or external image service
in the deployed website.

Run `node scripts/prepare-pirate-agents.mjs` to prepare the self-hosted 480px and
960px WebP assets. This uses the existing Sharp dependency, preserves alpha and
the complete artwork, and does not run as part of the production build.

`src/components/PirateAgentIllustration.astro` reserves square layout space and
chooses responsive resolutions. Its finite hover/focus accents last at most
850ms; reduced motion keeps the complete static portrait and accessories.

## Final generation specifications

Shared: original premium sculpted cyber-pirate AI agents; a compact head and minimal
shoulders in three-quarter view. Use the approved logo's broad three-point tricorn,
navy/teal bevels, off-white stylized cyber-skull, asymmetric digital eyepatch, and
recognizable jaw as design references, rather than copying the logo as an icon.
Confident, capable, approachable expression; smooth dimensional geometry and crisp
edges. Matte navy metal, satin ceramic, restrained cyan highlights; soft upper-left
studio lighting, gentle rim lighting, and a small soft shadow. Palette: navy
`#052b4e`, teal `#076b8f`, cyan `#31dcc7`, mint `#d0f0e8`, off-white. True transparent
background; a compact square composition with every accessory and hat tip inside
the canvas. No text, watermark, app tile, pedestal, scenery, weapons, treasure,
bottles, frightening skull, childish toy, generic stock robot, or resemblance to
existing film/game/brand characters.

Voice: attentive slight leftward turn, deep navy tricorn with teal edge highlights,
light ceramic facial plane, teal cyber eyepatch, and navy collar/shoulders. A clearly
visible communications ear cup outside the viewer-right face, below the hat; a
thick curved boom microphone near the lower face, with a small curved voice-signal
accent nearby. The headset, microphone, and pirate identity must read at service-card
size. No floating phone glyph or arrow as the subject.

Chat: a coordinated teammate, with the opposite facial orientation and eyepatch,
a differently angled navy/teal tricorn, mint facial planes, and teal collar details.
A compact translucent mint message panel beside the viewer-right face/shoulder,
with two layered speech panels and three crisp navy typing dots. The pirate remains
the main subject and the message panel remains prominent. No headset, ear cups,
boom microphone, or voice rings. Do not merely recolor the voice illustration.

## Scope

Only the two homepage service illustrations are replaced. Service copy, navigation,
the official logo, main demonstration, inquiry backend, notification system,
database, settings, and infrastructure remain unchanged.

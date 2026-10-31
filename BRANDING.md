# Site Safety Consultants — branding

The portal retains the official SSC pink (`#EE3861`) and white dashboard content.

- **Sidebar:** near-black charcoal gradient, `#202833` → `#191F28` → `#151A21`.
- **Navigation text:** light gray (`#C1CBD8`) with white active text.
- **Active item:** muted pink-charcoal `#493341` and pink indicator `#EE3861`.
- **Dropdown:** dark slate `#252E3A` with light labels and clear selected/hover states.
- **Page content:** white; pages and workflows unchanged.
- **Logo:** `public/ssc-logo-transparent.png` is the original transparent dark-letter artwork. `public/ssc-logo-for-dark-sidebar.png` changes only black lettering to a light shade for contrast on charcoal; the SSC pink is preserved.
- **Scrollbars:** visually hidden in sidebar and dropdown, scrolling remains enabled.

HXC/Harmonix remains a client workspace; portal branding belongs to SSC.

## Workspace branding

- `public/harmonix-logo.png` is the refreshed website-style Harmonix wordmark asset, aligned to the requested main brand colour #B6D552.
- `src/data/workspaceBranding.js` resolves a workspace's logo. User-uploaded logos take priority, then built-in branding by workspace ID.
- Harmonix displays its genuine wordmark against a neutral white backing for contrast and recognition on the dark sidebar. Other workspaces continue to use simple initials until their own logo is provided.
- The workspace picker is now a flat native-feeling row rather than a prominent filled card.

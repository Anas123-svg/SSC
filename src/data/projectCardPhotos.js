/**
 * Real, freely reusable photographs sourced from individual Unsplash photo pages.
 * These are REPRESENTATIVE construction images, not verified photos of SSC/Harmonix
 * project addresses. A project's uploaded photo or photoUrl takes precedence.
 *
 * Unsplash credits and links are preserved at the point of display.
 */
export const REFERENCE_PROJECT_PHOTOS = Object.freeze([
  {
    id: 'construction-structure',
    image: 'https://images.unsplash.com/photo-1659427921734-d4590f1e099f?auto=format&fit=crop&w=760&h=620&q=78',
    page: 'https://unsplash.com/photos/a-construction-site-with-cranes-and-a-building-under-construction-jmWFNK7ZvbY',
    credit: 'Steffen Lemmerzahl',
    alt: 'Construction site with cranes and a building under construction',
  },
  {
    id: 'scaffolding',
    image: 'https://images.unsplash.com/photo-1609867271967-a82f85c48531?auto=format&fit=crop&w=760&h=620&q=78',
    page: 'https://unsplash.com/photos/a-construction-site-with-a-crane-in-the-background-kO8f82u73Es',
    credit: 'Jan Huber',
    alt: 'Active building construction with scaffolding and equipment',
  },
  {
    id: 'industrial',
    image: 'https://images.unsplash.com/photo-1722079358008-2c72a8973998?auto=format&fit=crop&w=760&h=620&q=78',
    page: 'https://unsplash.com/photos/a-construction-site-with-a-crane-and-a-building-in-the-background-UssjZ_2hI3Q',
    credit: 'Adrian Sulyok',
    alt: 'Industrial construction project with crane',
  },
  {
    id: 'urban-construction',
    image: 'https://images.unsplash.com/photo-1761896171748-ca4e9c81b5de?auto=format&fit=crop&w=760&h=620&q=78',
    page: 'https://unsplash.com/photos/construction-site-with-cranes-and-buildings-DuD2r9OcsG0',
    credit: 'Tsuyoshi Kozu',
    alt: 'Cranes and buildings on an active construction site',
  },
  {
    id: 'logistics',
    image: 'https://images.unsplash.com/photo-1758304481667-71d545c91241?auto=format&fit=crop&w=760&h=620&q=78',
    page: 'https://unsplash.com/photos/aerial-view-of-a-modern-office-building-complex-rHvi-_-0jUU',
    credit: 'Alex Reynolds',
    alt: 'Aerial photograph of an industrial and logistics building complex',
  },
  {
    id: 'commercial-building',
    image: 'https://images.unsplash.com/photo-1766675916008-bf22af7f9601?auto=format&fit=crop&w=760&h=620&q=78',
    page: 'https://unsplash.com/photos/modern-building-facade-with-corrugated-metal-and-windows-OKcwl-B8ycs',
    credit: 'breizhography',
    alt: 'Modern commercial building facade with industrial cladding and windows',
  },
  {
    id: 'office-complex',
    image: 'https://images.unsplash.com/photo-1771432998536-fea330a65c26?auto=format&fit=crop&w=760&h=620&q=78',
    page: 'https://unsplash.com/photos/modern-office-building-with-glass-and-brick-facade-i2NHcYVsRIU',
    credit: 'Alan Rostovtev',
    alt: 'Photograph of a modern office building with glass and brick facade',
  },
  {
    id: 'industrial-warehouse',
    image: 'https://images.unsplash.com/photo-1761396776806-2be01380d8b0?auto=format&fit=crop&w=760&h=620&q=78',
    page: 'https://unsplash.com/photos/yellow-buildings-against-a-pale-blue-sky-e4to9j9BZvg',
    credit: 'strelenka',
    alt: 'Modern industrial warehouse and logistics buildings',
  },
]);

// The bundled project records are fictional demo entries. Assign a varied
// representative photo by seed ID, never imply the photo shows that site.
const DEMO_PHOTO_CHOICES = {
  'S-1': 0, 'S-2': 6, 'S-3': 1, 'S-4': 3,
  'S-5': 4, 'S-6': 5, 'S-7': 6, 'S-8': 7,
  'S-9': 0, 'S-10': 4, 'S-11': 2, 'S-12': 6,
};

export function referencePhotoFor(project) {
  const known = DEMO_PHOTO_CHOICES[project.id];
  if (known !== undefined) return REFERENCE_PROJECT_PHOTOS[known];
  const text = String(project.name || project.id || 'site');
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return REFERENCE_PROJECT_PHOTOS[hash % REFERENCE_PROJECT_PHOTOS.length];
}

export function secureImageUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

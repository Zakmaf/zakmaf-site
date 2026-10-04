export const SITE = {
  title: 'La prise de note',
  brand: 'zakmaf.net',
  homeTitle: 'La prise de note - Zakmaf.net',
  description: 'Quelques commentaires, une dose de poivre et beaucoup de sel',
  // Description de l'accueil pour les moteurs de recherche (160 caractères au plus).
  summary: 'Auto-hébergement, alternatives open source, homelab, serveurs et IA : articles, vidéos et fichiers de configuration prêts à copier, en français.',
};

export const LABELS = { videos: 'Vidéos', boilerplate: 'Boilerplate', blog: 'Blog' };

export const INTROS = {
  videos: "Les articles qui accompagnent chaque vidéo, avec ce qui n'a pas trouvé sa place au montage.",
  boilerplate: "Les fichiers compose, YAML et JSON montrés à l'écran, documentés et prêts à copier.",
  blog: 'Tout le reste.',
};

export const AUTHOR = {
  name: 'Zakaria Maftah',
  photo: '/zak.jpg',
  short: 'Je construis, teste et explique des technologies utiles, en français.',
  bio: "Je construis, teste et explique des technologies utiles, en français : auto-hébergement, alternatives open source, homelabs, serveurs et intelligence artificielle. Ce site prolonge mes vidéos avec les articles, les fichiers de configuration et les notes qui vont avec.",
};

// Adresse de la page Contact, fournie à la construction (jamais dans le dépôt). Vide :
// la page ne propose que les réseaux.
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || '';

// Laisse url vide pour masquer un lien.
export const SOCIALS = [
  { label: 'YouTube', url: 'https://www.youtube.com/@zakmaf' },
  { label: 'GitHub', url: 'https://github.com/Zakmaf' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/zakariamaftah/' },
];

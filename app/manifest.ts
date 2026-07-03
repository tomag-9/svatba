import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Angie & Tomi',
    short_name: 'A&T',
    description: 'Wedding planning app',
    start_url: '/',
    scope: '/',
    display_override: ['standalone'],
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f6efe7',
    theme_color: '#9b4f2f',
    categories: ['productivity', 'lifestyle'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  };
}

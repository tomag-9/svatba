import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Svadba planner',
    short_name: 'Svadba',
    description: 'Aplikácia na plánovanie svadby pre úlohy, hostí, časovú os a rozpočet.',
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

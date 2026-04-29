import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DogVantage',
    short_name: 'DogVantage',
    description: 'Personlig hundträning baserad på din ras och ålder',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f8f9fa',
    theme_color: '#2d6a4f',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}

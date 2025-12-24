import App from './App'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/base.png`,
  button: {
    title: 'Launch Template',
    action: {
      type: 'launch_frame',
      name: 'Base Fishing',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: '#f7f7f7',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Base Fishing',
    openGraph: {
      title: 'Base Fishing',
      description: 'The ultimate fishing experience on Base and Farcaster',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}

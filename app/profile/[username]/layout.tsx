import type { Metadata } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function generateMetadata(
  { params }: { params: { username: string } }
): Promise<Metadata> {
  try {
    const res  = await fetch(`${API}/profile/${params.username}`, { next: { revalidate: 60 } })
    const json = await res.json()

    if (!json.success) return { title: 'Creator Nexus' }

    const user = json.data.user
    const name = user.name || params.username
    const bio  = user.bio  || 'UGC Creator — Portfolio powered by Creator Nexus'
    const pic  = user.profilePicUrl || 'https://nexus.nexfluence.eu/og-default.png'
    const url  = `https://nexus.nexfluence.eu/profile/${params.username}`

    return {
      title:       `${name} — Creator Nexus`,
      description: bio,
      openGraph: {
        type:        'profile',
        siteName:    'Creator Nexus by Nexfluence',
        title:       `${name} — UGC Creator Portfolio`,
        description: bio,
        url,
        images: [{ url: pic, width: 400, height: 400, alt: name }],
      },
      twitter: {
        card:        'summary_large_image',
        title:       `${name} — UGC Creator Portfolio`,
        description: bio,
        images:      [pic],
      },
    }
  } catch {
    return { title: 'Creator Nexus' }
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
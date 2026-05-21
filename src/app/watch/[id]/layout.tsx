import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>; // <-- 1. Mark params as a Promise
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  // 2. AWAIT the params before trying to read the ID
  const resolvedParams = await params;
  const routeId = resolvedParams?.id;
  
  let title = "Aura | Premium Streaming";
  let description = "Stream premium cinematic content on Aura.";
  let images = ["https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80"];

  // 3. Safety check: If the ID is missing, return the default SEO
  if (!routeId) {
    return { title, description };
  }

  try {
    const directDocRef = doc(db, "movies", routeId);
    const directDocSnap = await getDoc(directDocRef);

    if (directDocSnap.exists()) {
      const data = directDocSnap.data();
      title = `${data.title} - Watch Full Movie on AURA`;
      description = data.fullDescription || data.shortDescription || description;
      if (data.banner || data.poster) {
        images = [data.banner || data.poster];
      }
    }
  } catch (err) {
    console.error("Error generating dynamic metadata:", err);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'video.movie',
      siteName: 'AURA',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    }
  };
}

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
import { Metadata } from 'next';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>; // <-- 1. Mark params as a Promise
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const routeId = resolvedParams?.id;
  const baseUrl = "https://aura-streaming.vercel.app";
  
  let title = "Aura | Premium Streaming";
  let description = "Stream premium cinematic content on Aura.";
  let images = ["https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80"];
  let canonicalId = routeId;
  let keywords = ["AURA", "movie streaming", "premium streaming", "watch movies online"];

  if (!routeId) {
    return { title, description };
  }

  try {
    let movieDoc = await getDoc(doc(db, "movies", routeId));

    if (!movieDoc.exists()) {
      const slugQuery = query(collection(db, "movies"), where("slug", "==", routeId));
      const slugSnapshot = await getDocs(slugQuery);
      if (!slugSnapshot.empty) {
        movieDoc = slugSnapshot.docs[0];
        canonicalId = slugSnapshot.docs[0].id;
      }
    }

    if (movieDoc.exists()) {
      const data = movieDoc.data();
      const year = data.releaseYear || new Date().getFullYear();
      title = `Watch ${data.title} (${year}) | AURA Premium`;
      description = data.fullDescription || data.shortDescription || description;
      if (data.banner || data.poster) {
        images = [data.banner || data.poster];
      }
      keywords = [
        `Watch ${data.title}`,
        `${data.title} streaming`,
        `${data.title} 8K`,
        "Aura network",
      ];
    }
  } catch (err) {
    console.error("Error generating dynamic metadata:", err);
  }

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: title.toString(),
      description,
      url: `${baseUrl}/watch/${canonicalId || routeId}`,
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

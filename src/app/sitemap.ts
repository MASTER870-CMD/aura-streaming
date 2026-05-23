import { MetadataRoute } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aura-streaming.vercel.app';

  let movieIds: string[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'movies'));
    movieIds = querySnapshot.docs.map((movieDoc) => movieDoc.id);
  } catch (error) {
    console.error("Error generating sitemap paths:", error);
  }

  const movieUrls = movieIds.map((id) => ({
    url: `${baseUrl}/watch/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/movies`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...movieUrls,
  ];
}

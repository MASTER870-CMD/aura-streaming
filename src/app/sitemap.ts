import { MetadataRoute } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aura-streaming.vercel.app';

  // 1. Fetch all movies live from your Firestore collection
  let movies: any[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'movies'));
    movies = querySnapshot.docs.map(doc => ({
      slug: doc.data().slug || doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error generating sitemap paths:", error);
  }

  // 2. Map movies into sitemap format
  const movieUrls = movies.map((movie) => ({
    url: `${baseUrl}/watch/${movie.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. Include your static core pages
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/movies`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/originals`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...movieUrls,
  ];
}
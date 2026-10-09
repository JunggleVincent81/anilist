import type { Metadata } from 'next';
import { AdminSynopsisEditor } from '@/components/admin/admin-synopsis-editor';

export const metadata: Metadata = {
  title: 'Private Synopsis Draft | Admin | Anime Platform',
  robots: { index: false, follow: false },
};
export default async function AdminSynopsisPage({ searchParams }: { searchParams: Promise<{ animeId?: string }> }) {
  const { animeId } = await searchParams;
  return <main className="mx-auto max-w-4xl px-4 py-10 pb-24 sm:px-6"><AdminSynopsisEditor animeId={animeId ?? ''} /></main>;
}

import type { Metadata } from 'next';
import { AdminAnimeManager } from '@/components/admin/admin-anime-manager';

export const metadata: Metadata = {
  title: 'Anime Manager | Admin | Anime Platform',
  description: 'Private Anime catalogue inspection and quarantined editorial candidate drafts.',
  robots: { index: false, follow: false },
};
export default function AdminAnimeManagerPage() { return <AdminAnimeManager />; }

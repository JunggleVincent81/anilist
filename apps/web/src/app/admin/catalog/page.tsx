import type { Metadata } from 'next';
import { AdminCatalogDashboard } from '@/components/admin/admin-catalog-dashboard';

export const metadata: Metadata = {
  title: 'Catalog Curation | Admin | Anime Platform',
  description: 'Private read-only administration and catalog review readiness.',
  robots: { index: false, follow: false },
};
export default function AdminCatalogPage() {
  return <AdminCatalogDashboard />;
}

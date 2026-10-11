import type { Metadata } from 'next';
import { AdminDomainManager } from '@/components/admin/admin-domain-manager';

export const metadata: Metadata = { title: 'Manga Manager | Admin', robots: {index:false,follow:false} };
export default function MangaManagerPage() { return <AdminDomainManager kind="MANGA"/>; }

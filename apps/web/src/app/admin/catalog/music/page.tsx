import type { Metadata } from 'next';
import { AdminDomainManager } from '@/components/admin/admin-domain-manager';

export const metadata: Metadata = { title: 'Music Manager | Admin', robots: {index:false,follow:false} };
export default function MusicManagerPage() { return <AdminDomainManager kind="MUSIC"/>; }

import type { Metadata } from 'next';
import { AdminRelationManager } from '@/components/admin/admin-relation-manager';

export const metadata:Metadata={title:'Relation Manager | Admin | AniList',robots: { index: false, follow: false }};
export default function Page(){return <AdminRelationManager/>;}

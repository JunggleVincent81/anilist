import type { Metadata } from 'next';
import { AdminSynopsisReviewQueue } from '@/components/admin/admin-synopsis-review-queue';

export const metadata: Metadata = { title: 'Private Synopsis Review | Admin', robots: { index: false, follow: false } };
export default function Page() { return <AdminSynopsisReviewQueue />; }

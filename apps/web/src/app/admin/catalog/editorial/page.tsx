import type { Metadata } from 'next';
import { AdminEditorialReview } from '@/components/admin/admin-editorial-review';
export const metadata:Metadata={title:'Editorial Review | Admin',robots:{index:false,follow:false}};
export default function EditorialReviewPage(){return <AdminEditorialReview/>;}

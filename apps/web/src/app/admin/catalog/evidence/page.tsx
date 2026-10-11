import type {Metadata} from 'next';
import {AdminMediaEvidence} from '@/components/admin/admin-media-evidence';
export const metadata:Metadata={title:'Media, Sources & Evidence | Admin | AniList',robots:{index:false,follow:false}};
export default function Page(){return <AdminMediaEvidence/>;}

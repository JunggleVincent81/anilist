import type {Metadata} from 'next';
import {AdminSmartImport} from '@/components/admin/admin-smart-import';
export const metadata:Metadata={title:'Private Smart Import | AniList Admin',robots:{index:false,follow:false}};
export default function Page(){return <AdminSmartImport/>;}

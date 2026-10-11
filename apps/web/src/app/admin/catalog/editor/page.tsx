import type {Metadata} from 'next';
import {AdminStructuredEditor} from '@/components/admin/admin-structured-editor';
export const metadata:Metadata={title:'Quick Add & Full Editors | Admin',robots:{index:false,follow:false}};
export default function AdminStructuredEditorPage(){return <AdminStructuredEditor/>;}

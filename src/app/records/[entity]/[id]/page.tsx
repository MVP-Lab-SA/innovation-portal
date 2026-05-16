'use client';

import { RecordDetail } from '@/components/RecordDetail';

export default function RecordPage({ params }: { params: { entity: string; id: string } }) {
  return <RecordDetail entity={params.entity} id={params.id} />;
}

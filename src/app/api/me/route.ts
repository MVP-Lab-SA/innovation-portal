import { NextResponse } from 'next/server';
import { getSessionWithProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  return NextResponse.json({
    id: session.profile.id,
    email: session.profile.email,
    name: session.profile.name,
    image: session.profile.image,
    role: session.profile.role,
    active: session.profile.active,
  });
}

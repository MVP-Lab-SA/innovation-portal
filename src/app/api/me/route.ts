import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionWithProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { respondError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  return NextResponse.json({
    id: session.profile.id,
    email: session.profile.email,
    name: session.profile.name,
    image: session.profile.image,
    role: session.profile.role,
    active: session.profile.active,
  });
}

// Self-service profile update. Only `name` is editable — role/active/email
// are deliberately NOT accepted here (those are admin-only via /api/entities).
const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
}).strict();

export async function PATCH(request: NextRequest) {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const parsed = profileSchema.parse(await request.json());
    const updated = await prisma.user.update({
      where: { id: session.profile.id },
      data: { name: parsed.name },
      select: { id: true, email: true, name: true, image: true, role: true, active: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return respondError(err, { code: 'profile_update_failed' });
  }
}

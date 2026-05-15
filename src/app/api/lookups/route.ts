import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  if (category) {
    const lookups = await prisma.lookup.findMany({
      where: { category, active: true },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ category, values: lookups.map(l => l.value) });
  }
  
  // Return all grouped by category
  const all = await prisma.lookup.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
  });
  const grouped: Record<string, string[]> = {};
  for (const l of all) {
    if (!grouped[l.category]) grouped[l.category] = [];
    grouped[l.category].push(l.value);
  }
  return NextResponse.json(grouped);
}

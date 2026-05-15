import { NextRequest, NextResponse } from 'next/server';
import { createListHandler, createCreateHandler, MODEL_REGISTRY } from '@/lib/crud';

export async function GET(request: NextRequest, { params }: { params: { entity: string } }) {
  const config = MODEL_REGISTRY[params.entity];
  if (!config) return NextResponse.json({ error: 'unknown_entity' }, { status: 404 });
  const handler = createListHandler(params.entity, config.model, config.options);
  return handler(request);
}

export async function POST(request: NextRequest, { params }: { params: { entity: string } }) {
  const config = MODEL_REGISTRY[params.entity];
  if (!config) return NextResponse.json({ error: 'unknown_entity' }, { status: 404 });
  const handler = createCreateHandler(params.entity, config.model, config.options);
  return handler(request);
}

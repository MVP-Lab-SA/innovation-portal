import { NextRequest, NextResponse } from 'next/server';
import { createRecordHandlers, MODEL_REGISTRY } from '@/lib/crud';

export async function GET(request: NextRequest, ctx: { params: { entity: string; id: string } }) {
  const config = MODEL_REGISTRY[ctx.params.entity];
  if (!config) return NextResponse.json({ error: `Unknown entity` }, { status: 404 });
  const handlers = createRecordHandlers(config.model, config.options);
  return handlers.GET(request, { params: { id: ctx.params.id } });
}

export async function PATCH(request: NextRequest, ctx: { params: { entity: string; id: string } }) {
  const config = MODEL_REGISTRY[ctx.params.entity];
  if (!config) return NextResponse.json({ error: `Unknown entity` }, { status: 404 });
  const handlers = createRecordHandlers(config.model, config.options);
  return handlers.PATCH(request, { params: { id: ctx.params.id } });
}

export async function DELETE(request: NextRequest, ctx: { params: { entity: string; id: string } }) {
  const config = MODEL_REGISTRY[ctx.params.entity];
  if (!config) return NextResponse.json({ error: `Unknown entity` }, { status: 404 });
  const handlers = createRecordHandlers(config.model, config.options);
  return handlers.DELETE(request, { params: { id: ctx.params.id } });
}

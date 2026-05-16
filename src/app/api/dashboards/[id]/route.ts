import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { respondError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Aggregated data per dashboard. Accepts optional filters via query string
 * (status, category, stage, dateFrom, dateTo) which re-compute KPIs, charts
 * and lists server-side.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const dashboardId = params.id;
  const sp = new URL(request.url).searchParams;
  const f: DashFilters = {
    status: sp.get('status') || undefined,
    category: sp.get('category') || undefined,
    stage: sp.get('stage') || undefined,
    dateFrom: sp.get('dateFrom') || undefined,
    dateTo: sp.get('dateTo') || undefined,
  };

  try {
    switch (dashboardId) {
      case 'executive':
        return NextResponse.json(await getExecutiveDashboard());
      case 'ideas':
        return NextResponse.json(await getIdeasDashboard(f));
      case 'campaigns':
        return NextResponse.json(await getCampaignsDashboard(f));
      case 'sandbox':
        return NextResponse.json(await getSandboxDashboard(f));
      case 'pilots':
        return NextResponse.json(await getPilotsDashboard(f));
      case 'initiatives':
        return NextResponse.json(await getInitiativesDashboard(f));
      case 'partners':
        return NextResponse.json(await getPartnersDashboard(f));
      case 'risks':
        return NextResponse.json(await getRisksDashboard(f));
      case 'metrics':
        return NextResponse.json(await getMetricsDashboard(f));
      case 'communications':
        return NextResponse.json(await getCommunicationsDashboard(f));
      case 'experts':
        return NextResponse.json(await getExpertsDashboard(f));
      case 'documents':
        return NextResponse.json(await getDocumentsDashboard(f));
      case 'events':
        return NextResponse.json(await getEventsDashboard(f));
      case 'cems':
        return NextResponse.json(await getCemsDashboard(f));
      case 'strategic-sources':
        return NextResponse.json(await getStrategicSourcesDashboard(f));
      case 'sponsorships':
        return NextResponse.json(await getSponsorshipsDashboard(f));
      case 'evaluations':
        return NextResponse.json(await getEvaluationsDashboard(f));
      case 'milestones':
        return NextResponse.json(await getMilestonesDashboard(f));
      case 'partner-interactions':
        return NextResponse.json(await getPartnerInteractionsDashboard(f));
      case 'business-challenges':
        return NextResponse.json(await getBusinessChallengesDashboard(f));
      default:
        return NextResponse.json({ error: 'unknown_dashboard' }, { status: 404 });
    }
  } catch (err) {
    return respondError(err, { code: 'dashboard_failed' });
  }
}

// ============================================================
// FILTERS
// ============================================================

interface DashFilters {
  status?: string;
  category?: string;
  stage?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Builds a Prisma `where` from generic filters, mapped to each model's
 * actual field names. Only mapped keys are applied (whitelist).
 */
function buildWhere(
  f: DashFilters,
  map: { status?: string; category?: string; stage?: string; date?: string },
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (f.status && map.status) where[map.status] = f.status;
  if (f.category && map.category) where[map.category] = f.category;
  if (f.stage && map.stage) where[map.stage] = f.stage;
  if (map.date && (f.dateFrom || f.dateTo)) {
    const range: Record<string, Date> = {};
    if (f.dateFrom) range.gte = new Date(f.dateFrom);
    if (f.dateTo) range.lte = new Date(f.dateTo);
    where[map.date] = range;
  }
  return where;
}

// Helper: group array by field
function countByField<T>(arr: T[], field: keyof T): Array<{ name: string; value: number }> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const v = String(item[field] || 'غير محدد');
    counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

// ============================================================
// DASHBOARD QUERIES
// ============================================================

async function getExecutiveDashboard() {
  const [ideas, initiatives, pilots, campaigns, partners, risks, metrics, sandbox] = await Promise.all([
    prisma.idea.findMany({ select: { id: true, status: true, stage: true } }),
    prisma.initiative.findMany({ select: { id: true, status: true, budgetSar: true } }),
    prisma.pilot.count(),
    prisma.campaign.findMany({ select: { id: true, status: true, category: true } }),
    prisma.partner.findMany({ select: { id: true, partnerType: true, partnershipStatus: true } }),
    prisma.risk.findMany({ select: { id: true, riskLevel: true, status: true } }),
    prisma.outcomeMetric.findMany({ select: { id: true, status: true, achievementPct: true } }),
    prisma.sandboxApplication.count(),
  ]);

  const activeInitiatives = initiatives.filter(i => i.status === 'قيد التنفيذ').length;
  const criticalRisks = risks.filter(r => r.riskLevel === 'حرج' || r.riskLevel === 'عالٍ').length;
  const onTrackMetrics = metrics.filter(m => m.status === 'على المسار' || m.status === 'تجاوز المستهدف').length;
  const activePartners = partners.filter(p => p.partnershipStatus === 'نشطة').length;

  return {
    kpis: {
      ideasTotal: ideas.length,
      initiativesTotal: initiatives.length,
      activeInitiatives,
      pilotsTotal: pilots,
      campaignsTotal: campaigns.length,
      partnersTotal: partners.length,
      activePartners,
      criticalRisks,
      onTrackMetrics,
      sandboxApplications: sandbox,
    },
    charts: {
      initiativeStatus: countByField(initiatives, 'status'),
      ideasStage: countByField(ideas, 'stage'),
      partnersType: countByField(partners, 'partnerType'),
      campaignCategory: countByField(campaigns, 'category'),
      risksByLevel: countByField(risks, 'riskLevel'),
    },
  };
}

async function getIdeasDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'category', stage: 'stage', date: 'submissionDate' });
  const ideas = await prisma.idea.findMany({
    where,
    include: { submitterCem: true, relatedChallenge: true },
    orderBy: { submissionDate: 'desc' },
  });

  return {
    kpis: {
      total: ideas.length,
      new: ideas.filter(i => i.status === 'جديدة').length,
      underReview: ideas.filter(i => i.stage === 'قيد المراجعة' || i.stage === 'تحت التقييم').length,
      approved: ideas.filter(i => i.status === 'موافق عليها').length,
      implemented: ideas.filter(i => i.stage === 'منفذة').length,
    },
    charts: {
      byStage: countByField(ideas, 'stage'),
      byCategory: countByField(ideas, 'category'),
      byStatus: countByField(ideas, 'status'),
    },
    recent: ideas.slice(0, 20),
  };
}

async function getCampaignsDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'category', date: 'launchDate' });
  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      strategicSource: true,
      businessChallenge: { select: { code: true, title: true } },
      _count: { select: { ideas: true } },
    },
    orderBy: { launchDate: 'desc' },
  });

  return {
    kpis: {
      total: campaigns.length,
      open: campaigns.filter(c => c.status === 'مفتوح').length,
      closed: campaigns.filter(c => c.status === 'مغلق').length,
      totalSubmissions: campaigns.reduce((s, c) => s + (c._count?.ideas || 0), 0),
    },
    charts: {
      byCategory: countByField(campaigns, 'category'),
      byStatus: countByField(campaigns, 'status'),
      byTrack: countByField(campaigns, 'track'),
    },
    list: campaigns,
  };
}

async function getSandboxDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'applicationStatus', category: 'applicationCategory', date: 'submissionDate' });
  const applications = await prisma.sandboxApplication.findMany({
    where,
    orderBy: { submissionDate: 'desc' },
  });

  const total = applications.length;
  const pending = applications.filter(a => (a.applicationStatus || '').includes('قيد المراجعة')).length;
  const approved = applications.filter(a => (a.applicationStatus || '').includes('موافق')).length;
  const duplicates = applications.filter(a => a.applicationCategory === 'متكررة').length;
  const responseRate = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

  return {
    kpis: { total, pending, approved, duplicates, responseRate },
    charts: {
      byStatus: countByField(applications, 'applicationStatus'),
      byDomain: countByField(applications, 'solutionDomain'),
      byMaturity: countByField(applications, 'productMaturity'),
      byVision: countByField(applications, 'vision2030Alignment'),
    },
    applications,
  };
}

async function getPilotsDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', date: 'startDate' });
  const pilots = await prisma.pilot.findMany({ where, orderBy: { startDate: 'desc' } });
  return {
    kpis: {
      total: pilots.length,
      running: pilots.filter(p => p.status === 'جارية').length,
      completed: pilots.filter(p => p.status === 'مكتملة').length,
      planned: pilots.filter(p => p.status === 'مخطط لها').length,
    },
    charts: { byStatus: countByField(pilots, 'status') },
    list: pilots,
  };
}

async function getInitiativesDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'category', date: 'startDate' });
  const initiatives = await prisma.initiative.findMany({
    where,
    include: { owner: true, _count: { select: { milestones: true, tasks: true, partners: true } } },
    orderBy: { startDate: 'desc' },
  });

  const budgetTotal = initiatives.reduce((s, i) => s + (Number(i.budgetSar) || 0), 0);
  const actualTotal = initiatives.reduce((s, i) => s + (Number(i.actualSpendSar) || 0), 0);
  const avgProgress = initiatives.length > 0
    ? Math.round(initiatives.reduce((s, i) => s + (i.progress || 0), 0) / initiatives.length)
    : 0;

  return {
    kpis: {
      total: initiatives.length,
      active: initiatives.filter(i => i.status === 'قيد التنفيذ').length,
      completed: initiatives.filter(i => i.status === 'مكتملة').length,
      avgProgress,
      budgetTotal,
      actualTotal,
      utilizationPct: budgetTotal > 0 ? Math.round((actualTotal / budgetTotal) * 100) : 0,
    },
    charts: {
      byStatus: countByField(initiatives, 'status'),
      byCategory: countByField(initiatives, 'category'),
      byPriority: countByField(initiatives, 'priority'),
    },
    list: initiatives,
  };
}

async function getPartnersDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'partnershipStatus', category: 'partnerType' });
  const [partners, sponsorships, interactions] = await Promise.all([
    prisma.partner.findMany({
      where,
      include: { _count: { select: { sponsorships: true, interactions: true, initiativePartners: true } } },
    }),
    prisma.sponsorship.findMany({ include: { partner: true } }),
    prisma.partnerInteraction.findMany({ include: { partner: true }, orderBy: { interactionDate: 'desc' }, take: 20 }),
  ]);

  const totalSponsorshipValue = sponsorships.reduce((s, sp) =>
    s + (Number(sp.cashValueSar) || 0) + (Number(sp.inKindValueSar) || 0) + (Number(sp.servicesValueSar) || 0), 0);

  return {
    kpis: {
      total: partners.length,
      active: partners.filter(p => p.partnershipStatus === 'نشطة').length,
      sponsorships: sponsorships.length,
      totalSponsorshipValue,
      interactionsThisMonth: interactions.filter(i => {
        const d = new Date(i.interactionDate);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
    },
    charts: {
      byType: countByField(partners, 'partnerType'),
      byStatus: countByField(partners, 'partnershipStatus'),
      sponsorshipsByTier: countByField(sponsorships, 'sponsorshipTier'),
    },
    partners,
    recentInteractions: interactions,
  };
}

async function getRisksDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'category', date: 'identifiedDate' });
  const risks = await prisma.risk.findMany({ where, orderBy: { riskScore: 'desc' } });

  return {
    kpis: {
      total: risks.length,
      critical: risks.filter(r => r.riskLevel === 'حرج').length,
      high: risks.filter(r => r.riskLevel === 'عالٍ').length,
      open: risks.filter(r => r.status === 'مفتوحة').length,
      mitigated: risks.filter(r => r.status === 'مغلقة').length,
    },
    charts: {
      byLevel: countByField(risks, 'riskLevel'),
      byCategory: countByField(risks, 'category'),
      byStatus: countByField(risks, 'status'),
    },
    list: risks,
  };
}

async function getMetricsDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'category', date: 'measurementDate' });
  const metrics = await prisma.outcomeMetric.findMany({ where });

  const onTrack = metrics.filter(m => m.status === 'على المسار').length;
  const exceeded = metrics.filter(m => m.status === 'تجاوز المستهدف').length;
  const atRisk = metrics.filter(m => m.status === 'في خطر').length;
  const offTrack = metrics.filter(m => m.status === 'خارج المسار').length;

  const avgAchievement = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + (Number(m.achievementPct) || 0), 0) / metrics.length)
    : 0;

  return {
    kpis: { total: metrics.length, onTrack, exceeded, atRisk, offTrack, avgAchievement },
    charts: {
      byStatus: countByField(metrics, 'status'),
      byCategory: countByField(metrics, 'category'),
    },
    list: metrics,
  };
}

async function getCommunicationsDashboard(f: DashFilters) {
  const where = buildWhere(f, { category: 'channel', date: 'publishDate' });
  const comms = await prisma.communication.findMany({ where, orderBy: { publishDate: 'desc' } });

  const totalReach = comms.reduce((s, c) => s + (c.reach || 0), 0);
  const totalEngagement = comms.reduce((s, c) => s + (c.engagement || 0), 0);

  return {
    kpis: {
      total: comms.length,
      totalReach,
      totalEngagement,
      avgEngagementRate: totalReach > 0 ? Math.round((totalEngagement / totalReach) * 100) : 0,
    },
    charts: {
      byChannel: countByField(comms, 'channel'),
      byAudience: countByField(comms, 'audience'),
    },
    list: comms,
  };
}

// ============================================================
// ANALYTICS DASHBOARDS (entities without a prior dashboard)
// ============================================================

async function getExpertsDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'category' });
  const experts = await prisma.expert.findMany({ where, orderBy: { createdAt: 'desc' } });
  return {
    kpis: {
      total: experts.length,
      active: experts.filter(e => e.status === 'نشط').length,
      categories: new Set(experts.map(e => e.category).filter(Boolean)).size,
    },
    charts: {
      byCategory: countByField(experts, 'category'),
      byStatus: countByField(experts, 'status'),
    },
    list: experts,
  };
}

async function getDocumentsDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'documentType', date: 'uploadDate' });
  const documents = await prisma.document.findMany({ where, orderBy: { uploadDate: 'desc' } });
  return {
    kpis: {
      total: documents.length,
      approved: documents.filter(d => d.status === 'معتمد').length,
      draft: documents.filter(d => d.status === 'مسودة').length,
    },
    charts: {
      byType: countByField(documents, 'documentType'),
      byStatus: countByField(documents, 'status'),
    },
    list: documents,
  };
}

async function getEventsDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'eventType', date: 'startDate' });
  const events = await prisma.calendarEvent.findMany({ where, orderBy: { startDate: 'desc' } });
  const now = new Date();
  return {
    kpis: {
      total: events.length,
      upcoming: events.filter(e => e.startDate && new Date(e.startDate) >= now).length,
      attendees: events.reduce((s, e) => s + (e.attendeeCount || 0), 0),
    },
    charts: {
      byType: countByField(events, 'eventType'),
      byStatus: countByField(events, 'status'),
    },
    list: events,
  };
}

async function getCemsDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'innovationField' });
  const cems = await prisma.cem.findMany({ where, orderBy: { createdAt: 'desc' } });
  return {
    kpis: {
      total: cems.length,
      active: cems.filter(c => c.status === 'نشط').length,
      fields: new Set(cems.map(c => c.innovationField).filter(Boolean)).size,
    },
    charts: {
      byField: countByField(cems, 'innovationField'),
      byStatus: countByField(cems, 'status'),
    },
    list: cems,
  };
}

async function getStrategicSourcesDashboard(f: DashFilters) {
  const where = buildWhere(f, { category: 'sourceType', date: 'publicationDate' });
  const sources = await prisma.strategicSource.findMany({ where, orderBy: { createdAt: 'desc' } });
  return {
    kpis: {
      total: sources.length,
      highRelevance: sources.filter(s => s.relevance === 'عالية' || s.relevance === 'عالية جداً').length,
      types: new Set(sources.map(s => s.sourceType).filter(Boolean)).size,
    },
    charts: {
      byType: countByField(sources, 'sourceType'),
      byRelevance: countByField(sources, 'relevance'),
    },
    list: sources,
  };
}

async function getSponsorshipsDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'sponsorshipType', date: 'startDate' });
  const sponsorships = await prisma.sponsorship.findMany({
    where,
    include: { partner: { select: { code: true, partnerName: true } } },
    orderBy: { startDate: 'desc' },
  });
  const totalValue = sponsorships.reduce((s, sp) =>
    s + (Number(sp.cashValueSar) || 0) + (Number(sp.inKindValueSar) || 0) + (Number(sp.servicesValueSar) || 0), 0);
  return {
    kpis: {
      total: sponsorships.length,
      active: sponsorships.filter(s => s.status === 'نشطة').length,
      totalValueSar: totalValue,
    },
    charts: {
      byTier: countByField(sponsorships, 'sponsorshipTier'),
      byStatus: countByField(sponsorships, 'status'),
    },
    list: sponsorships,
  };
}

async function getEvaluationsDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', date: 'evaluationDate' });
  const evaluations = await prisma.evaluation.findMany({
    where,
    include: {
      idea: { select: { code: true, title: true } },
      expert: { select: { code: true, fullName: true } },
    },
    orderBy: { evaluationDate: 'desc' },
  });
  const scored = evaluations.filter(e => e.overallScore != null);
  const avgScore = scored.length
    ? Math.round((scored.reduce((s, e) => s + Number(e.overallScore || 0), 0) / scored.length) * 10) / 10
    : 0;
  return {
    kpis: {
      total: evaluations.length,
      completed: evaluations.filter(e => e.status === 'مكتملة').length,
      inProgress: evaluations.filter(e => e.status === 'جارية').length,
      avgScore,
    },
    charts: {
      byStatus: countByField(evaluations, 'status'),
      byRecommendation: countByField(evaluations, 'recommendation'),
    },
    list: evaluations,
  };
}

async function getMilestonesDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', date: 'dueDate' });
  const milestones = await prisma.milestone.findMany({
    where,
    include: { initiative: { select: { code: true, name: true } } },
    orderBy: { dueDate: 'asc' },
  });
  const now = new Date();
  const avgProgress = milestones.length
    ? Math.round(milestones.reduce((s, m) => s + (m.progress || 0), 0) / milestones.length)
    : 0;
  return {
    kpis: {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'مكتملة' || m.completedDate != null).length,
      overdue: milestones.filter(m =>
        m.dueDate != null && new Date(m.dueDate) < now && m.status !== 'مكتملة' && m.completedDate == null).length,
      avgProgress,
    },
    charts: {
      byStatus: countByField(milestones, 'status'),
    },
    list: milestones,
  };
}

async function getPartnerInteractionsDashboard(f: DashFilters) {
  const where = buildWhere(f, { category: 'interactionType', date: 'interactionDate' });
  const interactions = await prisma.partnerInteraction.findMany({
    where,
    include: { partner: { select: { code: true, partnerName: true } } },
    orderBy: { interactionDate: 'desc' },
  });
  const now = new Date();
  const thisMonth = interactions.filter(i => {
    if (!i.interactionDate) return false;
    const d = new Date(i.interactionDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const upcomingFollowUps = interactions.filter(
    i => i.followUpDate != null && new Date(i.followUpDate) >= now,
  ).length;
  return {
    kpis: {
      total: interactions.length,
      thisMonth,
      upcomingFollowUps,
    },
    charts: {
      byType: countByField(interactions, 'interactionType'),
    },
    list: interactions,
  };
}

async function getBusinessChallengesDashboard(f: DashFilters) {
  const where = buildWhere(f, { status: 'status', category: 'domain' });
  const challenges = await prisma.businessChallenge.findMany({
    where,
    include: {
      strategicSource: { select: { code: true, sourceName: true } },
      _count: { select: { children: true, campaigns: true, pilots: true } },
    },
    orderBy: [{ sequence: 'asc' }, { createdAt: 'desc' }],
  });

  const main = challenges.filter(c => c.classification === 'رئيسي' || !c.parentId);
  // "High" covers every spelling the source data uses (عالي / عالية / مرتفع)
  // plus the normalised value, so the KPI stays correct before and after
  // the priority-normalisation script runs.
  const HIGH = new Set(['عالي', 'عالية', 'عالية جداً', 'مرتفع', 'حرجة']);
  const high = challenges.filter(c => c.priority && HIGH.has(c.priority));
  const derivedEvents = challenges.reduce((s, c) => s + (c._count?.campaigns || 0), 0);

  return {
    kpis: {
      total: challenges.length,
      mainChallenges: main.length,
      highPriority: high.length,
      open: challenges.filter(c => c.status === 'مفتوح' || c.status === 'قيد المعالجة').length,
      derivedEvents,
    },
    charts: {
      byDomain: countByField(challenges, 'domain'),
      byPriority: countByField(challenges, 'priority'),
      byStatus: countByField(challenges, 'status'),
      byType: countByField(challenges, 'challengeType'),
    },
    list: challenges,
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { respondError } from '@/lib/apiError';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Returns aggregated data for each dashboard
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const dashboardId = params.id;

  try {
    switch (dashboardId) {
      case 'executive':
        return NextResponse.json(await getExecutiveDashboard());
      case 'ideas':
        return NextResponse.json(await getIdeasDashboard());
      case 'challenges':
        return NextResponse.json(await getChallengesDashboard());
      case 'sandbox':
        return NextResponse.json(await getSandboxDashboard());
      case 'pilots':
        return NextResponse.json(await getPilotsDashboard());
      case 'initiatives':
        return NextResponse.json(await getInitiativesDashboard());
      case 'partners':
        return NextResponse.json(await getPartnersDashboard());
      case 'risks':
        return NextResponse.json(await getRisksDashboard());
      case 'metrics':
        return NextResponse.json(await getMetricsDashboard());
      case 'communications':
        return NextResponse.json(await getCommunicationsDashboard());
      default:
        return NextResponse.json({ error: 'unknown_dashboard' }, { status: 404 });
    }
  } catch (err) {
    return respondError(err, { code: 'dashboard_failed' });
  }
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
  const [ideas, initiatives, pilots, challenges, partners, risks, metrics, sandbox] = await Promise.all([
    prisma.idea.findMany({ select: { id: true, status: true, stage: true } }),
    prisma.initiative.findMany({ select: { id: true, status: true, budgetSar: true } }),
    prisma.pilot.count(),
    prisma.challenge.findMany({ select: { id: true, status: true, category: true } }),
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
      challengesTotal: challenges.length,
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
      challengeCategory: countByField(challenges, 'category'),
      risksByLevel: countByField(risks, 'riskLevel'),
    },
  };
}

async function getIdeasDashboard() {
  const ideas = await prisma.idea.findMany({
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

async function getChallengesDashboard() {
  const challenges = await prisma.challenge.findMany({
    include: { strategicSource: true, _count: { select: { ideas: true } } },
    orderBy: { launchDate: 'desc' },
  });
  
  return {
    kpis: {
      total: challenges.length,
      open: challenges.filter(c => c.status === 'مفتوح').length,
      closed: challenges.filter(c => c.status === 'مغلق').length,
      totalSubmissions: challenges.reduce((s, c) => s + (c._count?.ideas || 0), 0),
    },
    charts: {
      byCategory: countByField(challenges, 'category'),
      byStatus: countByField(challenges, 'status'),
    },
    list: challenges,
  };
}

async function getSandboxDashboard() {
  const applications = await prisma.sandboxApplication.findMany({
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

async function getPilotsDashboard() {
  const pilots = await prisma.pilot.findMany({ orderBy: { startDate: 'desc' } });
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

async function getInitiativesDashboard() {
  const initiatives = await prisma.initiative.findMany({
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

async function getPartnersDashboard() {
  const [partners, sponsorships, interactions] = await Promise.all([
    prisma.partner.findMany({ include: { _count: { select: { sponsorships: true, interactions: true, initiativePartners: true } } } }),
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

async function getRisksDashboard() {
  const risks = await prisma.risk.findMany({ orderBy: { riskScore: 'desc' } });
  
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

async function getMetricsDashboard() {
  const metrics = await prisma.outcomeMetric.findMany();
  
  const onTrack = metrics.filter(m => m.status === 'على المسار').length;
  const exceeded = metrics.filter(m => m.status === 'تجاوز المستهدف').length;
  const atRisk = metrics.filter(m => m.status === 'في خطر').length;
  const offTrack = metrics.filter(m => m.status === 'خارج المسار').length;
  
  const avgAchievement = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + (Number(m.achievementPct) || 0), 0) / metrics.length)
    : 0;
  
  return {
    kpis: {
      total: metrics.length,
      onTrack, exceeded, atRisk, offTrack,
      avgAchievement,
    },
    charts: {
      byStatus: countByField(metrics, 'status'),
      byCategory: countByField(metrics, 'category'),
    },
    list: metrics,
  };
}

async function getCommunicationsDashboard() {
  const comms = await prisma.communication.findMany({ orderBy: { publishDate: 'desc' } });
  
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

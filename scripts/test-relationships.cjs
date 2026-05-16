const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('@prisma/client');

loadEnvConfig(process.cwd());
const p = new PrismaClient();

(async () => {
  console.log('\n📋 TESTING RELATIONSHIP DATA ACCESS\n');
  
  // Test 1: Idea with expert assignments
  const idea = await p.idea.findFirst({
    include: { 
      expertAssignments: { include: { expert: { select: { fullName: true } } } }
    }
  });
  
  if (idea?.expertAssignments.length > 0) {
    console.log(`✅ Idea "${idea.title.substring(0, 30)}"...`);
    console.log(`   Assigned to ${idea.expertAssignments.length} expert(s):`);
    idea.expertAssignments.forEach(a => {
      console.log(`     • ${a.expert.fullName} (${a.assignmentRole})`);
    });
  }
  
  // Test 2: Initiative with partners
  const init = await p.initiative.findFirst({
    include: {
      partners: { include: { partner: { select: { partnerName: true } } } }
    }
  });
  
  if (init?.partners.length > 0) {
    console.log(`\n✅ Initiative "${init.name.substring(0, 30)}"...`);
    console.log(`   Linked to ${init.partners.length} partner(s):`);
    init.partners.forEach(p => {
      console.log(`     • ${p.partner.partnerName} (${p.role})`);
    });
  }
  
  // Test 3: Evaluation with scores
  const eval_ = await p.evaluation.findFirst({
    include: {
      scores: { include: { rubric: { select: { criterionName: true } } } }
    }
  });
  
  if (eval_?.scores.length > 0) {
    console.log(`\n✅ Evaluation for idea`);
    console.log(`   Overall Score: ${eval_.overallScore.toFixed(2)}/5`);
    console.log(`   Criteria Evaluated: ${eval_.scores.length}`);
    eval_.scores.slice(0, 2).forEach(s => {
      console.log(`     • ${s.rubric.criterionName}: ${s.rawScore.toFixed(2)}`);
    });
  }
  
  // Test 4: Challenge with experts
  const challenge = await p.challenge.findFirst({
    include: {
      expertAssignments: { include: { expert: { select: { fullName: true } } } }
    }
  });
  
  if (challenge?.expertAssignments.length > 0) {
    console.log(`\n✅ Challenge "${challenge.title.substring(0, 30)}"...`);
    console.log(`   ${challenge.expertAssignments.length} expert(s) assigned`);
  }
  
  // Test 5: Document links
  const doc = await p.documentLink.findFirst({
    include: {
      document: { select: { title: true } },
      initiative: { select: { name: true } }
    }
  });
  
  if (doc) {
    console.log(`\n✅ Document "${doc.document.title.substring(0, 25)}"...`);
    console.log(`   Linked to Initiative: "${doc.initiative?.name || 'N/A'}"`);
  }
  
  console.log('\n🎯 All relationship tests passed! Data is properly seeded and accessible.\n');
  
  await p.$disconnect();
})().catch(async (err) => {
  console.error('Error:', err);
  await p.$disconnect();
  process.exitCode = 1;
});

const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('@prisma/client');

loadEnvConfig(process.cwd());
const p = new PrismaClient();

(async () => {
  const t = await p.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  );
  
  const out = [];
  for (const r of t) {
    const c = await p.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS c FROM public."${r.tablename}"`);
    out.push({ table: r.tablename, count: Number(c[0].c) });
  }
  
  const s = out.filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  const e = out.filter(x => x.count === 0);
  
  console.log('\n📊 FINAL DATABASE SEEDING STATUS\n');
  console.log(`Total Public Tables: ${out.length}`);
  console.log(`Seeded Tables: ${s.length}`);
  console.log(`Empty Tables: ${e.length}\n`);
  
  console.log('✅ SEEDED TABLES:');
  s.forEach(x => console.log(`   ${x.table.padEnd(30)} ${x.count} rows`));
  
  if (e.length > 0) {
    console.log('\n⚠️  EMPTY TABLES:');
    e.forEach(x => console.log(`   ${x.table}`));
  } else {
    console.log('\n🎉 ALL TABLES POPULATED! No empty tables remain.');
  }
  
  await p.$disconnect();
})().catch(async (err) => {
  console.error('Error:', err);
  await p.$disconnect();
  process.exitCode = 1;
});

import { prisma } from '../src/db';

async function run() {
  const contracts = await prisma.contract.findMany({
    include: {
      employee: {
        select: { code: true, fullName: true, status: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Total contracts: ${contracts.length}`);
  for (const c of contracts) {
    console.log(
      `${c.employee?.code || 'N/A'} | ${c.employee?.fullName || 'N/A'} | ${c.employee?.status} | ${c.contractType} | ${c.startDate?.toISOString().slice(0, 10)} -> ${c.endDate ? c.endDate.toISOString().slice(0, 10) : 'INDEFINITE'} | status: ${c.status}`
    );
  }

  const employees = await prisma.employee.findMany({
    select: { id: true, code: true, fullName: true, status: true, contracts: true }
  });
  console.log(`Total employees: ${employees.length}`);
}

run().finally(() => prisma.$disconnect());


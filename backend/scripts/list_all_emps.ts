import { prisma } from '../src/db';

async function main() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      code: true,
      fullName: true,
      status: true,
      joinDate: true,
      department: { select: { name: true } },
      position: { select: { title: true } }
    },
    orderBy: { code: 'asc' }
  });

  console.log(`Found ${employees.length} employees:`);
  employees.forEach(e => {
    console.log(`${e.code} | ${e.fullName} | ${e.status} | ${e.department?.name} | ${e.position?.title}`);
  });
}

main().finally(() => prisma.$disconnect());


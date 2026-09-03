import { prisma } from './src/db';
async function main() {
  await prisma.employee.updateMany({
    where: { position: { code: { in: ['LDEV', 'LTEST', 'LBA'] } } },
    data: { positionId: null }
  });
  await prisma.position.deleteMany({
    where: { code: { in: ['LDEV', 'LTEST', 'LBA'] } }
  });
  console.log('Deleted old Lead positions');
}
main().finally(() => prisma.$disconnect());

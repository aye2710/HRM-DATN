import { prisma } from './src/db';

async function main() {
  const accounts = await prisma.account.findMany();
  console.log('Accounts:', accounts);
}

main().catch(console.error).finally(() => prisma.$disconnect());

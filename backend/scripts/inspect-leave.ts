import { prisma } from '../src/db';

async function main() {
  const [types, policies, holidays, requests, balances] = await Promise.all([
    prisma.leaveTypeConfig.findMany(),
    prisma.leavePolicy.findMany(),
    prisma.holiday.findMany(),
    prisma.leaveRequest.findMany(),
    prisma.leaveBalance.findMany()
  ]);

  console.log({
    typesCount: types.length,
    policiesCount: policies.length,
    holidaysCount: holidays.length,
    requestsCount: requests.length,
    balancesCount: balances.length
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

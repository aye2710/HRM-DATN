import { prisma } from '../src/db';

async function main() {
  const depts = await prisma.department.findMany({ select: { id: true, code: true, name: true } });
  console.log('Departments:', JSON.stringify(depts, null, 2));

  const positions = await prisma.position.findMany({ select: { id: true, code: true, title: true, deptCode: true, departmentId: true } });
  console.log('Positions count:', positions.length);

  const employees = await prisma.employee.findMany({ select: { id: true, code: true, fullName: true, departmentId: true, positionId: true } });
  console.log('Employees count:', employees.length);
  console.log('Employees:', JSON.stringify(employees, null, 2));
}

main().finally(() => prisma.$disconnect());


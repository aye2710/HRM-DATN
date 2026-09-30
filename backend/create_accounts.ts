import { prisma } from './src/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Creating accounts...');

  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Quản trị viên hệ thống' },
  });

  const empRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: { name: 'EMPLOYEE', description: 'Nhân viên bình thường' },
  });

  // 2. Create an admin employee if needed (or just an account)
  const passwordHash = await bcrypt.hash('123456', 10);

  // Admin account
  await prisma.account.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: passwordHash,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // Employee account
  const emp = await prisma.employee.findFirst();
  if (emp) {
    await prisma.account.upsert({
      where: { username: 'emp01' },
      update: {},
      create: {
        username: 'emp01',
        password: passwordHash,
        roleId: empRole.id,
        employeeId: emp.id,
        isActive: true,
      },
    });
  }

  console.log('Accounts created!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

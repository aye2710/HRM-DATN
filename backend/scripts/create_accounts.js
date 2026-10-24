"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    console.log('Creating accounts...');
    // 1. Create Roles
    const adminRole = await db_1.prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN', description: 'Quản trị viên hệ thống' },
    });
    const empRole = await db_1.prisma.role.upsert({
        where: { name: 'EMPLOYEE' },
        update: {},
        create: { name: 'EMPLOYEE', description: 'Nhân viên bình thường' },
    });
    // 2. Create an admin employee if needed (or just an account)
    const passwordHash = await bcryptjs_1.default.hash('123456', 10);
    // Admin account
    await db_1.prisma.account.upsert({
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
    const emp = await db_1.prisma.employee.findFirst();
    if (emp) {
        await db_1.prisma.account.upsert({
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
main().catch(console.error).finally(() => db_1.prisma.$disconnect());

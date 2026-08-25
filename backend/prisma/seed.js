"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Start seeding...');
    // Create Departments
    const itDept = await prisma.department.upsert({
        where: { code: 'IT' },
        update: {},
        create: { code: 'IT', name: 'Phòng Công nghệ' },
    });
    const hrDept = await prisma.department.upsert({
        where: { code: 'HR' },
        update: {},
        create: { code: 'HR', name: 'Phòng Nhân sự' },
    });
    // Create Positions
    const devPos = await prisma.position.create({
        data: { title: 'Lập trình viên' }
    });
    const hrPos = await prisma.position.create({
        data: { title: 'Chuyên viên HR' }
    });
    // Create 124 Employees
    for (let i = 1; i <= 124; i++) {
        await prisma.employee.create({
            data: {
                code: `EMP-${String(i).padStart(3, '0')}`,
                fullName: `Nhân viên ${i}`,
                cccd: `079099${String(i).padStart(6, '0')}`,
                joinDate: new Date(),
                departmentId: i % 2 === 0 ? itDept.id : hrDept.id,
                positionId: i % 2 === 0 ? devPos.id : hrPos.id,
            }
        });
    }
    // Create some Leave Requests
    const emp = await prisma.employee.findFirst();
    if (emp) {
        for (let i = 0; i < 5; i++) {
            await prisma.leaveRequest.create({
                data: {
                    employeeId: emp.id,
                    leaveType: 'PAID',
                    startDate: new Date(),
                    endDate: new Date(),
                    status: 'PENDING',
                }
            });
        }
    }
    console.log('Seeding finished.');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});

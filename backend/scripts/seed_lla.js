"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
async function main() {
    console.log('Clearing old data...');
    // Clear related tables first to avoid FK constraints
    await db_1.prisma.account.deleteMany();
    await db_1.prisma.contract.deleteMany();
    await db_1.prisma.attendance.deleteMany();
    await db_1.prisma.leaveBalance.deleteMany();
    await db_1.prisma.leaveRequest.deleteMany();
    await db_1.prisma.oTRequest.deleteMany();
    await db_1.prisma.payslipDetail.deleteMany();
    await db_1.prisma.payslip.deleteMany();
    await db_1.prisma.performanceReview.deleteMany();
    await db_1.prisma.kPI.deleteMany();
    await db_1.prisma.onboardingTask.deleteMany();
    await db_1.prisma.employee.deleteMany();
    await db_1.prisma.position.deleteMany();
    await db_1.prisma.department.deleteMany();
    console.log('Old data cleared!');
    // 1. Create Departments
    console.log('Creating Departments...');
    const rootDept = await db_1.prisma.department.create({
        data: { code: 'LLA', name: 'Công ty TNHH Thương mại và Dịch vụ LLA', quota: 50 }
    });
    const bgdDept = await db_1.prisma.department.create({
        data: { code: 'BGD', name: 'Ban Giám đốc', quota: 5, parentId: rootDept.id }
    });
    const sxDept = await db_1.prisma.department.create({
        data: { code: 'SX', name: 'Khối Sản xuất', quota: 30, parentId: rootDept.id }
    });
    const ktDept = await db_1.prisma.department.create({
        data: { code: 'KT', name: 'Phòng Kế toán', quota: 5, parentId: rootDept.id }
    });
    const devDept = await db_1.prisma.department.create({
        data: { code: 'DEV', name: 'Tổ Phát triển', quota: 15, parentId: sxDept.id }
    });
    const testDept = await db_1.prisma.department.create({
        data: { code: 'TEST', name: 'Tổ Kiểm thử', quota: 10, parentId: sxDept.id }
    });
    const baDept = await db_1.prisma.department.create({
        data: { code: 'BA', name: 'Tổ Phân tích', quota: 5, parentId: sxDept.id }
    });
    // 2. Create Positions & Employees
    console.log('Creating Positions and Employees...');
    // Helper function to create position and employee
    const createRoleAndStaff = async (deptId, posCode, posTitle, empCode, empName, cccd) => {
        const pos = await db_1.prisma.position.create({
            data: { code: posCode, title: posTitle, departmentId: deptId, level: 'Manager', minSalary: 10000000, maxSalary: 50000000 }
        });
        await db_1.prisma.employee.create({
            data: {
                code: empCode,
                fullName: empName,
                cccd: cccd,
                joinDate: new Date(),
                departmentId: deptId,
                positionId: pos.id,
                status: 'ACTIVE'
            }
        });
    };
    await createRoleAndStaff(bgdDept.id, 'GD', 'Giám đốc', 'NV001', 'Phạm Hoàng Long', '001099000001');
    await createRoleAndStaff(bgdDept.id, 'PGD', 'Phó Giám đốc', 'NV002', 'Trần Quốc Dũng', '001099000002');
    await createRoleAndStaff(sxDept.id, 'TPSX', 'Trưởng phòng Sản xuất', 'NV003', 'Ngô Xuân Cương', '001099000003');
    await createRoleAndStaff(ktDept.id, 'KTT', 'Kế toán trưởng', 'NV004', 'Nguyễn Thị Nhàn', '001099000004');
    await createRoleAndStaff(devDept.id, 'LDEV', 'Lead Dev', 'NV005', 'Nguyễn Huy Hoàng', '001099000005');
    await createRoleAndStaff(testDept.id, 'LTEST', 'Lead Test', 'NV006', 'Lê Thị Thúy', '001099000006');
    await createRoleAndStaff(baDept.id, 'LBA', 'Lead BA', 'NV007', 'Trần Việt Anh', '001099000007');
    console.log('Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await db_1.prisma.$disconnect();
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
async function main() {
    const rootDept = await db_1.prisma.department.findUnique({ where: { code: 'LLA' } });
    if (!rootDept) {
        console.log("Không tìm thấy công ty gốc.");
        return;
    }
    await db_1.prisma.department.create({
        data: {
            code: 'MKT',
            name: 'Phòng Marketing',
            parentId: rootDept.id,
            quota: 10
        }
    });
    await db_1.prisma.department.create({
        data: {
            code: 'HT',
            name: 'Khối Hạ tầng',
            parentId: rootDept.id,
            quota: 20
        }
    });
    console.log('Đã thêm Phòng Marketing và Khối Hạ tầng thành công!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await db_1.prisma.$disconnect();
});

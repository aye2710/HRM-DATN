"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
async function main() {
    await db_1.prisma.employee.updateMany({
        where: { position: { code: { in: ['LDEV', 'LTEST', 'LBA'] } } },
        data: { positionId: null }
    });
    await db_1.prisma.position.deleteMany({
        where: { code: { in: ['LDEV', 'LTEST', 'LBA'] } }
    });
    console.log('Deleted old Lead positions');
}
main().finally(() => db_1.prisma.$disconnect());

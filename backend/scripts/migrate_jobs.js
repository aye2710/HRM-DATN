const { prisma } = require('../src/db');

async function migrateData() {
    console.log('Migrating job statuses...');
    await prisma.jobPosting.updateMany({
        where: { status: 'OPEN' },
        data: { status: 'PUBLISHED' }
    });
    console.log('Done migrating data!');
}

migrateData().finally(() => prisma.$disconnect());

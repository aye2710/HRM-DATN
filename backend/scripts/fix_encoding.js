const { prisma } = require('../src/db');

async function fixEncoding() {
    console.log('Fixing positions...');
    await prisma.position.updateMany({ where: { code: 'CEO' }, data: { title: 'Giám đốc Điều hành' } });
    await prisma.position.updateMany({ where: { code: 'HR-MGR' }, data: { title: 'Trưởng phòng Nhân sự' } });
    await prisma.position.updateMany({ where: { code: 'HR-CB' }, data: { title: 'Chuyên viên C&B' } });
    await prisma.position.updateMany({ where: { code: 'DEV-FE' }, data: { title: 'Lập trình viên Frontend' } });
    await prisma.position.updateMany({ where: { code: 'DEV-BE' }, data: { title: 'Lập trình viên Backend' } });

    console.log('Fixing departments...');
    await prisma.department.updateMany({ where: { code: 'BOD' }, data: { name: 'Ban Giám Đốc' } });
    await prisma.department.updateMany({ where: { code: 'HR' }, data: { name: 'Phòng Nhân sự' } });
    await prisma.department.updateMany({ where: { code: 'IT' }, data: { name: 'Phòng Công nghệ' } });
    
    console.log('Done fixing encoding!');
}

fixEncoding().finally(() => prisma.$disconnect());

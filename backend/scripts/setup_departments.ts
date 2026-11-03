import { prisma } from '../src/db';

async function setupDepartments() {
  console.log('🔄 Đang thiết lập danh mục Phòng ban theo cơ cấu mới...');

  // 1. Xóa các phòng ban cũ nếu có
  await prisma.department.deleteMany();

  // 2. Ban Giám Đốc (Root)
  const bgd = await prisma.department.create({
    data: {
      code: 'BGD',
      name: 'Ban Giám Đốc',
      quota: 2,
      managerName: 'Phạm Hoàng Long',
      status: 'ACTIVE'
    }
  });

  // 3. Phòng Kế toán (Trực thuộc Ban Giám Đốc)
  const kt = await prisma.department.create({
    data: {
      code: 'KT',
      name: 'Phòng Kế toán',
      quota: 2,
      managerName: 'Nguyễn Thị Dung',
      parentId: bgd.id,
      status: 'ACTIVE'
    }
  });

  // 4. Phòng Sales (Trực thuộc Ban Giám Đốc)
  const sales = await prisma.department.create({
    data: {
      code: 'SALES',
      name: 'Phòng Sales',
      quota: 2,
      managerName: 'Phạm Thị Dung',
      parentId: bgd.id,
      status: 'ACTIVE'
    }
  });

  // 5. Khối IT (Trực thuộc Ban Giám Đốc)
  const it = await prisma.department.create({
    data: {
      code: 'IT',
      name: 'Khối Công nghệ Thông tin (IT)',
      quota: 19, // 2 (Test) + 6 (BA) + 11 (Dev)
      managerName: 'Ngô Xuân Cương',
      parentId: bgd.id,
      status: 'ACTIVE'
    }
  });

  // 5.1 Tổ Kiểm thử
  const test = await prisma.department.create({
    data: {
      code: 'TEST',
      name: 'Tổ Kiểm thử',
      quota: 2,
      managerName: 'Nguyễn Mai Phương',
      parentId: it.id,
      status: 'ACTIVE'
    }
  });

  // 5.2 Tổ Phân tích nghiệp vụ - BA
  const ba = await prisma.department.create({
    data: {
      code: 'BA',
      name: 'Tổ Phân tích nghiệp vụ (BA)',
      quota: 6,
      managerName: 'Trần Việt Anh',
      parentId: it.id,
      status: 'ACTIVE'
    }
  });

  // 5.3 Tổ Phát triển - Dev
  const dev = await prisma.department.create({
    data: {
      code: 'DEV',
      name: 'Tổ Phát triển (Dev)',
      quota: 11,
      managerName: 'Ngô Xuân Cương',
      parentId: it.id,
      status: 'ACTIVE'
    }
  });

  const allDepts = await prisma.department.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      quota: true,
      managerName: true,
      parent: { select: { name: true } }
    },
    orderBy: { code: 'asc' }
  });

  console.log('✅ ĐÃ THIẾT LẬP THÀNH CÔNG CÁC PHÒNG BAN:');
  console.table(allDepts.map(d => ({
    'Mã PB': d.code,
    'Tên phòng ban': d.name,
    'Định biên (Quota)': d.quota,
    'Người phụ trách / Trưởng đơn vị': d.managerName,
    'Trực thuộc': d.parent?.name || '(Gốc / Cấp cao nhất)'
  })));
}

setupDepartments()
  .catch((err) => {
    console.error('❌ Lỗi thiết lập phòng ban:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


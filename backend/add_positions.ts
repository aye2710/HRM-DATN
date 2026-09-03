import { prisma } from './src/db';

async function main() {
  console.log('Bắt đầu thêm dữ liệu Vị trí (Positions) có phân cấp Level...');

  // Lấy danh sách các phòng ban đã có
  const devDept = await prisma.department.findUnique({ where: { code: 'DEV' } });
  const testDept = await prisma.department.findUnique({ where: { code: 'TEST' } });
  const baDept = await prisma.department.findUnique({ where: { code: 'BA' } });
  const mktDept = await prisma.department.findUnique({ where: { code: 'MKT' } });
  const htDept = await prisma.department.findUnique({ where: { code: 'HT' } });
  const ktDept = await prisma.department.findUnique({ where: { code: 'KT' } });

  const positions = [];

  // ==========================================
  // KHỐI HẠ TẦNG & MARKETING & KẾ TOÁN
  // ==========================================
  if (mktDept) {
    positions.push(
      { title: 'Trưởng phòng Marketing', code: 'MKT_MGR', departmentId: mktDept.id, level: 'Manager' },
      { title: 'Chuyên viên Content', code: 'MKT_CONTENT', departmentId: mktDept.id, level: 'Staff' },
      { title: 'Chuyên viên Digital Marketing', code: 'MKT_DIGITAL', departmentId: mktDept.id, level: 'Staff' },
      { title: 'Nhân viên Thiết kế (Designer)', code: 'MKT_DES', departmentId: mktDept.id, level: 'Staff' }
    );
  }

  if (htDept) {
    positions.push(
      { title: 'Trưởng khối Hạ tầng', code: 'HT_MGR', departmentId: htDept.id, level: 'Manager' },
      { title: 'IT Helpdesk', code: 'HT_HELP', departmentId: htDept.id, level: 'Staff' },
      { title: 'Kỹ sư mạng', code: 'HT_NET', departmentId: htDept.id, level: 'Staff' }
    );
  }

  if (ktDept) {
    positions.push(
      { title: 'Kế toán tổng hợp', code: 'KT_TH', departmentId: ktDept.id, level: 'Staff' }
    );
  }

  // ==========================================
  // TỔ PHÁT TRIỂN (DEV) - Đủ 5 Level
  // ==========================================
  const levels = [
    { prefix: 'Thực tập sinh', suffix: '(Intern)', levelCode: 'Intern' },
    { prefix: 'Lập trình viên', suffix: '(Fresher)', levelCode: 'Fresher' },
    { prefix: 'Lập trình viên', suffix: '(Junior)', levelCode: 'Junior' },
    { prefix: 'Lập trình viên', suffix: '(Middle)', levelCode: 'Middle' },
    { prefix: 'Lập trình viên', suffix: 'Cao cấp (Senior)', levelCode: 'Senior' }
  ];

  if (devDept) {
    // Frontend
    levels.forEach((l, idx) => {
      positions.push({ title: `${l.prefix} Frontend ${l.suffix}`, code: `DEV_FE_${idx}`, departmentId: devDept.id, level: l.levelCode });
    });
    // Backend
    levels.forEach((l, idx) => {
      positions.push({ title: `${l.prefix} Backend ${l.suffix}`, code: `DEV_BE_${idx}`, departmentId: devDept.id, level: l.levelCode });
    });
    // Mobile
    levels.forEach((l, idx) => {
      positions.push({ title: `${l.prefix} Mobile ${l.suffix}`, code: `DEV_MB_${idx}`, departmentId: devDept.id, level: l.levelCode });
    });
    // DevOps (Chỉ cần Junior, Middle, Senior)
    positions.push(
      { title: 'Chuyên viên DevOps (Junior)', code: 'DEV_OPS_2', departmentId: devDept.id, level: 'Junior' },
      { title: 'Chuyên viên DevOps (Middle)', code: 'DEV_OPS_3', departmentId: devDept.id, level: 'Middle' },
      { title: 'Chuyên viên DevOps Cao cấp (Senior)', code: 'DEV_OPS_4', departmentId: devDept.id, level: 'Senior' }
    );
  }

  // ==========================================
  // TỔ KIỂM THỬ (TEST) - Đủ 5 Level
  // ==========================================
  if (testDept) {
    // Manual
    const testLevels = [
      { prefix: 'Thực tập sinh', suffix: '(Intern)', levelCode: 'Intern' },
      { prefix: 'Nhân viên Tester', suffix: '(Fresher)', levelCode: 'Fresher' },
      { prefix: 'Nhân viên Tester', suffix: '(Junior)', levelCode: 'Junior' },
      { prefix: 'Nhân viên Tester', suffix: '(Middle)', levelCode: 'Middle' },
      { prefix: 'Chuyên viên Tester', suffix: 'Cao cấp (Senior)', levelCode: 'Senior' }
    ];
    testLevels.forEach((l, idx) => {
      positions.push({ title: `${l.prefix} ${l.suffix}`, code: `TEST_MN_${idx}`, departmentId: testDept.id, level: l.levelCode });
    });

    // Automation
    positions.push(
      { title: 'Kỹ sư Test Tự động (Junior)', code: 'TEST_AUTO_2', departmentId: testDept.id, level: 'Junior' },
      { title: 'Kỹ sư Test Tự động (Middle)', code: 'TEST_AUTO_3', departmentId: testDept.id, level: 'Middle' },
      { title: 'Kỹ sư Test Tự động Cao cấp (Senior)', code: 'TEST_AUTO_4', departmentId: testDept.id, level: 'Senior' }
    );
  }

  // ==========================================
  // TỔ PHÂN TÍCH (BA) - Đủ 5 Level
  // ==========================================
  if (baDept) {
    const baLevels = [
      { prefix: 'Thực tập sinh', suffix: 'BA (Intern)', levelCode: 'Intern' },
      { prefix: 'Chuyên viên Phân tích', suffix: '(Fresher)', levelCode: 'Fresher' },
      { prefix: 'Chuyên viên Phân tích', suffix: '(Junior)', levelCode: 'Junior' },
      { prefix: 'Chuyên viên Phân tích', suffix: '(Middle)', levelCode: 'Middle' },
      { prefix: 'Chuyên viên Phân tích', suffix: 'Cao cấp (Senior)', levelCode: 'Senior' }
    ];
    baLevels.forEach((l, idx) => {
      positions.push({ title: `${l.prefix} ${l.suffix}`, code: `BA_${idx}`, departmentId: baDept.id, level: l.levelCode });
    });
  }

  // Chèn vào Database (Bỏ qua nếu đã tồn tại code)
  let count = 0;
  for (const pos of positions) {
    const exists = await prisma.position.findUnique({ where: { code: pos.code } });
    if (!exists) {
      await prisma.position.create({
        data: {
          code: pos.code,
          title: pos.title,
          level: pos.level,
          departmentId: pos.departmentId,
          minSalary: 5000000,
          maxSalary: 30000000,
          status: 'ACTIVE'
        }
      });
      count++;
    }
  }

  console.log(`Đã gieo thành công ${count} vị trí chức danh các cấp!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

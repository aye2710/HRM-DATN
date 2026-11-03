import { prisma } from '../src/db';
import bcrypt from 'bcryptjs';

async function resetAllData() {
  console.log('🔄 Đang tiến hành xóa sạch dữ liệu trong database...');

  // 1. Truncate tất cả các bảng trong schema public (trừ migration)
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
            EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE';
        END LOOP;
    END $$;
  `);

  console.log('✅ Đã xóa toàn bộ dữ liệu nghiệp vụ!');

  // 2. Khởi tạo lại các Vai trò chuẩn (Roles)
  console.log('🔄 Đang khởi tạo lại các Vai trò mặc định...');
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Quản trị viên toàn quyền hệ thống'
    }
  });

  const hrRole = await prisma.role.create({
    data: {
      name: 'HR_MANAGER',
      description: 'Trưởng phòng / Quản lý Nhân sự'
    }
  });

  const empRole = await prisma.role.create({
    data: {
      name: 'EMPLOYEE',
      description: 'Cán bộ nhân viên nội bộ'
    }
  });

  // 3. Khởi tạo tài khoản Quản trị viên mặc định để có thể đăng nhập vào hệ thống
  console.log('🔄 Đang tạo tài khoản Quản trị viên (admin/123456)...');
  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.account.create({
    data: {
      username: 'admin',
      password: passwordHash,
      roleId: adminRole.id,
      isActive: true
    }
  });

  await prisma.account.create({
    data: {
      username: 'hr',
      password: passwordHash,
      roleId: hrRole.id,
      isActive: true
    }
  });

  console.log('=====================================================');
  console.log('🎉 ĐÃ RESET TOÀN BỘ CƠ SỞ DỮ LIỆU THÀNH CÔNG!');
  console.log('👉 Toàn bộ phòng ban, vị trí, nhân viên, tuyển dụng, chấm công, lương đã được xóa sạch.');
  console.log('👉 Tài khoản quản trị hệ thống sẵn sàng:');
  console.log('   - Admin: admin / 123456 (Role: ADMIN)');
  console.log('   - HR Manager: hr / 123456 (Role: HR_MANAGER)');
  console.log('=====================================================');
}

resetAllData()
  .catch((err) => {
    console.error('❌ Lỗi khi reset database:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


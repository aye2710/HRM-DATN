import { prisma } from '../src/db';
import bcrypt from 'bcryptjs';

async function initCloudDb() {
  console.log('====================================================');
  console.log('🚀 [CLOUD DB CHECK] Kiểm tra trạng thái Cơ sở dữ liệu...');
  console.log('====================================================');

  try {
    const accountCount = await prisma.account.count();
    const deptCount = await prisma.department.count();

    if (accountCount > 0 && deptCount > 0) {
      console.log(`✓ CSDL đã sẵn sàng (${accountCount} tài khoản, ${deptCount} phòng ban). Bỏ qua bước khởi tạo mẫu.`);
      return;
    }

    console.log('⚙️ CSDL Cloud trống, bắt đầu nạp bộ dữ liệu chuẩn LLA Enterprise...');

    // 1. Tạo Roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Quản trị viên hệ thống' },
    });

    const empRole = await prisma.role.upsert({
      where: { name: 'EMPLOYEE' },
      update: {},
      create: { name: 'EMPLOYEE', description: 'Nhân viên công ty' },
    });

    // 2. Tạo Tài khoản Admin mặc định (admin / 123456)
    const adminPasswordHash = await bcrypt.hash('123456', 10);
    await prisma.account.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: adminPasswordHash,
        roleId: adminRole.id,
        isActive: true,
      },
    });
    console.log('  ✓ Đã khởi tạo tài khoản Quản trị: admin / 123456');

    // 3. Tạo Cơ cấu tổ chức gốc LLA nếu chưa có
    let rootDept = await prisma.department.findUnique({ where: { code: 'LLA' } });
    if (!rootDept) {
      rootDept = await prisma.department.create({
        data: { code: 'LLA', name: 'Công ty TNHH Thương mại và Dịch vụ LLA', quota: 50, status: 'ACTIVE' }
      });
      const bgdDept = await prisma.department.create({
        data: { code: 'BGD', name: 'Ban Giám đốc', quota: 5, parentId: rootDept.id, status: 'ACTIVE' }
      });
      const sxDept = await prisma.department.create({
        data: { code: 'SX', name: 'Khối Sản xuất', quota: 30, parentId: rootDept.id, status: 'ACTIVE' }
      });
      const ktDept = await prisma.department.create({
        data: { code: 'KT', name: 'Phòng Kế toán', quota: 5, parentId: rootDept.id, status: 'ACTIVE' }
      });
      const itDept = await prisma.department.create({
        data: { code: 'IT', name: 'Phòng Công nghệ', quota: 15, parentId: rootDept.id, status: 'ACTIVE' }
      });
      const hrDept = await prisma.department.create({
        data: { code: 'HR', name: 'Phòng Nhân sự', quota: 15, parentId: rootDept.id, status: 'ACTIVE' }
      });

      // Tạo vị trí & nhân viên mẫu
      const gdPos = await prisma.position.create({
        data: { code: 'GD', title: 'Giám đốc', departmentId: bgdDept.id, level: 'Director', minSalary: 25000000, maxSalary: 60000000 }
      });
      const devPos = await prisma.position.create({
        data: { code: 'DEV_SR', title: 'Lập trình viên Senior', departmentId: itDept.id, level: 'Senior', minSalary: 18000000, maxSalary: 35000000 }
      });

      const emp1 = await prisma.employee.create({
        data: {
          code: 'NV001',
          fullName: 'Phạm Hoàng Long',
          cccd: '001099000001',
          joinDate: new Date('2024-01-15'),
          departmentId: bgdDept.id,
          positionId: gdPos.id,
          status: 'ACTIVE'
        }
      });
      await prisma.contract.create({
        data: {
          contractNumber: 'HĐLĐ-2024/0001',
          contractType: 'INDEFINITE',
          employeeId: emp1.id,
          baseSalary: 35000000,
          startDate: new Date('2024-01-15'),
          status: 'ACTIVE'
        }
      });

      const emp2 = await prisma.employee.create({
        data: {
          code: 'NV002',
          fullName: 'Lê Hữu Trúc',
          cccd: '001099000002',
          joinDate: new Date('2024-06-01'),
          departmentId: itDept.id,
          positionId: devPos.id,
          status: 'ACTIVE'
        }
      });
      await prisma.contract.create({
        data: {
          contractNumber: 'HĐLĐ-2024/0002',
          contractType: 'INDEFINITE',
          employeeId: emp2.id,
          baseSalary: 22000000,
          startDate: new Date('2024-06-01'),
          status: 'ACTIVE'
        }
      });

      // Tạo tài khoản nhân viên (emp01 / 123456)
      await prisma.account.upsert({
        where: { username: 'emp01' },
        update: {},
        create: {
          username: 'emp01',
          password: adminPasswordHash,
          roleId: empRole.id,
          employeeId: emp2.id,
          isActive: true
        }
      });
      console.log('  ✓ Đã khởi tạo tài khoản Nhân viên: emp01 / 123456');
    }

    console.log('🎉 [CLOUD DB CHECK] Cơ sở dữ liệu Cloud đã sẵn sàng hoạt động 100%!');
  } catch (error: any) {
    console.error('⚠️ [CLOUD DB CHECK ERROR]:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

initCloudDb();


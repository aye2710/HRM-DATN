import { prisma } from '../src/db';

async function resetAndSeedContracts() {
  console.log('🔄 Đang xóa toàn bộ dữ liệu hợp đồng cũ...');
  await prisma.contractAppendix.deleteMany({});
  await prisma.contract.deleteMany({});
  console.log('✅ Đã xóa sạch bảng Contract và ContractAppendix.');

  // Lấy toàn bộ danh sách nhân viên
  const employees = await prisma.employee.findMany({
    orderBy: { code: 'asc' }
  });

  console.log(`Tìm thấy ${employees.length} nhân sự để tạo hồ sơ hợp đồng chuẩn.`);

  let expiringCount = 0;
  let activeIndefiniteCount = 0;
  let activeDefiniteCount = 0;
  let terminatedCount = 0;

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const isResigned = emp.status === 'RESIGNED';
    const contractCode = `HĐLĐ-${2025 + (i % 2)}/${String(i + 1).padStart(4, '0')}`;
    const baseSalary = 12000000 + (i % 8) * 2000000;
    const allowance = (i % 3 === 0) ? 2000000 : 0;

    // 1. Nếu là nhân viên đã thôi việc -> Tạo hợp đồng ĐÃ CHẤM DỨT (TERMINATED)
    if (isResigned) {
      await prisma.contract.create({
        data: {
          employeeId: emp.id,
          contractNumber: contractCode,
          contractType: 'OFFICIAL_1Y',
          baseSalary: baseSalary,
          allowance: allowance,
          insuranceSalary: baseSalary,
          startDate: new Date('2025-06-01'),
          endDate: new Date('2026-10-15'),
          signDate: new Date('2025-05-25'),
          signBy: 'Ban Giám Đốc',
          workLocation: 'Trụ sở chính',
          status: 'TERMINATED',
          appendixNote: 'Đã hoàn tất thanh lý hợp đồng và bàn giao công việc theo quyết định thôi việc.'
        }
      });
      terminatedCount++;
      continue;
    }

    // 2. Tạo 3 trường hợp SẮP HẾT HẠN (≤ 30 ngày) để phục vụ cảnh báo & test tính năng Tái ký
    if (expiringCount < 3 && i >= 2) {
      const expiringDays = [16, 22, 28][expiringCount];
      const endDate = new Date('2026-11-04');
      endDate.setDate(endDate.getDate() + expiringDays);

      const startDate = new Date(endDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setDate(startDate.getDate() + 1);

      await prisma.contract.create({
        data: {
          employeeId: emp.id,
          contractNumber: contractCode,
          contractType: expiringCount === 2 ? 'PROBATION' : 'OFFICIAL_1Y',
          baseSalary: baseSalary,
          allowance: allowance,
          insuranceSalary: baseSalary,
          startDate: startDate,
          endDate: endDate,
          signDate: startDate,
          signBy: 'Tổng Giám Đốc',
          workLocation: 'Trụ sở chính',
          status: 'ACTIVE',
          appendixNote: 'Hợp đồng sắp đến kỳ xem xét đánh giá gia hạn / ký tiếp theo quy chế công ty.'
        }
      });
      expiringCount++;
      continue;
    }

    // 3. Các nhân sự chính thức còn lại: Phân bổ giữa "Không thời hạn" và "Có thời hạn còn hạn dài"
    if (i % 2 === 0) {
      // Hợp đồng KHÔNG THỜI HẠN (Dài hạn, an toàn)
      await prisma.contract.create({
        data: {
          employeeId: emp.id,
          contractNumber: contractCode,
          contractType: 'INDEFINITE',
          baseSalary: baseSalary,
          allowance: allowance,
          insuranceSalary: baseSalary,
          startDate: new Date('2024-03-01'),
          endDate: null,
          signDate: new Date('2024-02-25'),
          signBy: 'Tổng Giám Đốc',
          workLocation: 'Trụ sở chính',
          status: 'ACTIVE',
          appendixNote: 'Hợp đồng lao động không xác định thời hạn chính thức.'
        }
      });
      activeIndefiniteCount++;
    } else {
      // Hợp đồng CÓ THỜI HẠN CÒN HẠN DÀI (Hạn đến giữa/cuối năm 2027)
      await prisma.contract.create({
        data: {
          employeeId: emp.id,
          contractNumber: contractCode,
          contractType: 'OFFICIAL_1Y',
          baseSalary: baseSalary,
          allowance: allowance,
          insuranceSalary: baseSalary,
          startDate: new Date('2026-05-01'),
          endDate: new Date('2027-04-30'),
          signDate: new Date('2026-04-25'),
          signBy: 'Tổng Giám Đốc',
          workLocation: 'Trụ sở chính',
          status: 'ACTIVE',
          appendixNote: 'Hợp đồng lao động xác định thời hạn 1 năm còn hạn dài.'
        }
      });
      activeDefiniteCount++;
    }
  }

  console.log('======================================================');
  console.log('🎉 ĐÃ RESET VÀ TẠO DỮ LIỆU HỢP ĐỒNG MỚI THÀNH CÔNG:');
  console.log(`- Đang hiệu lực (Không thời hạn): ${activeIndefiniteCount}`);
  console.log(`- Đang hiệu lực (Có thời hạn dài đến 2027): ${activeDefiniteCount}`);
  console.log(`- Sắp hết hạn (≤ 30 ngày để demo cảnh báo & tái ký): ${expiringCount}`);
  console.log(`- Đã chấm dứt (Nhân sự đã nghỉ việc): ${terminatedCount}`);
  console.log(`- Hết hạn / Quá hạn: 0 (Đã dọn dẹp sạch sẽ)`);
  console.log('======================================================');
}

resetAndSeedContracts()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


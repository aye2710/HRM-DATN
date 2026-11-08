import { prisma } from '../src/db';

async function seedLeaveData() {
  console.log('--- Bắt đầu nạp dữ liệu chuẩn cho Module Nghỉ phép ---');

  // 1. Lấy danh sách nhân viên hiện có
  const employees = await prisma.employee.findMany();
  if (employees.length === 0) {
    console.error('Không tìm thấy nhân viên nào trong hệ thống!');
    return;
  }
  console.log(`Tìm thấy ${employees.length} nhân viên.`);

  const tuan = employees.find(e => e.code === 'NV-2026-001') || employees[0];
  const anh = employees.find(e => e.code === 'NV-2026-002') || employees[1] || employees[0];
  const bao = employees.find(e => e.code === 'NV-2026-003') || employees[2] || employees[0];

  // 2. Nạp Lịch Nghỉ Lễ năm 2026 (Điều 112 BLLĐ 2019)
  const holidaysData = [
    { name: 'Tết Dương Lịch 2026', date: new Date('2026-01-01T00:00:00.000Z') },
    { name: 'Tết Nguyên Đán 2026 (Mùng 1)', date: new Date('2026-02-17T00:00:00.000Z') },
    { name: 'Tết Nguyên Đán 2026 (Mùng 2)', date: new Date('2026-02-18T00:00:00.000Z') },
    { name: 'Tết Nguyên Đán 2026 (Mùng 3)', date: new Date('2026-02-19T00:00:00.000Z') },
    { name: 'Tết Nguyên Đán 2026 (Mùng 4)', date: new Date('2026-02-20T00:00:00.000Z') },
    { name: 'Tết Nguyên Đán 2026 (Mùng 5)', date: new Date('2026-02-21T00:00:00.000Z') },
    { name: 'Giỗ Tổ Hùng Vương (10/3 ÂL)', date: new Date('2026-04-26T00:00:00.000Z') },
    { name: 'Ngày Chiến thắng 30/4', date: new Date('2026-04-30T00:00:00.000Z') },
    { name: 'Ngày Quốc tế Lao động 1/5', date: new Date('2026-05-01T00:00:00.000Z') },
    { name: 'Ngày Quốc khánh 2/9', date: new Date('2026-09-02T00:00:00.000Z') },
    { name: 'Nghỉ liền kề Quốc khánh 3/9', date: new Date('2026-09-03T00:00:00.000Z') }
  ];

  for (const h of holidaysData) {
    const exist = await prisma.holiday.findFirst({ where: { date: h.date } });
    if (!exist) {
      await prisma.holiday.create({ data: h });
    }
  }
  console.log(`✓ Đã nạp ${holidaysData.length} ngày nghỉ Lễ/Tết năm 2026`);

  // 3. Nạp Cấu hình Loại phép (LeaveTypeConfig)
  const typesData = [
    {
      name: 'Nghỉ phép năm có lương',
      code: 'AL',
      defaultDays: 12,
      paid: true,
      carryForward: true,
      status: 'Hoạt động'
    },
    {
      name: 'Nghỉ việc riêng không lương',
      code: 'UL',
      defaultDays: 0,
      paid: false,
      carryForward: false,
      status: 'Hoạt động'
    },
    {
      name: 'Nghỉ ốm đau (Hưởng chế độ BHXH)',
      code: 'SL',
      defaultDays: 30,
      paid: false,
      carryForward: false,
      status: 'Hoạt động'
    },
    {
      name: 'Nghỉ thai sản (Hưởng chế độ BHXH)',
      code: 'ML',
      defaultDays: 180,
      paid: false,
      carryForward: false,
      status: 'Hoạt động'
    },
    {
      name: 'Nghỉ việc riêng có lương (Cưới, Tang)',
      code: 'FL',
      defaultDays: 3,
      paid: true,
      carryForward: false,
      status: 'Hoạt động'
    }
  ];

  for (const t of typesData) {
    const exist = await prisma.leaveTypeConfig.findFirst({ where: { code: t.code } });
    if (!exist) {
      await prisma.leaveTypeConfig.create({ data: t });
    }
  }
  console.log(`✓ Đã nạp ${typesData.length} loại nghỉ phép chuẩn`);

  // 4. Nạp Cấu hình Chính sách Thâm niên (LeavePolicy)
  const policiesData = [
    {
      name: 'Phép thâm niên 5 năm (Điều 114 BLLĐ)',
      type: 'Nghỉ phép năm',
      seniority: '5 năm',
      extraDays: '1',
      maxDays: '20'
    },
    {
      name: 'Phép thâm niên 10 năm (Điều 114 BLLĐ)',
      type: 'Nghỉ phép năm',
      seniority: '10 năm',
      extraDays: '2',
      maxDays: '20'
    },
    {
      name: 'Phép thâm niên 15 năm (Điều 114 BLLĐ)',
      type: 'Nghỉ phép năm',
      seniority: '15 năm',
      extraDays: '3',
      maxDays: '20'
    }
  ];

  for (const p of policiesData) {
    const exist = await prisma.leavePolicy.findFirst({ where: { name: p.name } });
    if (!exist) {
      await prisma.leavePolicy.create({ data: p });
    }
  }
  console.log(`✓ Đã nạp ${policiesData.length} chính sách thâm niên`);

  // 5. Khởi tạo Quỹ phép năm (LeaveBalance) 2026 cho các nhân viên
  const balancesData = [
    { employeeId: tuan.id, year: 2026, totalDays: 12, usedDays: 2.0 },
    { employeeId: anh.id, year: 2026, totalDays: 12, usedDays: 1.0 },
    { employeeId: bao.id, year: 2026, totalDays: 12, usedDays: 0.0 }
  ];

  for (const b of balancesData) {
    const exist = await prisma.leaveBalance.findFirst({
      where: { employeeId: b.employeeId, year: b.year }
    });
    if (!exist) {
      await prisma.leaveBalance.create({ data: b });
    } else {
      await prisma.leaveBalance.update({
        where: { id: exist.id },
        data: { totalDays: b.totalDays, usedDays: b.usedDays }
      });
    }
  }
  console.log(`✓ Đã cập nhật Quỹ phép năm 2026 cho các nhân viên`);

  // 6. Xóa các đơn cũ (nếu có) và nạp đơn xin nghỉ phép phong phú
  await prisma.leaveRequest.deleteMany({});

  const requestsData = [
    {
      employeeId: tuan.id,
      leaveType: 'PAID' as any,
      session: 'MORNING',
      startDate: new Date('2026-11-12T00:00:00.000Z'),
      endDate: new Date('2026-11-12T00:00:00.000Z'),
      reason: 'Khám sức khỏe định kỳ theo chỉ định bác sĩ',
      status: 'APPROVED' as any,
      createdAt: new Date('2026-11-09T08:30:00.000Z')
    },
    {
      employeeId: anh.id,
      leaveType: 'PAID' as any,
      session: 'ALL_DAY',
      startDate: new Date('2026-11-06T00:00:00.000Z'),
      endDate: new Date('2026-11-06T00:00:00.000Z'),
      reason: 'Giải quyết thủ tục hành chính tại cơ quan nhà nước',
      status: 'APPROVED' as any,
      createdAt: new Date('2026-11-04T09:15:00.000Z')
    },
    {
      employeeId: bao.id,
      leaveType: 'PAID' as any,
      session: 'ALL_DAY',
      startDate: new Date('2026-11-19T00:00:00.000Z'),
      endDate: new Date('2026-11-20T00:00:00.000Z'),
      reason: 'Về quê việc gia đình (2 ngày làm việc)',
      status: 'PENDING' as any,
      createdAt: new Date('2026-11-15T10:00:00.000Z')
    },
    {
      employeeId: tuan.id,
      leaveType: 'PAID' as any,
      session: 'ALL_DAY',
      startDate: new Date('2026-11-25T00:00:00.000Z'),
      endDate: new Date('2026-11-27T00:00:00.000Z'),
      reason: '[Bàn giao: Đặng Quốc Bảo] Gia đình có việc đại sự tại quê nhà [Cấp duyệt: BGĐ (> 2 ngày)]',
      status: 'PENDING' as any,
      createdAt: new Date('2026-11-18T14:20:00.000Z')
    },
    {
      employeeId: anh.id,
      leaveType: 'UNPAID' as any,
      session: 'AFTERNOON',
      startDate: new Date('2026-11-23T00:00:00.000Z'),
      endDate: new Date('2026-11-23T00:00:00.000Z'),
      reason: 'Việc riêng gia đình đột xuất buổi chiều (xin nghỉ không lương)',
      status: 'PENDING' as any,
      createdAt: new Date('2026-11-21T11:45:00.000Z')
    },
    {
      employeeId: bao.id,
      leaveType: 'PAID' as any,
      session: 'ALL_DAY',
      startDate: new Date('2026-11-10T00:00:00.000Z'),
      endDate: new Date('2026-11-10T00:00:00.000Z'),
      reason: 'Trùng đợt triển khai Sprint Release quan trọng, yêu cầu đổi sang ngày khác',
      status: 'REJECTED' as any,
      createdAt: new Date('2026-11-08T16:10:00.000Z')
    }
  ];

  for (const req of requestsData) {
    await prisma.leaveRequest.create({ data: req });
  }
  console.log(`✓ Đã nạp ${requestsData.length} đơn xin nghỉ phép phong phú`);

  // 7. Đồng bộ bản ghi Attendance cho các đơn APPROVED
  // Tuấn: 12/11/2026 - Nửa ngày sáng (0.5 công)
  const tuanDate = new Date('2026-11-12T00:00:00.000Z');
  const existTuanAtt = await prisma.attendance.findFirst({
    where: { employeeId: tuan.id, date: tuanDate }
  });
  if (existTuanAtt) {
    await prisma.attendance.update({
      where: { id: existTuanAtt.id },
      data: { status: 'ON_LEAVE', workingDay: 0.5 }
    });
  } else {
    await prisma.attendance.create({
      data: { employeeId: tuan.id, date: tuanDate, status: 'ON_LEAVE', workingDay: 0.5 }
    });
  }

  // Ánh: 06/11/2026 - Cả ngày (1.0 công)
  const anhDate = new Date('2026-11-06T00:00:00.000Z');
  const existAnhAtt = await prisma.attendance.findFirst({
    where: { employeeId: anh.id, date: anhDate }
  });
  if (existAnhAtt) {
    await prisma.attendance.update({
      where: { id: existAnhAtt.id },
      data: { status: 'ON_LEAVE', workingDay: 1.0 }
    });
  } else {
    await prisma.attendance.create({
      data: { employeeId: anh.id, date: anhDate, status: 'ON_LEAVE', workingDay: 1.0 }
    });
  }
  console.log(`✓ Đã đồng bộ các đơn APPROVED sang Bảng Chấm Công (ON_LEAVE: 1.0 công và 0.5 công)`);

  console.log('--- HOÀN TẤT NẠP DỮ LIỆU NGHỈ PHÉP THÀNH CÔNG ---');
}

seedLeaveData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

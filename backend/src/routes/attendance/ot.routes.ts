import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const managerOrHr = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER');

/**
 * Tự động đối soát đơn làm thêm giờ (OT) với dữ liệu quẹt thẻ thực tế trong bảng Attendance:
 * - Đối chiếu giờ quẹt thẻ ra (checkOut) với giờ tan ca chuẩn (17:30).
 * - Trường hợp Chủ nhật (dayOfWeek === 0): tính thời gian từ checkIn đến checkOut.
 * - Đánh giá trạng thái đối soát:
 *   + QUALIFIED: Quẹt ra sau mốc (17:30 + requestHours) -> Đủ điều kiện công nhận đủ giờ theo đơn.
 *   + UNDER_HOURS: Quẹt ra sau 17:30 nhưng trước mốc đơn xin (ví dụ xin 4h nhưng quẹt ra 19:00 = 1.5h) -> Tự động gợi ý hạ xuống 1.5h.
 *   + ZERO_OT: Quẹt ra <= 17:30 hoặc ở lại dưới 30 phút -> Không có giờ làm thêm.
 *   + NO_CHECKOUT: Không có dữ liệu quẹt thẻ ra (checkOut == null).
 *   + PENDING_TIME: Đơn trong ngày hôm nay hoặc tương lai và ca làm việc chưa kết thúc (trước 17:30).
 */
export async function enrichOTRequestsWithAttendance(requests: any[]) {
  if (!requests || requests.length === 0) return [];

  const employeeIds = Array.from(new Set(requests.map(r => r.employeeId)));
  const dates = requests.map(r => new Date(r.date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  minDate.setHours(0, 0, 0, 0);
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  maxDate.setHours(23, 59, 59, 999);

  // Đọc mốc giờ tan ca từ bảng SystemSetting nếu có (mặc định 17:30)
  let standardShiftEndTime = '17:30';
  try {
    const shiftEndSetting = await prisma.systemSetting.findUnique({
      where: { key: 'STANDARD_SHIFT_END_TIME' }
    });
    if (shiftEndSetting?.value && shiftEndSetting.value.includes(':')) {
      standardShiftEndTime = shiftEndSetting.value.trim();
    }
  } catch (e) {
    // fallback 17:30
  }

  const [endH, endM] = standardShiftEndTime.split(':').map(Number);

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: employeeIds },
      date: { gte: minDate, lte: maxDate }
    },
    select: {
      employeeId: true,
      date: true,
      checkIn: true,
      checkOut: true,
      status: true,
      workingDay: true
    }
  });

  const attMap: Record<string, any> = {};
  for (const att of attendances) {
    const dStr = att.date instanceof Date ? att.date.toISOString().split('T')[0] : String(att.date).split('T')[0];
    attMap[`${att.employeeId}_${dStr}`] = att;
  }

  const now = new Date();

  return requests.map(req => {
    const reqDate = new Date(req.date);
    const dStr = reqDate.toISOString().split('T')[0];
    const att = attMap[`${req.employeeId}_${dStr}`];

    const checkIn = att?.checkIn ? new Date(att.checkIn) : null;
    const checkOut = att?.checkOut ? new Date(att.checkOut) : null;

    const checkInFormatted = checkIn
      ? `${String(checkIn.getHours()).padStart(2, '0')}:${String(checkIn.getMinutes()).padStart(2, '0')}`
      : null;
    const checkOutFormatted = checkOut
      ? `${String(checkOut.getHours()).padStart(2, '0')}:${String(checkOut.getMinutes()).padStart(2, '0')}`
      : null;

    const reqHours = Number(req.requestHours || 0);

    const shiftEnd = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate(), endH || 17, endM || 30, 0);
    const isToday = reqDate.toDateString() === now.toDateString();
    const isFuture = reqDate > now && !isToday;
    const isShiftOngoing = isToday && now < shiftEnd;

    let stayHours = 0;
    let complianceStatus: 'QUALIFIED' | 'UNDER_HOURS' | 'ZERO_OT' | 'NO_CHECKOUT' | 'PENDING_TIME';
    let complianceTitle = '';
    let complianceMessage = '';
    let color: 'green' | 'amber' | 'red' | 'gray' = 'gray';

    if (isFuture || isShiftOngoing) {
      complianceStatus = 'PENDING_TIME';
      complianceTitle = 'Chưa hết ca làm';
      complianceMessage = `Ca làm việc chưa kết thúc (Dự kiến OT từ ${standardShiftEndTime}). Vui lòng nghiệm thu sau khi nhân viên kết thúc ca và quẹt thẻ ra.`;
      stayHours = 0;
      color = 'gray';
    } else if (!checkOut) {
      complianceStatus = 'NO_CHECKOUT';
      complianceTitle = 'Thiếu quẹt thẻ ra';
      complianceMessage = 'Không tìm thấy dữ liệu quẹt thẻ ra (Check-out) của nhân viên trong ngày này trên máy chấm công.';
      stayHours = 0;
      color = 'red';
    } else {
      const dayOfWeek = reqDate.getDay(); // 0 = Chủ nhật
      if (dayOfWeek === 0) {
        // Chủ nhật: tính toàn bộ thời gian có mặt giữa checkIn và checkOut
        if (checkIn) {
          const diffMs = checkOut.getTime() - checkIn.getTime();
          stayHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
        } else {
          stayHours = 0;
        }
      } else {
        // Ngày thường và Thứ 7: Tính thời gian ở lại sau mốc tan ca chuẩn (17:30)
        const checkOutOnDate = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate(), checkOut.getHours(), checkOut.getMinutes(), 0);
        const diffMs = checkOutOnDate.getTime() - shiftEnd.getTime();
        if (diffMs > 0) {
          stayHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        } else {
          stayHours = 0;
        }
      }

      if (stayHours >= reqHours) {
        complianceStatus = 'QUALIFIED';
        complianceTitle = 'Đạt yêu cầu';
        complianceMessage = `Quẹt ra lúc ${checkOutFormatted} (ở lại ${stayHours}h ≥ ${reqHours}h theo đơn). Đủ điều kiện nghiệm thu đủ ${reqHours}h.`;
        color = 'green';
      } else if (stayHours >= 0.5) {
        complianceStatus = 'UNDER_HOURS';
        complianceTitle = 'Về sớm / Thiếu giờ';
        complianceMessage = `Quẹt ra lúc ${checkOutFormatted} (chỉ ở lại ${stayHours}h / ${reqHours}h theo đơn). Hệ thống tự động giới hạn nghiệm thu ở mức ${stayHours}h.`;
        color = 'amber';
      } else {
        complianceStatus = 'ZERO_OT';
        complianceTitle = 'Không có giờ OT';
        complianceMessage = `Quẹt ra lúc ${checkOutFormatted} (≤ ${standardShiftEndTime} hoặc ở lại < 30 phút). Nhân viên về đúng giờ ca thường, không có thời gian làm thêm.`;
        color = 'red';
      }
    }

    const suggestedHours = complianceStatus === 'QUALIFIED'
      ? reqHours
      : (complianceStatus === 'UNDER_HOURS' ? stayHours : 0);

    return {
      ...req,
      crossCheck: {
        hasAttendance: !!att,
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        checkInFormatted,
        checkOutFormatted,
        shiftEndTime: standardShiftEndTime,
        stayHours,
        suggestedHours,
        complianceStatus,
        complianceTitle,
        complianceMessage,
        color
      }
    };
  });
}

/**
 * Khởi tạo bộ dữ liệu OT mẫu chuẩn hóa, khớp 100% với dữ liệu chấm công:
 * 1. Đã duyệt (Đạt đủ giờ)
 * 2. Chờ duyệt (Về sớm / Thiếu giờ)
 * 3. Chờ duyệt (Đạt đủ giờ)
 * 4. Từ chối (Về đúng ca không OT)
 * 5. Chờ duyệt (Thiếu log quẹt ra)
 */
export async function resetOTSampleData() {
  const allEmployees = await prisma.employee.findMany({
    orderBy: { code: 'asc' },
    take: 50,
    select: {
      id: true,
      fullName: true,
      code: true,
      departmentId: true,
      department: { select: { id: true, name: true } }
    }
  });
  if (!allEmployees || allEmployees.length === 0) return;

  // 1. Tìm phòng Nhân sự (HR)
  const hrDept = await prisma.department.findFirst({
    where: {
      OR: [
        { code: 'HR' },
        { name: { contains: 'Nhân sự', mode: 'insensitive' } }
      ]
    }
  });

  // 2. Tìm phòng Công nghệ / Kỹ thuật (IT)
  const itDept = await prisma.department.findFirst({
    where: {
      OR: [
        { code: 'IT' },
        { name: { contains: 'Công nghệ', mode: 'insensitive' } },
        { name: { contains: 'Kỹ thuật', mode: 'insensitive' } }
      ]
    }
  });

  // Đảm bảo nhân viên đại diện cho từng phòng ban để test bộ lọc Phòng ban
  let hrEmployees = allEmployees.filter(e => (hrDept && e.departmentId === hrDept.id) || e.department?.name?.includes('Nhân sự'));
  if (hrEmployees.length === 0 && hrDept && allEmployees.length >= 2) {
    const updated1 = await prisma.employee.update({
      where: { id: allEmployees[1].id },
      data: { departmentId: hrDept.id },
      select: { id: true, fullName: true, code: true, departmentId: true, department: { select: { id: true, name: true } } }
    });
    hrEmployees = [updated1];
    if (allEmployees.length >= 3) {
      const updated2 = await prisma.employee.update({
        where: { id: allEmployees[2].id },
        data: { departmentId: hrDept.id },
        select: { id: true, fullName: true, code: true, departmentId: true, department: { select: { id: true, name: true } } }
      });
      hrEmployees.push(updated2);
    }
  }

  let itEmployees = allEmployees.filter(e => (itDept && e.departmentId === itDept.id) || e.department?.name?.includes('Công nghệ') || e.department?.name?.includes('Kỹ thuật'));
  if (itEmployees.length === 0 && itDept && allEmployees.length >= 4) {
    const updatedIT = await prisma.employee.update({
      where: { id: allEmployees[3].id },
      data: { departmentId: itDept.id },
      select: { id: true, fullName: true, code: true, departmentId: true, department: { select: { id: true, name: true } } }
    });
    itEmployees = [updatedIT];
  }

  let otherEmployees = allEmployees.filter(e => !hrEmployees.some(h => h.id === e.id) && !itEmployees.some(it => it.id === e.id));
  if (otherEmployees.length === 0) otherEmployees = allEmployees;

  const empHR1 = hrEmployees[0] || allEmployees[0];
  const empHR2 = hrEmployees[1] || hrEmployees[0] || allEmployees[0];
  const empIT1 = itEmployees[0] || allEmployees[1] || allEmployees[0];
  const empIT2 = itEmployees[1] || itEmployees[0] || allEmployees[1] || allEmployees[0];
  const empOther1 = otherEmployees[0] || allEmployees[0];
  const empOther2 = otherEmployees[1] || otherEmployees[0] || allEmployees[0];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Xóa toàn bộ đơn OT cũ để khởi tạo chuẩn mới
  await prisma.oTRequest.deleteMany({});

  // 1. [Phòng Nhân sự] Đơn 1: ĐÃ DUYỆT - ĐẠT ĐỦ ĐIỀU KIỆN (Ngày 4: Xin 2.0h, Quẹt ra 19:40 = 2.1h >= 2.0h)
  const d4 = new Date(currentYear, currentMonth, 4);
  await prisma.oTRequest.create({
    data: {
      employeeId: empHR1.id,
      date: d4,
      requestHours: 2.0 as any,
      actualHours: 2.0 as any,
      reason: 'Xử lý hồ sơ BHXH & Quyết toán dữ liệu nhân sự tháng ngoài giờ',
      status: 'APPROVED'
    }
  });
  const att4 = await prisma.attendance.findFirst({ where: { employeeId: empHR1.id, date: d4 } });
  if (att4) {
    await prisma.attendance.update({
      where: { id: att4.id },
      data: {
        checkIn: new Date(currentYear, currentMonth, 4, 7, 50, 0),
        checkOut: new Date(currentYear, currentMonth, 4, 19, 40, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: empHR1.id,
        date: d4,
        checkIn: new Date(currentYear, currentMonth, 4, 7, 50, 0),
        checkOut: new Date(currentYear, currentMonth, 4, 19, 40, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  }

  // 2. [Phòng Nhân sự] Đơn 2: CHỜ DUYỆT - VỀ SỚM / THIẾU GIỜ (Ngày 17: Xin 3.0h, Quẹt ra 19:00 = 1.5h < 3.0h)
  const d17 = new Date(currentYear, currentMonth, 17);
  await prisma.oTRequest.create({
    data: {
      employeeId: empHR2.id,
      date: d17,
      requestHours: 3.0 as any,
      actualHours: 0 as any,
      reason: 'Phỏng vấn ứng viên tuyển dụng đợt 2 ngoài giờ',
      status: 'PENDING'
    }
  });
  const att17 = await prisma.attendance.findFirst({ where: { employeeId: empHR2.id, date: d17 } });
  if (att17) {
    await prisma.attendance.update({
      where: { id: att17.id },
      data: {
        checkIn: new Date(currentYear, currentMonth, 17, 7, 55, 0),
        checkOut: new Date(currentYear, currentMonth, 17, 19, 0, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: empHR2.id,
        date: d17,
        checkIn: new Date(currentYear, currentMonth, 17, 7, 55, 0),
        checkOut: new Date(currentYear, currentMonth, 17, 19, 0, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  }

  // 3. [Phòng Nhân sự] Đơn 3: CHỜ DUYỆT - ĐẠT ĐỦ ĐIỀU KIỆN (Ngày 20: Xin 2.0h, Quẹt ra 20:30 = 3.0h >= 2.0h)
  const d20 = new Date(currentYear, currentMonth, 20);
  await prisma.oTRequest.create({
    data: {
      employeeId: empHR1.id,
      date: d20,
      requestHours: 2.0 as any,
      actualHours: 0 as any,
      reason: 'Hoàn thiện hồ sơ đánh giá KPI quý và chuẩn bị họp khen thưởng',
      status: 'PENDING'
    }
  });
  const att20 = await prisma.attendance.findFirst({ where: { employeeId: empHR1.id, date: d20 } });
  if (att20) {
    await prisma.attendance.update({
      where: { id: att20.id },
      data: {
        checkIn: new Date(currentYear, currentMonth, 20, 8, 0, 0),
        checkOut: new Date(currentYear, currentMonth, 20, 20, 30, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: empHR1.id,
        date: d20,
        checkIn: new Date(currentYear, currentMonth, 20, 8, 0, 0),
        checkOut: new Date(currentYear, currentMonth, 20, 20, 30, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  }

  // 4. [Phòng Công nghệ / IT] Đơn 4: ĐÃ DUYỆT - ĐẠT ĐỦ ĐIỀU KIỆN (Ngày 6: Xin 3.0h, Quẹt ra 21:00 = 3.5h >= 3.0h)
  const d6 = new Date(currentYear, currentMonth, 6);
  await prisma.oTRequest.create({
    data: {
      employeeId: empIT1.id,
      date: d6,
      requestHours: 3.0 as any,
      actualHours: 3.0 as any,
      reason: 'Fix bug release & Triển khai HRM giai đoạn 2 ngoài giờ',
      status: 'APPROVED'
    }
  });
  const att6 = await prisma.attendance.findFirst({ where: { employeeId: empIT1.id, date: d6 } });
  if (att6) {
    await prisma.attendance.update({
      where: { id: att6.id },
      data: {
        checkIn: new Date(currentYear, currentMonth, 6, 7, 50, 0),
        checkOut: new Date(currentYear, currentMonth, 6, 21, 0, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: empIT1.id,
        date: d6,
        checkIn: new Date(currentYear, currentMonth, 6, 7, 50, 0),
        checkOut: new Date(currentYear, currentMonth, 6, 21, 0, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  }

  // 5. [Phòng Công nghệ / IT] Đơn 5: CHỜ DUYỆT - ĐẠT ĐỦ GIỜ 4H KỊCH TRẦN (Ngày 13: Xin 4.0h, Quẹt ra 21:35 = 4.1h >= 4.0h)
  const d13 = new Date(currentYear, currentMonth, 13);
  await prisma.oTRequest.create({
    data: {
      employeeId: empIT2.id,
      date: d13,
      requestHours: 4.0 as any,
      actualHours: 0 as any,
      reason: 'Trực kỹ thuật triển khai bản vá bảo mật hệ thống toàn công ty',
      status: 'PENDING'
    }
  });
  const att13 = await prisma.attendance.findFirst({ where: { employeeId: empIT2.id, date: d13 } });
  if (att13) {
    await prisma.attendance.update({
      where: { id: att13.id },
      data: {
        checkIn: new Date(currentYear, currentMonth, 13, 7, 48, 0),
        checkOut: new Date(currentYear, currentMonth, 13, 21, 35, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: empIT2.id,
        date: d13,
        checkIn: new Date(currentYear, currentMonth, 13, 7, 48, 0),
        checkOut: new Date(currentYear, currentMonth, 13, 21, 35, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  }

  // 6. [Phòng Công nghệ / IT] Đơn 6: TỪ CHỐI - VỀ ĐÚNG GIỜ CA THƯỜNG (Ngày 18: Xin 1.5h, Quẹt ra 17:35 = 5 phút sau ca < 30p)
  const d18 = new Date(currentYear, currentMonth, 18);
  await prisma.oTRequest.create({
    data: {
      employeeId: empIT1.id,
      date: d18,
      requestHours: 1.5 as any,
      actualHours: 0 as any,
      reason: 'Làm bù tài liệu thiết kế hệ thống theo chỉ đạo Trưởng phòng',
      status: 'REJECTED'
    }
  });
  const att18 = await prisma.attendance.findFirst({ where: { employeeId: empIT1.id, date: d18 } });
  if (att18) {
    await prisma.attendance.update({
      where: { id: att18.id },
      data: {
        checkIn: new Date(currentYear, currentMonth, 18, 7, 58, 0),
        checkOut: new Date(currentYear, currentMonth, 18, 17, 35, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: empIT1.id,
        date: d18,
        checkIn: new Date(currentYear, currentMonth, 18, 7, 58, 0),
        checkOut: new Date(currentYear, currentMonth, 18, 17, 35, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  }

  // 7. [Phòng ban khác] Đơn 7: CHỜ DUYỆT - VỀ SỚM THIẾU GIỜ (Ngày 10: Xin 2.5h, Quẹt ra 18:45 = 1.25h < 2.5h)
  const d10 = new Date(currentYear, currentMonth, 10);
  await prisma.oTRequest.create({
    data: {
      employeeId: empOther1.id,
      date: d10,
      requestHours: 2.5 as any,
      actualHours: 0 as any,
      reason: 'Thiết kế ấn phẩm truyền thông và kịch bản chiến dịch mới ngoài giờ',
      status: 'PENDING'
    }
  });
  const att10 = await prisma.attendance.findFirst({ where: { employeeId: empOther1.id, date: d10 } });
  if (att10) {
    await prisma.attendance.update({
      where: { id: att10.id },
      data: {
        checkIn: new Date(currentYear, currentMonth, 10, 7, 55, 0),
        checkOut: new Date(currentYear, currentMonth, 10, 18, 45, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: empOther1.id,
        date: d10,
        checkIn: new Date(currentYear, currentMonth, 10, 7, 55, 0),
        checkOut: new Date(currentYear, currentMonth, 10, 18, 45, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  }

  // 8. [Phòng ban khác] Đơn 8: CHỜ DUYỆT - THIẾU QUẸT THẺ RA (Ngày 19: Xin 2.0h, Chưa có log quẹt ra)
  const d19 = new Date(currentYear, currentMonth, 19);
  await prisma.oTRequest.create({
    data: {
      employeeId: empOther2.id,
      date: d19,
      requestHours: 2.0 as any,
      actualHours: 0 as any,
      reason: 'Trực hỗ trợ khách hàng và giải quyết khiếu nại ngoài giờ',
      status: 'PENDING'
    }
  });
  const att19 = await prisma.attendance.findFirst({ where: { employeeId: empOther2.id, date: d19 } });
  if (att19) {
    await prisma.attendance.update({
      where: { id: att19.id },
      data: {
        checkIn: new Date(currentYear, currentMonth, 19, 8, 2, 0),
        checkOut: null,
        status: 'EARLY_LEAVE',
        workingDay: 0.5
      }
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: empOther2.id,
        date: d19,
        checkIn: new Date(currentYear, currentMonth, 19, 8, 2, 0),
        checkOut: null,
        status: 'EARLY_LEAVE',
        workingDay: 0.5
      }
    });
  }

  // 9. [Phòng ban khác] Đơn 9: CHỜ DUYỆT - VỀ ĐÚNG CA KHÔNG CÓ OT (Ngày 11: Xin 1.5h, Quẹt ra 17:40 = 10 phút < 30p)
  const d11 = new Date(currentYear, currentMonth, 11);
  await prisma.oTRequest.create({
    data: {
      employeeId: empOther1.id,
      date: d11,
      requestHours: 1.5 as any,
      actualHours: 0 as any,
      reason: 'Họp rà soát tiến độ dự án nội bộ ngoài giờ',
      status: 'PENDING'
    }
  });
  const att11 = await prisma.attendance.findFirst({ where: { employeeId: empOther1.id, date: d11 } });
  if (att11) {
    await prisma.attendance.update({
      where: { id: att11.id },
      data: {
        checkIn: new Date(currentYear, currentMonth, 11, 8, 0, 0),
        checkOut: new Date(currentYear, currentMonth, 11, 17, 40, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  } else {
    await prisma.attendance.create({
      data: {
        employeeId: empOther1.id,
        date: d11,
        checkIn: new Date(currentYear, currentMonth, 11, 8, 0, 0),
        checkOut: new Date(currentYear, currentMonth, 11, 17, 40, 0),
        status: 'NORMAL',
        workingDay: 1.0
      }
    });
  }
}

// Endpoint reset bộ dữ liệu OT mẫu
router.post('/reset-sample-data', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    await resetOTSampleData();
    res.json({ message: 'Đã cài đặt lại bộ dữ liệu OT mẫu chuẩn hóa thành công!' });
  } catch (error: any) {
    console.error('Error resetting OT sample data:', error);
    res.status(500).json({ error: 'Lỗi khi cài đặt lại dữ liệu mẫu' });
  }
});

// 1. Lấy danh sách đăng ký làm thêm giờ (HR / Quản lý xem toàn bộ; Nhân viên chỉ xem đơn của mình)
router.get('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const month = req.query.month as string; // YYYY-MM or ALL
    const yearParam = req.query.year as string;
    let employeeId = req.query.employeeId as string;
    const departmentId = req.query.departmentId as string;
    const status = req.query.status as string;

    const userRole = req.user?.role?.toUpperCase();
    // Chặn IDOR: Nhân viên thông thường chỉ được xem danh sách của chính mình
    if (userRole === 'EMPLOYEE') {
      employeeId = req.user.employeeId;
    }

    // Tự động khởi tạo dữ liệu mẫu nếu chưa có bản ghi OT hoặc chưa có đơn thuộc Phòng Nhân sự
    const totalCount = await prisma.oTRequest.count();
    const hrRecordCount = await prisma.oTRequest.count({
      where: {
        employee: {
          department: { name: { contains: 'Nhân sự', mode: 'insensitive' } }
        }
      }
    });
    if (totalCount <= 2 || hrRecordCount === 0) {
      await resetOTSampleData();
    }

    if (req.query.reset === 'true') {
      await resetOTSampleData();
    }

    const where: any = {};
    if (month && month !== 'ALL' && month.includes('-')) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    } else if (yearParam && yearParam !== 'ALL') {
      const y = Number(yearParam);
      if (y) {
        where.date = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59, 999) };
      }
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (departmentId && departmentId !== 'ALL') {
      where.employee = { departmentId };
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.oTRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            code: true,
            departmentId: true,
            department: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    const enriched = await enrichOTRequestsWithAttendance(requests);
    res.json(enriched);
  } catch (error: any) {
    console.error('Error fetching OT requests:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách làm thêm giờ' });
  }
});

// 2. Lấy danh sách OT của cá nhân (Cổng ESS - Có kiểm tra IDOR)
router.get('/employee/:employeeId', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
    const userRole = req.user?.role?.toUpperCase();

    // Chặn IDOR: Nhân viên thường không được xem dữ liệu OT của nhân viên khác
    if (userRole === 'EMPLOYEE' && req.user?.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thông tin làm thêm giờ của nhân viên khác.' });
    }

    const month = req.query.month as string;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, m] = month.split('-').map(Number);
      startDate = new Date(year, m - 1, 1);
      endDate = new Date(year, m, 0, 23, 59, 59);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const requests = await prisma.oTRequest.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'desc' }
    });

    let totalRequestedHours = 0;
    let totalApprovedHours = 0;

    for (const r of requests) {
      totalRequestedHours += Number(r.requestHours || 0);
      if (r.status === 'APPROVED') {
        totalApprovedHours += Number(r.actualHours || r.requestHours || 0);
      }
    }

    // Tính tổng giờ OT lũy kế cả năm để đối soát trần 200h/năm theo Quy định Công ty LLA
    const yearStart = new Date(startDate.getFullYear(), 0, 1);
    const yearEnd = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59);
    const yearRequests = await prisma.oTRequest.findMany({
      where: {
        employeeId,
        date: { gte: yearStart, lte: yearEnd },
        status: 'APPROVED'
      }
    });

    const totalYearApprovedHours = yearRequests.reduce(
      (sum, r) => sum + Number(r.actualHours || r.requestHours || 0),
      0
    );

    const isMonthWarning = totalApprovedHours >= 32; // 80% của 40h/tháng
    const isMonthCritical = totalApprovedHours >= 40; // 100% của 40h/tháng
    const isYearWarning = totalYearApprovedHours >= 160; // 80% của 200h/năm
    const isYearCritical = totalYearApprovedHours >= 200; // 100% của 200h/năm

    const enrichedRequests = await enrichOTRequestsWithAttendance(requests);

    res.json({
      requests: enrichedRequests,
      summary: {
        month: month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        totalRequestedHours,
        totalApprovedHours,
        monthCap: 40,
        monthWarningPercent: Math.round((totalApprovedHours / 40) * 100),
        isMonthWarning,
        isMonthCritical,
        totalYearApprovedHours,
        yearCap: 200,
        yearWarningPercent: Math.round((totalYearApprovedHours / 200) * 100),
        isYearWarning,
        isYearCritical
      }
    });
  } catch (error: any) {
    console.error('Error fetching employee OT:', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử làm thêm giờ cá nhân' });
  }
});

// 3. Đăng ký làm thêm giờ (Tuân thủ Điều 107 Bộ luật Lao động 2019: <= 4h/ngày, <= 40h/tháng)
router.post('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, date, requestHours, reason } = req.body;
    const userRole = req.user?.role?.toUpperCase();
    
    // Nếu là EMPLOYEE, bắt buộc chỉ được tạo đơn cho chính mình
    let empId = employeeId;
    if (userRole === 'EMPLOYEE' || !empId) {
      empId = req.user?.employeeId;
    }

    if (!empId || !date || requestHours === undefined) {
      return res.status(400).json({ error: 'Vui lòng điền đủ thông tin ngày làm và số giờ OT.' });
    }

    const hours = Number(requestHours);
    if (isNaN(hours) || hours <= 0) {
      return res.status(400).json({ error: 'Số giờ làm thêm phải lớn hơn 0.' });
    }

    const otDate = new Date(date);
    otDate.setHours(0, 0, 0, 0);

    // 1. Kiểm tra trần ngày (Điều 107 Khoản 2 Điểm b BLLĐ 2019: Tối đa 4 giờ/ngày)
    const existingDayOT = await prisma.oTRequest.findMany({
      where: {
        employeeId: empId,
        date: otDate,
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    const dayAccumulatedHours = existingDayOT.reduce(
      (sum, r) => sum + Number(r.status === 'APPROVED' ? (r.actualHours || r.requestHours) : r.requestHours),
      0
    );

    if (dayAccumulatedHours + hours > 4) {
      return res.status(400).json({
        error: `Quy định Công ty LLA (Điều 107 BLLĐ 2019): Giờ làm thêm không được vượt quá 50% giờ làm việc bình thường (tối đa 4 giờ/ngày). Bạn đã đăng ký ${dayAccumulatedHours}h trong ngày ${date}.`
      });
    }

    // 2. Kiểm tra trần tháng (Quy định LLA & Điều 107 BLLĐ 2019: Tối đa 40 giờ/tháng)
    const monthStart = new Date(otDate.getFullYear(), otDate.getMonth(), 1);
    const monthEnd = new Date(otDate.getFullYear(), otDate.getMonth() + 1, 0, 23, 59, 59);

    const existingMonthOT = await prisma.oTRequest.findMany({
      where: {
        employeeId: empId,
        date: { gte: monthStart, lte: monthEnd },
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    const monthAccumulatedHours = existingMonthOT.reduce(
      (sum, r) => sum + Number(r.status === 'APPROVED' ? (r.actualHours || r.requestHours) : r.requestHours),
      0
    );

    if (monthAccumulatedHours + hours > 40) {
      return res.status(400).json({
        error: `Vượt quá giới hạn OT tháng của Công ty LLA (tối đa 40 giờ/tháng). Bạn đã đăng ký lũy kế ${monthAccumulatedHours}h trong tháng này.`
      });
    }

    // 3. Kiểm tra trần năm (Quy định LLA & Điều 107 BLLĐ 2019: Tối đa 200 giờ/năm)
    const yearStart = new Date(otDate.getFullYear(), 0, 1);
    const yearEnd = new Date(otDate.getFullYear(), 11, 31, 23, 59, 59);

    const existingYearOT = await prisma.oTRequest.findMany({
      where: {
        employeeId: empId,
        date: { gte: yearStart, lte: yearEnd },
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    const yearAccumulatedHours = existingYearOT.reduce(
      (sum, r) => sum + Number(r.status === 'APPROVED' ? (r.actualHours || r.requestHours) : r.requestHours),
      0
    );

    if (yearAccumulatedHours + hours > 200) {
      return res.status(400).json({
        error: `Vượt quá giới hạn OT năm của Công ty LLA (tối đa 200 giờ/năm). Mốc 300 giờ/năm chỉ áp dụng khi có phê duyệt xác nhận riêng từ HR/Legal.`
      });
    }

    const newRequest = await prisma.oTRequest.create({
      data: {
        employeeId: empId,
        date: otDate,
        requestHours: hours as any,
        actualHours: 0 as any,
        reason: reason ? String(reason).trim() : null,
        status: 'PENDING'
      }
    });

    await createAuditLog({
      action: 'SUBMIT_OT_REQUEST',
      tableName: 'OTRequest',
      recordId: newRequest.id,
      accountId: req.user?.accountId,
      details: `Đăng ký làm thêm ${hours}h ngày ${date}. Lý do: ${reason || 'Không'}`
    });

    let warningMessage: string | null = null;
    const newMonthTotal = monthAccumulatedHours + hours;
    const newYearTotal = yearAccumulatedHours + hours;
    if (newMonthTotal >= 32) {
      warningMessage = `Bot @Chấm công LLA cảnh báo: Số giờ OT tháng đã đạt ${newMonthTotal}/40h (≥ 80% mức giới hạn tháng).`;
    } else if (newYearTotal >= 160) {
      warningMessage = `Bot @Chấm công LLA cảnh báo: Số giờ OT năm đã đạt ${newYearTotal}/200h (≥ 80% mức giới hạn năm).`;
    }

    return res.status(201).json({
      message: 'Đăng ký làm thêm giờ thành công, đang chờ Quản lý phê duyệt.',
      warning: warningMessage,
      request: newRequest
    });
  } catch (error: any) {
    console.error('Error creating OT request:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi gửi yêu cầu làm thêm giờ' });
  }
});

// 4. Phê duyệt / Từ chối đơn làm thêm giờ (Chỉ Quản lý / HR, Chống tự duyệt)
router.put('/:id/status', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status, actualHours, reviewNote } = req.body; // APPROVED | REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái phê duyệt không hợp lệ.' });
    }

    const request = await prisma.oTRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy đơn làm thêm giờ.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Đơn làm thêm giờ này đã được xử lý trước đó.' });
    }

    // Chống tự phê duyệt (Self-approval Protection)
    if (req.user?.employeeId && request.employeeId === req.user.employeeId) {
      return res.status(403).json({ error: 'Người đăng ký không thể tự phê duyệt đơn làm thêm giờ của chính mình.' });
    }

    const confirmedActualHours = status === 'APPROVED'
      ? (actualHours !== undefined ? Number(actualHours) : Number(request.requestHours))
      : 0;

    if (status === 'APPROVED' && confirmedActualHours > 4) {
      return res.status(400).json({ error: 'Giờ nghiệm thu thực tế không được vượt quá 4 giờ/ngày (Điều 107 BLLĐ 2019).' });
    }

    const [crossCheckedReq] = await enrichOTRequestsWithAttendance([request]);
    const crossCheck = crossCheckedReq?.crossCheck;
    const stayInfo = crossCheck?.checkOutFormatted
      ? `Check-out: ${crossCheck.checkOutFormatted} (${crossCheck.stayHours}h sau ca)`
      : 'Không có log check-out';

    const updateData: any = {
      status,
      actualHours: confirmedActualHours as any
    };
    if (reviewNote && String(reviewNote).trim()) {
      const noteStr = String(reviewNote).trim();
      updateData.reason = request.reason ? `${request.reason} [Ghi chú duyệt: ${noteStr}]` : `[Ghi chú duyệt: ${noteStr}]`;
    }

    const updated = await prisma.oTRequest.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            code: true,
            departmentId: true,
            department: { select: { id: true, name: true } }
          }
        }
      }
    });

    await createAuditLog({
      action: status === 'APPROVED' ? 'APPROVE_OT_REQUEST' : 'REJECT_OT_REQUEST',
      tableName: 'OTRequest',
      recordId: id,
      accountId: req.user?.accountId,
      details: `${status === 'APPROVED' ? `Phê duyệt OT (${confirmedActualHours} giờ)` : 'Từ chối đơn OT'} #${id}. [Đối soát: ${stayInfo}]. ${reviewNote ? `Ghi chú: ${reviewNote}` : ''}`
    });

    const [enrichedUpdated] = await enrichOTRequestsWithAttendance([updated]);

    return res.json({
      message: `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} đơn làm thêm giờ.`,
      request: enrichedUpdated
    });
  } catch (error: any) {
    console.error('Error updating OT status:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi cập nhật trạng thái OT' });
  }
});

// 5. Hủy đơn làm thêm giờ (Nếu còn ở trạng thái PENDING & đúng chủ sở hữu hoặc Admin)
router.delete('/:id', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const request = await prisma.oTRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy đơn làm thêm giờ.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn đang chờ duyệt (PENDING).' });
    }

    const userRole = req.user?.role?.toUpperCase();
    const isHrOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(userRole);
    if (!isHrOrAdmin && request.employeeId !== req.user?.employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy đơn làm thêm giờ của người khác.' });
    }

    await prisma.oTRequest.delete({ where: { id } });

    await createAuditLog({
      action: 'CANCEL_OT_REQUEST',
      tableName: 'OTRequest',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Hủy đơn làm thêm giờ #${id}`
    });

    return res.json({ message: 'Đã hủy đơn làm thêm giờ thành công.' });
  } catch (error: any) {
    console.error('Error deleting OT request:', error);
    return res.status(500).json({ error: 'Lỗi khi hủy đơn OT' });
  }
});

export default router;

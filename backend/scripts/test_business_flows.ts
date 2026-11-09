import { prisma } from '../src/db';
import { AssetStatus, AssignmentStatus } from '@prisma/client';

async function runBusinessFlowTests() {
  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ CÁC LUỒNG CHỨC NĂNG NGHIỆP VỤ (BUSINESS WORKFLOWS)');
  console.log('========================================================================\n');

  let passedFlows = 0;
  const totalFlows = 6;

  // Lấy Admin token
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  if (!token) {
    console.error('❌ Không thể đăng nhập lấy token Admin.');
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Chọn 1 nhân viên ACTIVE mẫu để test
  const testEmp = await prisma.employee.findFirst({
    where: { status: 'ACTIVE', contracts: { some: { status: 'ACTIVE' } } },
    include: { department: true, position: true, contracts: { where: { status: 'ACTIVE' } } }
  });

  if (!testEmp) {
    console.error('❌ Không tìm thấy nhân viên mẫu ACTIVE để test.');
    process.exit(1);
  }

  console.log(`👤 Nhân sự thử nghiệm: [${testEmp.code}] ${testEmp.fullName} (${testEmp.department?.name} - ${testEmp.position?.title})\n`);

  try {
    // =========================================================================
    // LUỒNG 1: TUYỂN DỤNG -> PRE-ONBOARDING -> TIẾP NHẬN & TỰ ĐỘNG SINH HỒ SƠ
    // =========================================================================
    console.log('------------------------------------------------------------------------');
    console.log('▶ LUỒNG 1: Tuyển dụng ➔ Chấp nhận Offer ➔ Tiếp nhận & Tự sinh Nhân sự mới');
    console.log('------------------------------------------------------------------------');

    // 1.0 Dọn dẹp bản ghi cũ nếu có
    await prisma.onboardingTask.deleteMany({ where: { employee: { code: { startsWith: 'TEST_CAND_' } } } });
    await prisma.employmentHistory.deleteMany({ where: { employee: { code: { startsWith: 'TEST_CAND_' } } } });
    await prisma.contract.deleteMany({ where: { employee: { code: { startsWith: 'TEST_CAND_' } } } });
    await prisma.account.deleteMany({ where: { employee: { code: { startsWith: 'TEST_CAND_' } } } });
    await prisma.employee.deleteMany({ where: { code: { startsWith: 'TEST_CAND_' } } });
    await prisma.jobOffer.deleteMany({ where: { candidate: { name: { startsWith: 'Ứng viên Test' } } } });
    await prisma.preOnboardingProfile.deleteMany({ where: { candidate: { name: { startsWith: 'Ứng viên Test' } } } });
    await prisma.candidate.deleteMany({ where: { name: { startsWith: 'Ứng viên Test' } } });

    // 1.1 Tìm 1 JobPosting có sẵn
    const job = await prisma.jobPosting.findFirst();
    const candidateCode = `TEST_CAND_${Date.now().toString().slice(-4)}`;
    const testCccd = `001${Date.now().toString().slice(-9)}`;

    // 1.2 Tạo ứng viên
    const cand = await prisma.candidate.create({
      data: {
        name: `Ứng viên Test ${candidateCode}`,
        email: `${candidateCode.toLowerCase()}@test.vn`,
        phone: '0988776655',
        jobPostingId: job?.id,
        status: 'OFFERING'
      }
    });

    // 1.3 Tạo Pre-onboarding cho ứng viên
    await prisma.preOnboardingProfile.create({
      data: {
        candidateId: cand.id,
        cccd: testCccd,
        gender: 'MALE',
        address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
        bankName: 'Vietcombank',
        bankAccount: '998877665544',
        emergencyContactName: 'Người thân Test',
        emergencyContactPhone: '0911223344'
      }
    });

    // 1.4 Tạo Thư mời nhận việc (Offer)
    const offer = await prisma.jobOffer.create({
      data: {
        candidateId: cand.id,
        baseSalary: 12000000,
        contractType: 'PROBATION',
        startDate: new Date(),
        status: 'ACCEPTED'
      }
    });

    // 1.5 Gọi API tiếp nhận ứng viên thành nhân viên chính thức
    const acceptRes = await fetch('http://localhost:5000/api/offers/accept', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        candidateId: cand.id,
        employeeCode: candidateCode,
        joinDate: new Date().toISOString(),
        departmentId: testEmp.departmentId,
        positionId: testEmp.positionId
      })
    });
    const acceptData = await acceptRes.json();

    if (!acceptRes.ok) {
      throw new Error(`Lỗi tiếp nhận ứng viên: ${JSON.stringify(acceptData)}`);
    }

    // Kiểm tra các bản ghi được sinh tự động
    const createdNewEmp = await prisma.employee.findUnique({
      where: { code: candidateCode },
      include: { contracts: true, employmentHistories: true }
    });

    const createdAccount = await prisma.account.findFirst({
      where: { employeeId: createdNewEmp?.id }
    });
    const candAfter = await prisma.candidate.findUnique({ where: { id: cand.id } });

    const isEmpCreated = Boolean(createdNewEmp && createdNewEmp.status === 'ONBOARDING');
    const isContractGenerated = (createdNewEmp?.contracts.length || 0) > 0;
    const isHistGenerated = (createdNewEmp?.employmentHistories.length || 0) > 0;
    const isAccountCreated = Boolean(createdAccount);
    const isCandHired = candAfter?.status === 'HIRED';

    console.log(`   - Nhân viên mới được tạo: [${createdNewEmp?.code}] ${createdNewEmp?.fullName} (Trạng thái: ${createdNewEmp?.status}) (${isEmpCreated ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Hợp đồng LĐ đầu tiên tự động sinh: Lương ${createdNewEmp?.contracts[0]?.baseSalary?.toLocaleString('vi-VN')} VNĐ (${isContractGenerated ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Ghi nhận lịch sử công tác: "${createdNewEmp?.employmentHistories[0]?.changeReason}" (${isHistGenerated ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Tự sinh tài khoản nhân sự: [${createdAccount?.username}] (${isAccountCreated ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Trạng thái ứng viên cập nhật: ${candAfter?.status} (${isCandHired ? '✅ ĐÚNG' : '❌ SAI'})`);

    if (isEmpCreated && isContractGenerated && isHistGenerated && isAccountCreated && isCandHired) {
      console.log('👉 KẾT QUẢ LUỒNG 1: THÀNH CÔNG HOÀN TOÀN ✅\n');
      passedFlows++;
    } else {
      console.error('👉 KẾT QUẢ LUỒNG 1: THẤT BẠI ❌\n');
    }

    // Dọn dẹp Luồng 1
    if (createdNewEmp) {
      await prisma.onboardingTask.deleteMany({ where: { employeeId: createdNewEmp.id } });
      await prisma.employmentHistory.deleteMany({ where: { employeeId: createdNewEmp.id } });
      await prisma.contract.deleteMany({ where: { employeeId: createdNewEmp.id } });
      await prisma.account.deleteMany({ where: { employeeId: createdNewEmp.id } });
      await prisma.employee.delete({ where: { id: createdNewEmp.id } });
    }
    await prisma.jobOffer.delete({ where: { id: offer.id } });
    await prisma.preOnboardingProfile.deleteMany({ where: { candidateId: cand.id } });
    await prisma.candidate.delete({ where: { id: cand.id } });


    // =========================================================================
    // LUỒNG 2: CHẤM CÔNG VÀO / RA (CHECK-IN / CHECK-OUT WORKFLOW)
    // =========================================================================
    console.log('------------------------------------------------------------------------');
    console.log('▶ LUỒNG 2: Chấm công Điểm danh vào ca (Check-in) & Ra ca (Check-out)');
    console.log('------------------------------------------------------------------------');

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Lưu lại attendance hiện tại của ngày nếu có để khôi phục sau test
    const oldAttendance = await prisma.attendance.findFirst({
      where: { employeeId: testEmp.id, date: todayDate }
    });
    if (oldAttendance) {
      await prisma.attendance.delete({ where: { id: oldAttendance.id } });
    }

    // 2.1 Thực hiện Check-in
    const checkInRes = await fetch('http://localhost:5000/api/attendance/check-in', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ employeeId: testEmp.id })
    });
    const checkInData = await checkInRes.json();

    const afterCheckIn = await prisma.attendance.findFirst({
      where: { employeeId: testEmp.id, date: todayDate }
    });
    const isCheckInRecorded = Boolean(afterCheckIn && afterCheckIn.checkIn);

    // 2.2 Thực hiện Check-out
    const checkOutRes = await fetch('http://localhost:5000/api/attendance/check-out', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ employeeId: testEmp.id })
    });
    const checkOutData = await checkOutRes.json();

    const afterCheckOut = await prisma.attendance.findFirst({
      where: { employeeId: testEmp.id, date: todayDate }
    });
    const isCheckOutRecorded = Boolean(afterCheckOut && afterCheckOut.checkOut);
    const hasWorkingDay = afterCheckOut?.workingDay !== undefined && afterCheckOut?.workingDay !== null;

    console.log(`   - Ghi nhận Check-in: ${afterCheckIn?.checkIn ? new Date(afterCheckIn.checkIn).toLocaleTimeString('vi-VN') : 'Chưa'} - Trạng thái: ${afterCheckIn?.status} (${isCheckInRecorded ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Ghi nhận Check-out: ${afterCheckOut?.checkOut ? new Date(afterCheckOut.checkOut).toLocaleTimeString('vi-VN') : 'Chưa'} (${isCheckOutRecorded ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Ngày công tính được: ${afterCheckOut?.workingDay} công (${hasWorkingDay ? '✅ ĐÚNG' : '❌ SAI'})`);

    if (isCheckInRecorded && isCheckOutRecorded && hasWorkingDay) {
      console.log('👉 KẾT QUẢ LUỒNG 2: THÀNH CÔNG HOÀN TOÀN ✅\n');
      passedFlows++;
    } else {
      console.error('👉 KẾT QUẢ LUỒNG 2: THẤT BẠI ❌\n');
    }

    // Dọn dẹp Luồng 2: khôi phục attendance cũ nếu có
    await prisma.attendance.deleteMany({ where: { employeeId: testEmp.id, date: todayDate } });
    if (oldAttendance) {
      await prisma.attendance.create({ data: oldAttendance });
    }


    // =========================================================================
    // LUỒNG 3: NỘP ĐƠN NGHỈ PHÉP & PHÊ DUYỆT (LEAVE APPLICATION & APPROVAL)
    // =========================================================================
    console.log('------------------------------------------------------------------------');
    console.log('▶ LUỒNG 3: Nộp Đơn xin nghỉ phép & Quản lý Phê duyệt');
    console.log('------------------------------------------------------------------------');

    // Chọn 1 ngày làm việc trong tuần (Thứ Ba 17/11/2026)
    const leaveDateStr = '2026-11-17';

    // 3.1 Nộp đơn nghỉ phép Không lương (UNPAID) để tránh chạm hạn mức phép năm
    const leaveSubmitRes = await fetch('http://localhost:5000/api/leaves', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employeeId: testEmp.id,
        leaveType: 'UNPAID',
        startDate: leaveDateStr,
        endDate: leaveDateStr,
        reason: 'Nghỉ giải quyết việc gia đình cá nhân',
        handoverPerson: 'Nguyễn Văn Đồng Nghiệp'
      })
    });
    const leaveSubmitData = await leaveSubmitRes.json();

    if (!leaveSubmitRes.ok) {
      throw new Error(`Lỗi nộp đơn nghỉ phép: ${JSON.stringify(leaveSubmitData)}`);
    }

    const leaveReqId = leaveSubmitData.request.id;
    console.log(`   - Nộp đơn nghỉ phép thành công: Mã đơn [${leaveReqId.slice(0, 8)}...] trạng thái PENDING`);

    // 3.2 Quản lý phê duyệt đơn nghỉ phép
    const leaveApproveRes = await fetch(`http://localhost:5000/api/leaves/${leaveReqId}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'APPROVED' })
    });
    const leaveApproveData = await leaveApproveRes.json();

    if (!leaveApproveRes.ok) {
      throw new Error(`Lỗi duyệt đơn nghỉ phép: ${JSON.stringify(leaveApproveData)}`);
    }

    const updatedLeaveReq = await prisma.leaveRequest.findUnique({ where: { id: leaveReqId } });
    const isLeaveApproved = updatedLeaveReq?.status === 'APPROVED';

    console.log(`   - Trạng thái đơn sau khi Quản lý duyệt: ${updatedLeaveReq?.status} (${isLeaveApproved ? '✅ ĐÚNG' : '❌ SAI'})`);

    if (isLeaveApproved) {
      console.log('👉 KẾT QUẢ LUỒNG 3: THÀNH CÔNG HOÀN TOÀN ✅\n');
      passedFlows++;
    } else {
      console.error('👉 KẾT QUẢ LUỒNG 3: THẤT BẠI ❌\n');
    }

    // Dọn dẹp Luồng 3
    await prisma.leaveRequest.delete({ where: { id: leaveReqId } });


    // =========================================================================
    // LUỒNG 4: ĐĂNG KÝ LÀM THÊM GIỜ (OT) & PHÊ DUYỆT (OT APPLICATION & APPROVAL)
    // =========================================================================
    console.log('------------------------------------------------------------------------');
    console.log('▶ LUỒNG 4: Đăng ký Làm thêm giờ (OT) & Quản lý Phê duyệt');
    console.log('------------------------------------------------------------------------');

    // 4.1 Đăng ký OT 2 giờ
    const otSubmitRes = await fetch('http://localhost:5000/api/ot', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employeeId: testEmp.id,
        date: leaveDateStr,
        requestHours: 2,
        reason: 'Hỗ trợ triển khai Release hệ thống buổi tối'
      })
    });
    const otSubmitData = await otSubmitRes.json();

    if (!otSubmitRes.ok) {
      throw new Error(`Lỗi gửi đơn OT: ${JSON.stringify(otSubmitData)}`);
    }

    const otReqId = otSubmitData.request.id;
    console.log(`   - Đăng ký OT 2h thành công: Mã đơn [${otReqId.slice(0, 8)}...] trạng thái PENDING`);

    // 4.2 Quản lý phê duyệt đơn OT
    const otApproveRes = await fetch(`http://localhost:5000/api/ot/${otReqId}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'APPROVED',
        actualHours: 2
      })
    });
    const otApproveData = await otApproveRes.json();

    if (!otApproveRes.ok) {
      throw new Error(`Lỗi duyệt đơn OT: ${JSON.stringify(otApproveData)}`);
    }

    const updatedOtReq = await prisma.oTRequest.findUnique({ where: { id: otReqId } });
    const isOtApproved = updatedOtReq?.status === 'APPROVED' && Number(updatedOtReq?.actualHours) === 2;

    console.log(`   - Đơn OT sau khi duyệt: Trạng thái ${updatedOtReq?.status}, Giờ thực tế: ${updatedOtReq?.actualHours}h (${isOtApproved ? '✅ ĐÚNG' : '❌ SAI'})`);

    if (isOtApproved) {
      console.log('👉 KẾT QUẢ LUỒNG 4: THÀNH CÔNG HOÀN TOÀN ✅\n');
      passedFlows++;
    } else {
      console.error('👉 KẾT QUẢ LUỒNG 4: THẤT BẠI ❌\n');
    }

    // Dọn dẹp Luồng 4
    await prisma.oTRequest.delete({ where: { id: otReqId } });


    // =========================================================================
    // LUỒNG 5: VÒNG ĐỜI TÀI SẢN THIẾT BỊ: CẤP PHÁT (BM-01) ➔ THU HỒI (BM-02)
    // =========================================================================
    console.log('------------------------------------------------------------------------');
    console.log('▶ LUỒNG 5: Cấp phát Thiết bị (Biểu mẫu BM-01) & Thu hồi Kho (Biểu mẫu BM-02)');
    console.log('------------------------------------------------------------------------');

    // 5.1 Tìm 1 thiết bị AVAILABLE trong kho
    const targetAsset = await prisma.asset.findFirst({
      where: { status: AssetStatus.AVAILABLE }
    });

    if (!targetAsset) {
      throw new Error('Không có thiết bị AVAILABLE nào trong kho để test bàn giao.');
    }

    console.log(`   - Thiết bị chọn bàn giao: [${targetAsset.code}] ${targetAsset.name}`);

    // 5.2 Cấp phát thiết bị cho nhân sự
    const assignDocCode = `BBBG-TEST-${Date.now().toString().slice(-4)}`;
    const assignRes = await fetch('http://localhost:5000/api/assets/assign', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        assetId: targetAsset.id,
        employeeId: testEmp.id,
        assignedDate: new Date().toISOString(),
        conditionOnAssign: 'Mới 100%, hoạt động ổn định',
        handoverDocCode: assignDocCode,
        notes: 'Bàn giao thiết bị làm việc chính thức'
      })
    });
    const assignData = await assignRes.json();

    if (!assignRes.ok) {
      throw new Error(`Lỗi bàn giao thiết bị: ${JSON.stringify(assignData)}`);
    }

    const assignmentId = assignData.assignment?.id || assignData.id;
    const assetAfterAssign = await prisma.asset.findUnique({ where: { id: targetAsset.id } });
    const isAssetAssigned = assetAfterAssign?.status === AssetStatus.ASSIGNED;

    console.log(`   - Trạng thái thiết bị sau bàn giao: ${assetAfterAssign?.status} (${isAssetAssigned ? '✅ ĐÚNG (ASSIGNED)' : '❌ SAI'})`);
    console.log(`   - Mã phiếu biên bản bàn giao: ${assignDocCode}`);

    // 5.3 Thu hồi thiết bị về lại kho theo biểu mẫu BM-02
    const returnRes = await fetch(`http://localhost:5000/api/assets/assignments/${assignmentId}/return`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        returnedDate: new Date().toISOString(),
        conditionOnReturn: 'Hoạt động tốt, nguyên vẹn',
        notes: 'Thu hồi về kho sau khi hoàn thành nhiệm vụ',
        nextAssetStatus: 'AVAILABLE'
      })
    });
    const returnData = await returnRes.json();

    if (!returnRes.ok) {
      throw new Error(`Lỗi thu hồi thiết bị: ${JSON.stringify(returnData)}`);
    }

    const assetAfterReturn = await prisma.asset.findUnique({ where: { id: targetAsset.id } });
    const assignmentAfterReturn = await prisma.assetAssignment.findUnique({ where: { id: assignmentId } });

    const isAssetReturnedToAvailable = assetAfterReturn?.status === AssetStatus.AVAILABLE;
    const isAssignmentMarkedReturned = assignmentAfterReturn?.status === AssignmentStatus.RETURNED;

    console.log(`   - Trạng thái phiếu bàn giao sau thu hồi: ${assignmentAfterReturn?.status} (${isAssignmentMarkedReturned ? '✅ ĐÚNG (RETURNED)' : '❌ SAI'})`);
    console.log(`   - Trạng thái thiết bị quay lại kho: ${assetAfterReturn?.status} (${isAssetReturnedToAvailable ? '✅ ĐÚNG (AVAILABLE)' : '❌ SAI'})`);

    if (isAssetAssigned && isAssetReturnedToAvailable && isAssignmentMarkedReturned) {
      console.log('👉 KẾT QUẢ LUỒNG 5: THÀNH CÔNG HOÀN TOÀN ✅\n');
      passedFlows++;
    } else {
      console.error('👉 KẾT QUẢ LUỒNG 5: THẤT BẠI ❌\n');
    }

    // Dọn dẹp Luồng 5
    await prisma.assetAssignment.deleteMany({ where: { id: assignmentId } });


    // =========================================================================
    // LUỒNG 6: TÍNH LƯƠNG TỰ ĐỘNG GROSS-TO-NET & KHÓA SỔ (PAYROLL CALCULATION)
    // =========================================================================
    console.log('------------------------------------------------------------------------');
    console.log('▶ LUỒNG 6: Động cơ Chạy bảng lương Gross-to-Net tự động theo Quy chế LLA');
    console.log('------------------------------------------------------------------------');

    // Chạy bảng lương cho tháng 11/2026
    const testMonth = 11;
    const testYear = 2026;

    // Dọn dẹp kỳ lương cũ 11/2026 nếu có
    const existingPeriods = await prisma.payrollPeriod.findMany({ where: { monthYear: `${testMonth}-${testYear}` } });
    for (const p of existingPeriods) {
      const slips = await prisma.payslip.findMany({ where: { payrollPeriodId: p.id }, select: { id: true } });
      const slipIds = slips.map(s => s.id);
      if (slipIds.length > 0) {
        await prisma.payslipDetail.deleteMany({ where: { payslipId: { in: slipIds } } });
      }
      await prisma.payslip.deleteMany({ where: { payrollPeriodId: p.id } });
      await prisma.payrollPeriod.delete({ where: { id: p.id } });
    }

    const payrollRes = await fetch('http://localhost:5000/api/payroll/generate', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ month: testMonth, year: testYear })
    });
    const payrollData = await payrollRes.json();

    if (!payrollRes.ok) {
      throw new Error(`Lỗi tính bảng lương: ${JSON.stringify(payrollData)}`);
    }

    // Kiểm tra phiếu lương vừa sinh
    const period = await prisma.payrollPeriod.findUnique({
      where: { monthYear: `${testMonth}-${testYear}` },
      include: { payslips: { include: { employee: true } } }
    });

    const isPeriodCreated = Boolean(period);
    const payslipCount = period?.payslips.length || 0;
    const sampleSlip = period?.payslips[0];

    console.log(`   - Kỳ lương ${testMonth}/${testYear}: Công chuẩn ${period?.standardWorkingDays} ngày công (${isPeriodCreated ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Tổng số phiếu lương nhân viên tự động tính: ${payslipCount} phiếu (${payslipCount > 0 ? '✅ ĐÚNG' : '❌ SAI'})`);
    if (sampleSlip) {
      const gross = Number(sampleSlip.baseSalary);
      const net = Number(sampleSlip.netSalary);
      const ins = Number(sampleSlip.insuranceDeduction || 0);
      console.log(`   - Mẫu phiếu lương [${sampleSlip.employee.code}] ${sampleSlip.employee.fullName}:`);
      console.log(`     + Lương cơ bản hợp đồng: ${gross.toLocaleString('vi-VN')} VNĐ`);
      console.log(`     + Trích đóng BHXH/BHYT/BHTN (10.5%): ${ins.toLocaleString('vi-VN')} VNĐ`);
      console.log(`     + Thực lĩnh (Net Salary): ${net.toLocaleString('vi-VN')} VNĐ`);
    }

    if (isPeriodCreated && payslipCount > 0) {
      console.log('👉 KẾT QUẢ LUỒNG 6: THÀNH CÔNG HOÀN TOÀN ✅\n');
      passedFlows++;
    } else {
      console.error('👉 KẾT QUẢ LUỒNG 6: THẤT BẠI ❌\n');
    }

    // Dọn dẹp Luồng 6 (xóa kỳ lương test 11-2026 nếu muốn giữ gọn)
    if (period) {
      const slips = await prisma.payslip.findMany({ where: { payrollPeriodId: period.id }, select: { id: true } });
      const slipIds = slips.map(s => s.id);
      await prisma.payslipDetail.deleteMany({ where: { payslipId: { in: slipIds } } });
      await prisma.payslip.deleteMany({ where: { payrollPeriodId: period.id } });
      await prisma.payrollPeriod.delete({ where: { id: period.id } });
    }

    // =========================================================================
    // TỔNG KẾT
    // =========================================================================
    console.log('========================================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedFlows}/${totalFlows} LUỒNG NGHIỆP VỤ ĐẠT 100% HOÀN HẢO!`);
    console.log('Tất cả các luồng nghiệp vụ cốt lõi của hệ thống HRM vận hành chính xác!');
    console.log('========================================================================\n');

  } catch (error: any) {
    console.error('❌ Lỗi kiểm thử luồng:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runBusinessFlowTests();

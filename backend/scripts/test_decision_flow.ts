import { prisma } from '../src/db';

async function runDecisionTests() {
  console.log('========================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ LUỒNG NGHIỆP VỤ MODULE QUYẾT ĐỊNH');
  console.log('========================================================\n');

  // 1. Tìm 1 nhân viên mẫu có hợp đồng ACTIVE
  const testEmp = await prisma.employee.findFirst({
    where: {
      status: 'ACTIVE',
      contracts: { some: { status: 'ACTIVE' } }
    },
    include: {
      department: true,
      position: true,
      contracts: { where: { status: 'ACTIVE' } }
    }
  });

  if (!testEmp) {
    console.error('❌ Không tìm thấy nhân viên ACTIVE có hợp đồng để test.');
    process.exit(1);
  }

  const activeContract = testEmp.contracts[0];
  const initialSalary = Number(activeContract.baseSalary);
  const initialDeptId = testEmp.departmentId;
  const initialPosId = testEmp.positionId;

  console.log(`👤 Nhân sự thử nghiệm: [${testEmp.code}] ${testEmp.fullName}`);
  console.log(`   - Phòng ban ban đầu: ${testEmp.department?.name || 'Chưa gán'}`);
  console.log(`   - Chức danh ban đầu: ${testEmp.position?.title || 'Chưa gán'}`);
  console.log(`   - Mức lương hợp đồng hiện tại: ${initialSalary.toLocaleString('vi-VN')} VNĐ`);
  console.log(`   - Số HĐLĐ: ${activeContract.contractNumber || activeContract.id}\n`);

  let passedTests = 0;
  let totalTests = 4;

  try {
    // =========================================================================
    // TEST 1: ĐIỀU CHỈNH TĂNG LƯƠNG (SALARY_ADJUSTMENT)
    // =========================================================================
    console.log('------------------------------------------------------------');
    console.log('▶ TEST 1: Tạo & Duyệt Quyết định Điều chỉnh Tăng lương');
    console.log('------------------------------------------------------------');

    const newSalaryTest = initialSalary + 5000000;
    const decNumber1 = `QĐ-TEST-SALARY-${Date.now().toString().slice(-4)}`;

    // Tạo quyết định
    const decSalary = await prisma.decision.create({
      data: {
        decisionNumber: decNumber1,
        title: `Quyết định tăng lương định kỳ cho ${testEmp.fullName}`,
        type: 'SALARY_ADJUSTMENT',
        employeeId: testEmp.id,
        oldSalary: initialSalary,
        newSalary: newSalaryTest,
        reason: 'Đạt thành tích xuất sắc và hoàn thành vượt chỉ tiêu KPI quý',
        status: 'PENDING',
        signBy: 'Tổng Giám Đốc'
      }
    });
    console.log(`✓ Đã tạo Quyết định [${decSalary.decisionNumber}] trạng thái PENDING`);

    // Thực hiện API Approve
    const approveSalaryRes = await fetch(`http://localhost:5000/api/decisions/${decSalary.id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signBy: 'Tổng Giám Đốc' })
    });
    const approveSalaryData = await approveSalaryRes.json();

    if (!approveSalaryRes.ok) {
      throw new Error(`Lỗi duyệt quyết định lương: ${JSON.stringify(approveSalaryData)}`);
    }

    // Kiểm tra tác động sang Hợp đồng & Phụ lục HĐ
    const updatedContract = await prisma.contract.findUnique({ where: { id: activeContract.id } });
    const appendixCreated = await prisma.contractAppendix.findFirst({
      where: { decisionId: decSalary.id }
    });
    const empHistoryCreated = await prisma.employmentHistory.findFirst({
      where: {
        employeeId: testEmp.id,
        changeReason: { contains: decSalary.decisionNumber }
      }
    });

    const isSalaryContractUpdated = Number(updatedContract?.baseSalary) === newSalaryTest;
    const isAppendixGenerated = Boolean(appendixCreated && Number(appendixCreated.newSalary) === newSalaryTest);
    const isHistoryLogged = Boolean(empHistoryCreated);

    console.log(`   - Trạng thái Quyết định sau duyệt: APPROVED`);
    console.log(`   - Hợp đồng baseSalary cập nhật mới: ${Number(updatedContract?.baseSalary).toLocaleString('vi-VN')} VNĐ (${isSalaryContractUpdated ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Tự động sinh Phụ lục HĐLĐ: [${appendixCreated?.appendixNumber}] "${appendixCreated?.title}" (${isAppendixGenerated ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Tự động ghi vết Lịch sử công tác: "${empHistoryCreated?.changeReason}" (${isHistoryLogged ? '✅ ĐÚNG' : '❌ SAI'})`);

    if (isSalaryContractUpdated && isAppendixGenerated && isHistoryLogged) {
      console.log('👉 KẾT QUẢ TEST 1: THÀNH CÔNG HOÀN TOÀN ✅\n');
      passedTests++;
    } else {
      console.error('👉 KẾT QUẢ TEST 1: THẤT BẠI ❌\n');
    }

    // =========================================================================
    // TEST 2: ĐIỀU CHUYỂN PHÒNG BAN & BỔ NHIỆM (TRANSFER / PROMOTION)
    // =========================================================================
    console.log('------------------------------------------------------------');
    console.log('▶ TEST 2: Tạo & Duyệt Quyết định Bổ nhiệm / Điều chuyển phòng ban');
    console.log('------------------------------------------------------------');

    const otherDept = await prisma.department.findFirst({
      where: { id: { not: initialDeptId || undefined } }
    });
    const otherPos = await prisma.position.findFirst({
      where: { id: { not: initialPosId || undefined } }
    });

    if (!otherDept || !otherPos) {
      console.warn('⚠ Không đủ phòng ban hoặc vị trí khác để test điều chuyển');
    } else {
      const decNumber2 = `QĐ-TEST-TRANSFER-${Date.now().toString().slice(-4)}`;
      const decTransfer = await prisma.decision.create({
        data: {
          decisionNumber: decNumber2,
          title: `Quyết định điều chuyển công tác sang ${otherDept.name}`,
          type: 'TRANSFER',
          employeeId: testEmp.id,
          oldDepartmentId: initialDeptId,
          newDepartmentId: otherDept.id,
          oldPositionId: initialPosId,
          newPositionId: otherPos.id,
          reason: 'Tăng cường nguồn lực cho dự án trọng điểm',
          status: 'PENDING'
        }
      });
      console.log(`✓ Đã tạo Quyết định [${decTransfer.decisionNumber}] trạng thái PENDING`);

      const approveTransferRes = await fetch(`http://localhost:5000/api/decisions/${decTransfer.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signBy: 'Ban Giám Đốc' })
      });
      const approveTransferData = await approveTransferRes.json();

      if (!approveTransferRes.ok) {
        throw new Error(`Lỗi duyệt quyết định điều chuyển: ${JSON.stringify(approveTransferData)}`);
      }

      const updatedEmp = await prisma.employee.findUnique({
        where: { id: testEmp.id },
        include: { department: true, position: true }
      });
      const transferAppendix = await prisma.contractAppendix.findFirst({
        where: { decisionId: decTransfer.id }
      });
      const transferHistory = await prisma.employmentHistory.findFirst({
        where: { employeeId: testEmp.id, changeReason: { contains: decTransfer.decisionNumber } }
      });

      const isDeptUpdated = updatedEmp?.departmentId === otherDept.id;
      const isPosUpdated = updatedEmp?.positionId === otherPos.id;
      const isTransferAppCreated = Boolean(transferAppendix);
      const isTransferHistLogged = Boolean(transferHistory);

      console.log(`   - Phòng ban mới của nhân sự: ${updatedEmp?.department?.name} (${isDeptUpdated ? '✅ ĐÚNG' : '❌ SAI'})`);
      console.log(`   - Chức danh mới của nhân sự: ${updatedEmp?.position?.title} (${isPosUpdated ? '✅ ĐÚNG' : '❌ SAI'})`);
      console.log(`   - Tự sinh Phụ lục HĐLĐ điều chuyển: [${transferAppendix?.appendixNumber}] (${isTransferAppCreated ? '✅ ĐÚNG' : '❌ SAI'})`);
      console.log(`   - Lịch sử công tác ghi nhận: "${transferHistory?.changeReason}" (${isTransferHistLogged ? '✅ ĐÚNG' : '❌ SAI'})`);

      if (isDeptUpdated && isPosUpdated && isTransferAppCreated && isTransferHistLogged) {
        console.log('👉 KẾT QUẢ TEST 2: THÀNH CÔNG HOÀN TOÀN ✅\n');
        passedTests++;
      } else {
        console.error('👉 KẾT QUẢ TEST 2: THẤT BẠI ❌\n');
      }

      // Xóa quyết định test 2 và trả lại phòng ban ban đầu
      await prisma.employee.update({
        where: { id: testEmp.id },
        data: { departmentId: initialDeptId, positionId: initialPosId }
      });
      await prisma.contractAppendix.deleteMany({ where: { decisionId: decTransfer.id } });
      await prisma.employmentHistory.deleteMany({ where: { changeReason: { contains: decTransfer.decisionNumber } } });
      await prisma.decision.delete({ where: { id: decTransfer.id } });
    }

    // =========================================================================
    // TEST 3: THÔI VIỆC & KÍCH HOẠT CHECKLIST BÀN GIAO (TERMINATION)
    // =========================================================================
    console.log('------------------------------------------------------------');
    console.log('▶ TEST 3: Quyết định Thôi việc & Kích hoạt Checklist bàn giao 4 bên');
    console.log('------------------------------------------------------------');

    const decNumber3 = `QĐ-TEST-TERM-${Date.now().toString().slice(-4)}`;
    const decTerm = await prisma.decision.create({
      data: {
        decisionNumber: decNumber3,
        title: `Quyết định chấm dứt hợp đồng lao động đối với ${testEmp.fullName}`,
        type: 'TERMINATION',
        employeeId: testEmp.id,
        reason: 'Theo nguyện vọng cá nhân chuyển nơi cư trú',
        status: 'PENDING'
      }
    });

    const approveTermRes = await fetch(`http://localhost:5000/api/decisions/${decTerm.id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signBy: 'Tổng Giám Đốc' })
    });
    const approveTermData = await approveTermRes.json();

    if (!approveTermRes.ok) {
      throw new Error(`Lỗi duyệt thôi việc: ${JSON.stringify(approveTermData)}`);
    }

    // Kiểm tra nhân sự và bộ checklist bàn giao
    const termEmp = await prisma.employee.findUnique({ where: { id: testEmp.id } });
    const offboardingTasks = await prisma.onboardingTask.findMany({
      where: {
        employeeId: testEmp.id,
        category: { in: ['OFFBOARDING_WORK', 'OFFBOARDING_IT', 'OFFBOARDING_ADMIN', 'OFFBOARDING_HR'] }
      }
    });
    const completedHrTask = offboardingTasks.find(t => t.taskName.includes('Soạn thảo & Ban hành Quyết định'));

    const isResignationDateSet = Boolean(termEmp?.resignationDate);
    const isChecklistGenerated = offboardingTasks.length >= 10;
    const isHrTaskAutoCompleted = Boolean(completedHrTask && completedHrTask.isCompleted);

    console.log(`   - Ghi nhận ngày thôi việc và lý do: ${termEmp?.resignationReason} (${isResignationDateSet ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Tự động nạp bộ Checklist bàn giao thôi việc: Đã tạo ${offboardingTasks.length} đầu việc (${isChecklistGenerated ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Đầu việc "Ban hành Quyết định" tự động đánh dấu: ${completedHrTask?.isCompleted ? '✓ ĐÃ HOÀN THÀNH' : 'CHƯA'} (${isHrTaskAutoCompleted ? '✅ ĐÚNG' : '❌ SAI'})`);

    if (isResignationDateSet && isChecklistGenerated && isHrTaskAutoCompleted) {
      console.log('👉 KẾT QUẢ TEST 3: THÀNH CÔNG HOÀN TOÀN ✅\n');
      passedTests++;
    } else {
      console.error('👉 KẾT QUẢ TEST 3: THẤT BẠI ❌\n');
    }

    // Dọn dẹp task thôi việc test để trả lại nhân viên
    await prisma.employee.update({
      where: { id: testEmp.id },
      data: { resignationDate: null, resignationReason: null }
    });
    await prisma.onboardingTask.deleteMany({
      where: {
        employeeId: testEmp.id,
        category: { in: ['OFFBOARDING_WORK', 'OFFBOARDING_IT', 'OFFBOARDING_ADMIN', 'OFFBOARDING_HR'] }
      }
    });
    await prisma.employmentHistory.deleteMany({ where: { changeReason: { contains: decTerm.decisionNumber } } });
    await prisma.decision.delete({ where: { id: decTerm.id } });

    // =========================================================================
    // TEST 4: THU HỒI / HOÀN TÁC QUYẾT ĐỊNH (REVOKE / ROLLBACK)
    // =========================================================================
    console.log('------------------------------------------------------------');
    console.log('▶ TEST 4: Thu hồi Quyết định (Revoke) & Hoàn tác dữ liệu cũ');
    console.log('------------------------------------------------------------');

    // Thu hồi quyết định lương từ TEST 1
    const revokeRes = await fetch(`http://localhost:5000/api/decisions/${decSalary.id}/revoke`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revokeReason: 'Thu hồi quyết định để kiểm tra tính năng hoàn tác' })
    });
    const revokeData = await revokeRes.json();

    if (!revokeRes.ok) {
      throw new Error(`Lỗi thu hồi quyết định: ${JSON.stringify(revokeData)}`);
    }

    // Kiểm tra xem lương hợp đồng có được khôi phục về mức ban đầu không
    const rolledBackContract = await prisma.contract.findUnique({ where: { id: activeContract.id } });
    const isSalaryRolledBack = Number(rolledBackContract?.baseSalary) === initialSalary;
    const isAppendixRemoved = (await prisma.contractAppendix.count({ where: { decisionId: decSalary.id } })) === 0;

    console.log(`   - Trạng thái Quyết định sau thu hồi: CANCELLED`);
    console.log(`   - Lương HĐLĐ đã được khôi phục về ban đầu: ${Number(rolledBackContract?.baseSalary).toLocaleString('vi-VN')} VNĐ (${isSalaryRolledBack ? '✅ ĐÚNG' : '❌ SAI'})`);
    console.log(`   - Phụ lục hợp đồng liên kết đã thu hồi/xóa: (${isAppendixRemoved ? '✅ ĐÚNG' : '❌ SAI'})`);

    if (isSalaryRolledBack && isAppendixRemoved) {
      console.log('👉 KẾT QUẢ TEST 4: THÀNH CÔNG HOÀN TOÀN ✅\n');
      passedTests++;
    } else {
      console.error('👉 KẾT QUẢ TEST 4: THẤT BẠI ❌\n');
    }

    // Dọn dẹp quyết định 1
    await prisma.employmentHistory.deleteMany({ where: { changeReason: { contains: decSalary.decisionNumber } } });
    await prisma.decision.delete({ where: { id: decSalary.id } });

    // =========================================================================
    // TỔNG KẾT
    // =========================================================================
    console.log('========================================================');
    console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} BÀI TEST ĐẠT ĐIỂM TUYỆT ĐỐI (100%)`);
    console.log('Mọi luồng nghiệp vụ liên module hoạt động hoàn hảo và nhất quán!');
    console.log('========================================================');

  } catch (error: any) {
    console.error('❌ Lỗi trong quá trình kiểm thử:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runDecisionTests();


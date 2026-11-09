import { prisma } from '../src/db';

interface EndpointTest {
  domain: string;
  name: string;
  method: string;
  path: string;
  body?: any;
}

async function runSystemHealthCheck() {
  console.log('========================================================================');
  console.log('🛡️  KIỂM THỬ TOÀN DIỆN HỆ THỐNG HRM LLA ENTERPRISE (FULL SYSTEM HEALTH)');
  console.log('========================================================================\n');

  // Lấy 1 nhân viên mẫu để test các sub-endpoint chi tiết
  const sampleEmp = await prisma.employee.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true, fullName: true, code: true }
  });

  const endpoints: EndpointTest[] = [
    // 1. Phân hệ Xác thực (Auth)
    { domain: 'Auth', name: 'Đăng nhập Admin (admin/123456)', method: 'POST', path: '/api/auth/login', body: { username: 'admin', password: '123456' } },
    { domain: 'Auth', name: 'Lấy thông tin tài khoản hiện tại', method: 'GET', path: '/api/auth/me' },
    { domain: 'Auth', name: 'Đăng nhập Nhân viên (emp01/123456)', method: 'POST', path: '/api/auth/login', body: { username: 'emp01', password: '123456' } },

    // 2. Phân hệ Tuyển dụng (Recruitment)
    { domain: 'Tuyển dụng', name: 'Danh sách tin tuyển dụng', method: 'GET', path: '/api/job-postings' },
    { domain: 'Tuyển dụng', name: 'Hồ sơ ứng viên (Candidates)', method: 'GET', path: '/api/candidates' },
    { domain: 'Tuyển dụng', name: 'Lịch phỏng vấn (Interviews)', method: 'GET', path: '/api/interviews' },
    { domain: 'Tuyển dụng', name: 'Thư mời nhận việc (Offers)', method: 'GET', path: '/api/offers' },

    // 3. Phân hệ Tổ chức & Nhân sự (Core HR)
    { domain: 'Tổ chức & Nhân sự', name: 'Cơ cấu phòng ban (Departments)', method: 'GET', path: '/api/departments' },
    { domain: 'Tổ chức & Nhân sự', name: 'Vị trí & Chức danh (Positions)', method: 'GET', path: '/api/positions' },
    { domain: 'Tổ chức & Nhân sự', name: 'Danh sách nhân viên (Employees)', method: 'GET', path: '/api/employees' },
    { domain: 'Tổ chức & Nhân sự', name: 'Lịch sử công tác (History)', method: 'GET', path: '/api/employees/history' },
    { domain: 'Tổ chức & Nhân sự', name: `Chi tiết nhân sự [${sampleEmp?.code}]`, method: 'GET', path: `/api/employees/${sampleEmp?.id}` },
    { domain: 'Tổ chức & Nhân sự', name: 'Hợp đồng lao động (Contracts)', method: 'GET', path: '/api/contracts' },
    { domain: 'Tổ chức & Nhân sự', name: 'Nhân sự Onboarding (Newbies)', method: 'GET', path: '/api/onboarding/newbies' },
    { domain: 'Tổ chức & Nhân sự', name: 'Ứng viên tiền Onboarding (Pre)', method: 'GET', path: '/api/onboarding/pre-onboarding' },
    { domain: 'Tổ chức & Nhân sự', name: 'Tổng quan thôi việc (Offboarding)', method: 'GET', path: '/api/offboarding/overview' },

    // 4. Phân hệ Ca kíp & Chấm công (Time & Attendance)
    { domain: 'Chấm công & Nghỉ phép', name: 'Bảng chấm công (Attendance)', method: 'GET', path: '/api/attendance' },
    { domain: 'Chấm công & Nghỉ phép', name: 'Đơn nghỉ phép (Leaves)', method: 'GET', path: '/api/leaves' },
    { domain: 'Chấm công & Nghỉ phép', name: 'Cấu hình loại phép (Leave Types)', method: 'GET', path: '/api/leave-config/types' },
    { domain: 'Chấm công & Nghỉ phép', name: 'Chính sách thâm niên phép (Policies)', method: 'GET', path: '/api/leave-config/policies' },
    { domain: 'Chấm công & Nghỉ phép', name: 'Lịch nghỉ lễ tết (Holidays)', method: 'GET', path: '/api/holidays' },
    { domain: 'Chấm công & Nghỉ phép', name: 'Đăng ký làm thêm giờ (OT)', method: 'GET', path: '/api/ot' },

    // 5. Phân hệ Tiền lương & Hiệu suất (Payroll & KPI)
    { domain: 'Lương & KPI', name: 'Bảng tính lương (Payroll)', method: 'GET', path: '/api/payroll' },
    { domain: 'Lương & KPI', name: 'Kỳ trả lương (Payroll Periods)', method: 'GET', path: '/api/payroll/periods' },
    { domain: 'Lương & KPI', name: 'Đánh giá KPI (Reviews)', method: 'GET', path: '/api/kpi/reviews' },
    { domain: 'Lương & KPI', name: 'Chu kỳ đánh giá KPI (Cycles)', method: 'GET', path: '/api/kpi/cycles' },

    // 6. Phân hệ Hành chính & Tài sản (Administrative)
    { domain: 'Hành chính & Tài sản', name: 'Kho quản lý tài sản (Assets)', method: 'GET', path: '/api/assets' },
    { domain: 'Hành chính & Tài sản', name: 'Cấp phát tài sản (Assignments)', method: 'GET', path: '/api/assets/assignments' },
    { domain: 'Hành chính & Tài sản', name: 'Sổ quyết định nhân sự (Decisions)', method: 'GET', path: '/api/decisions' },

    // 7. Phân hệ Báo cáo & Hệ thống (System & Analytics)
    { domain: 'Hệ thống & Báo cáo', name: 'Tham số hệ thống (Settings)', method: 'GET', path: '/api/settings' },
    { domain: 'Hệ thống & Báo cáo', name: 'Nhật ký kiểm toán (Audit Logs)', method: 'GET', path: '/api/settings/audit-logs' },
    { domain: 'Hệ thống & Báo cáo', name: 'Báo cáo tổng hợp HR Analytics', method: 'GET', path: '/api/reports/overview' },
    { domain: 'Hệ thống & Báo cáo', name: 'Dashboard thống kê điều hành', method: 'GET', path: '/api/dashboard/stats' }
  ];

  let adminToken = '';

  // --- PHẦN 1: KIỂM TRA TẤT CẢ ENDPOINTS API ---
  console.log(`--- 1. KIỂM THỬ TẤT CẢ ${endpoints.length} ENDPOINTS API CỦA CÁC PHÂN HỆ ---`);
  let passedEndpoints = 0;
  let failedEndpoints = 0;

  for (const ep of endpoints) {
    const startTime = Date.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (adminToken && ep.name !== 'Đăng nhập Nhân viên (emp01/123456)') {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const options: RequestInit = {
        method: ep.method,
        headers
      };

      if (ep.body) {
        options.body = JSON.stringify(ep.body);
      }

      const res = await fetch(`http://localhost:5000${ep.path}`, options);
      const duration = Date.now() - startTime;
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok) {
        // Lưu adminToken nếu là login admin thành công
        if (ep.path === '/api/auth/login' && ep.body?.username === 'admin' && data?.token) {
          adminToken = data.token;
        }

        let countInfo = '';
        if (Array.isArray(data)) {
          countInfo = `(${data.length} bản ghi)`;
        } else if (data?.data && Array.isArray(data.data)) {
          countInfo = `(${data.data.length} bản ghi)`;
        } else if (data?.token) {
          countInfo = `(Token OK)`;
        } else if (data?.accountId || data?.user) {
          countInfo = `(Profile OK)`;
        } else if (data?.id) {
          countInfo = `(Data ID: ${data.id.slice(0, 8)}...)`;
        }

        console.log(`  ✅ [${ep.domain.padEnd(21)}] ${ep.name.padEnd(38)} -> HTTP ${res.status} [${duration}ms] ${countInfo}`);
        passedEndpoints++;
      } else {
        console.error(`  ❌ [${ep.domain.padEnd(21)}] ${ep.name.padEnd(38)} -> HTTP ${res.status} [${duration}ms]`);
        console.error(`     Chi tiết lỗi: ${JSON.stringify(data)}`);
        failedEndpoints++;
      }
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.error(`  ❌ [${ep.domain.padEnd(21)}] ${ep.name.padEnd(38)} -> EXCEPTION [${duration}ms]: ${err.message}`);
      failedEndpoints++;
    }
  }

  console.log(`\n📊 Kết quả API: ${passedEndpoints}/${endpoints.length} endpoints (${Math.round((passedEndpoints / endpoints.length) * 100)}%) hoạt động ổn định.`);
  if (failedEndpoints > 0) {
    console.error(`⚠️ Có ${failedEndpoints} endpoint bị lỗi.`);
  }

  // --- PHẦN 2: KIỂM THỬ TOÀN VẸN CƠ SỞ DỮ LIỆU (DATABASE INTEGRITY) ---
  console.log('\n--- 2. KIỂM THỬ TOÀN VẸN CƠ SỞ DỮ LIỆU (DATABASE INTEGRITY) ---');
  try {
    const [
      employeeCount,
      departmentCount,
      positionCount,
      contractCount,
      decisionCount,
      attendanceCount,
      payrollCount,
      assetCount,
      jobPostingCount,
      candidateCount,
      userCount
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.department.count(),
      prisma.position.count(),
      prisma.contract.count(),
      prisma.decision.count(),
      prisma.attendance.count(),
      prisma.payrollPeriod.count(),
      prisma.asset.count(),
      prisma.jobPosting.count(),
      prisma.candidate.count(),
      prisma.account.count()
    ]);

    console.log(`  ✓ Số lượng Nhân sự (Employees):              ${employeeCount}`);
    console.log(`  ✓ Số lượng Phòng ban (Departments):           ${departmentCount}`);
    console.log(`  ✓ Số lượng Vị trí / Chức danh (Positions):       ${positionCount}`);
    console.log(`  ✓ Số lượng Hợp đồng LĐ (Contracts):           ${contractCount}`);
    console.log(`  ✓ Số lượng Quyết định (Decisions):            ${decisionCount}`);
    console.log(`  ✓ Số lượng Bản ghi Chấm công (Attendance):       ${attendanceCount}`);
    console.log(`  ✓ Số lượng Kỳ lương (Payroll Periods):        ${payrollCount}`);
    console.log(`  ✓ Số lượng Thiết bị Kho tài sản (Assets):       ${assetCount}`);
    console.log(`  ✓ Tin tuyển dụng & Ứng viên:                 ${jobPostingCount} tin / ${candidateCount} ứng viên`);
    console.log(`  ✓ Tài khoản người dùng (Accounts):            ${userCount}`);

    // Kiểm tra tính toàn vẹn quan hệ (Foreign Key consistency check)
    const orphanedEmployeesDept = await prisma.employee.count({
      where: {
        departmentId: { not: null },
        department: { is: null }
      }
    });

    const orphanedEmployeesPos = await prisma.employee.count({
      where: {
        positionId: { not: null },
        position: { is: null }
      }
    });

    const employeesWithoutContract = await prisma.employee.count({
      where: {
        status: 'ACTIVE',
        contracts: { none: {} }
      }
    });

    console.log('\n--- 3. KIỂM TRA TÍNH TOÀN VẸN LIÊN KẾT (RELATION INTEGRITY) ---');
    console.log(`  - Nhân viên có mã phòng ban không tồn tại (Orphaned Dept): ${orphanedEmployeesDept === 0 ? '0 (✅ ĐẠT)' : `${orphanedEmployeesDept} (❌ LỖI)`}`);
    console.log(`  - Nhân viên có chức danh không tồn tại (Orphaned Pos):   ${orphanedEmployeesPos === 0 ? '0 (✅ ĐẠT)' : `${orphanedEmployeesPos} (❌ LỖI)`}`);
    console.log(`  - Nhân sự ACTIVE chưa có HĐLĐ:                           ${employeesWithoutContract === 0 ? '0 (✅ 100% ĐÃ KÝ HĐLĐ)' : `${employeesWithoutContract} người`}`);

    console.log('\n========================================================================');
    if (failedEndpoints === 0 && orphanedEmployeesDept === 0 && orphanedEmployeesPos === 0) {
      console.log('🎉 TỔNG KẾT: TOÀN BỘ HỆ THỐNG HOẠT ĐỘNG HOÀN TOÀN KHỎE MẠNH VÀ ỔN ĐỊNH 100%!');
    } else {
      console.log('⚠️ TỔNG KẾT: HỆ THỐNG CÓ MỘT SỐ VẤN ĐỀ CẦN ĐIỀU CHỈNH.');
    }
    console.log('========================================================================\n');

  } catch (dbErr: any) {
    console.error('❌ Lỗi kết nối CSDL khi kiểm tra Integrity:', dbErr.message);
  } finally {
    await prisma.$disconnect();
  }
}

runSystemHealthCheck();

const { prisma } = require('../src/db');

async function seedOnboardingDemo() {
  console.log('Seeding Onboarding Demo Scenarios...');
  
  // Find a department and position
  const dept = await prisma.department.findFirst();
  const pos = await prisma.position.findFirst();

  if (!dept || !pos) {
    console.error('Dept or Position not found');
    process.exit(1);
  }

  // 1. Employee 1: NV0140 - Trần Văn Tiếp Nhận (Today, Normal countdown 7 days)
  const emp1 = await prisma.employee.upsert({
    where: { code: 'NV0140' },
    update: {
      status: 'ONBOARDING',
      joinDate: new Date('2026-10-24T08:00:00Z'),
      departmentId: dept.id,
      positionId: pos.id,
    },
    create: {
      code: 'NV0140',
      fullName: 'Trần Văn Tiếp Nhận (Test)',
      email: 'tiepnhan.test@company.vn',
      phone: '0901234567',
      status: 'ONBOARDING',
      joinDate: new Date('2026-10-24T08:00:00Z'),
      departmentId: dept.id,
      positionId: pos.id,
    }
  });

  // 2. Employee 2: NV0141 - Lê Thị Thảo Trang (Joined 14 days ago, Overdue > 7 days -> LOCKED)
  const emp2 = await prisma.employee.upsert({
    where: { code: 'NV0141' },
    update: {
      status: 'ONBOARDING',
      joinDate: new Date('2026-10-10T08:00:00Z'),
      departmentId: dept.id,
      positionId: pos.id,
    },
    create: {
      code: 'NV0141',
      fullName: 'Lê Thị Thảo Trang',
      email: 'trang.le@company.vn',
      phone: '0912345678',
      status: 'ONBOARDING',
      joinDate: new Date('2026-10-10T08:00:00Z'),
      departmentId: dept.id,
      positionId: pos.id,
    }
  });

  // 3. Employee 3: NV0142 - Hoàng Minh Quân (Joined 4 days ago, Completed 100% checklist -> READY TO GRADUATE)
  const emp3 = await prisma.employee.upsert({
    where: { code: 'NV0142' },
    update: {
      status: 'ONBOARDING',
      joinDate: new Date('2026-10-20T08:00:00Z'),
      departmentId: dept.id,
      positionId: pos.id,
    },
    create: {
      code: 'NV0142',
      fullName: 'Hoàng Minh Quân',
      email: 'quan.hoang@company.vn',
      phone: '0923456789',
      status: 'ONBOARDING',
      joinDate: new Date('2026-10-20T08:00:00Z'),
      departmentId: dept.id,
      positionId: pos.id,
    }
  });

  // Add 100% completed tasks for emp3
  const tasksList = [
    { category: 'IT_SUPPORT', taskName: 'Khởi tạo Email công ty & cấp tài khoản M365/Workspace' },
    { category: 'IT_SUPPORT', taskName: 'Cấp tài khoản phần mềm HRM & phân quyền chức vụ' },
    { category: 'IT_SUPPORT', taskName: 'Cấp phát Laptop/PC và cài đặt phần mềm làm việc' },
    { category: 'ADMIN', taskName: 'Bố trí bàn làm việc, ghế ngồi & văn phòng phẩm' },
    { category: 'ADMIN', taskName: 'In và cấp Thẻ từ nhân viên ra vào tòa nhà' },
    { category: 'ADMIN', taskName: 'Lập biên bản bàn giao tài sản thiết bị (Mẫu BM-01)' },
    { category: 'HR', taskName: 'Hướng dẫn ký Hợp đồng thử việc & Đóng dấu lưu trữ' },
    { category: 'HR', taskName: 'Ký Cam kết Bảo mật thông tin (NDA) & Nội quy lao động' },
    { category: 'HR', taskName: 'Thu nộp & đối soát hồ sơ bản cứng (CCCD, Bằng cấp)' },
    { category: 'MANAGER', taskName: 'Chỉ định Người hướng dẫn (Mentor / Buddy kèm cặp)' },
    { category: 'MANAGER', taskName: 'Giao Bản mô tả công việc & Mục tiêu KPI thử việc' },
    { category: 'MANAGER', taskName: 'Họp tiếp nhận thành viên mới cùng toàn đội ngũ (Team)' }
  ];

  for (const t of tasksList) {
    await prisma.onboardingTask.upsert({
      where: {
        id: (await prisma.onboardingTask.findFirst({
          where: { employeeId: emp3.id, taskName: t.taskName, category: t.category }
        }))?.id || '00000000-0000-0000-0000-000000000000'
      },
      update: { isCompleted: true },
      create: {
        employeeId: emp3.id,
        taskName: t.taskName,
        category: t.category,
        isCompleted: true
      }
    });
  }

  // 4. Seed Pre-Onboarding Candidates (Offer Accepted, waiting for Day N)
  const jobPosting = await prisma.jobPosting.findFirst({
    include: { department: true, position: true }
  });

  if (jobPosting) {
    // Candidate 1: Đỗ Thu Thảo (Full Pre-onboarding submitted)
    let cand1 = await prisma.candidate.findFirst({ where: { email: 'thao.do@demo.com' } });
    if (!cand1) {
      cand1 = await prisma.candidate.create({
        data: {
          name: 'Đỗ Thu Thảo',
          email: 'thao.do@demo.com',
          phone: '0987112233',
          jobPostingId: jobPosting.id,
          status: 'OFFERING',
        }
      });
    }

    await prisma.jobOffer.upsert({
      where: { candidateId: cand1.id },
      update: {
        status: 'ACCEPTED',
        baseSalary: 15000000,
        startDate: new Date('2026-10-28T08:00:00Z'),
        respondedAt: new Date()
      },
      create: {
        candidateId: cand1.id,
        status: 'ACCEPTED',
        baseSalary: 15000000,
        startDate: new Date('2026-10-28T08:00:00Z'),
        respondedAt: new Date()
      }
    });

    await prisma.preOnboardingProfile.upsert({
      where: { candidateId: cand1.id },
      update: {
        cccd: '001198012345',
        gender: 'FEMALE',
        dateOfBirth: new Date('1998-05-15'),
        address: 'Số 18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
        nationality: 'Việt Nam',
        taxCode: '8541290123',
        bankName: 'BIDV',
        bankAccount: '12410002345678',
        emergencyContactName: 'Đỗ Văn Nam (Bố)',
        emergencyContactPhone: '0988776655',
        emergencyContactRelation: 'Bố ruột'
      },
      create: {
        candidateId: cand1.id,
        cccd: '001198012345',
        gender: 'FEMALE',
        dateOfBirth: new Date('1998-05-15'),
        address: 'Số 18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
        nationality: 'Việt Nam',
        taxCode: '8541290123',
        bankName: 'BIDV',
        bankAccount: '12410002345678',
        emergencyContactName: 'Đỗ Văn Nam (Bố)',
        emergencyContactPhone: '0988776655',
        emergencyContactRelation: 'Bố ruột'
      }
    });

    // Candidate 2: Nguyễn Quốc Bảo (Offer accepted, waiting Day N)
    let cand2 = await prisma.candidate.findFirst({ where: { email: 'bao.nguyen@demo.com' } });
    if (!cand2) {
      cand2 = await prisma.candidate.create({
        data: {
          name: 'Nguyễn Quốc Bảo',
          email: 'bao.nguyen@demo.com',
          phone: '0918223344',
          jobPostingId: jobPosting.id,
          status: 'OFFERING',
        }
      });
    }

    await prisma.jobOffer.upsert({
      where: { candidateId: cand2.id },
      update: {
        status: 'ACCEPTED',
        baseSalary: 22000000,
        startDate: new Date('2026-11-01T08:00:00Z'),
        respondedAt: new Date()
      },
      create: {
        candidateId: cand2.id,
        status: 'ACCEPTED',
        baseSalary: 22000000,
        startDate: new Date('2026-11-01T08:00:00Z'),
        respondedAt: new Date()
      }
    });

    await prisma.preOnboardingProfile.upsert({
      where: { candidateId: cand2.id },
      update: {
        cccd: '079201009876',
        gender: 'MALE',
        dateOfBirth: new Date('1996-11-20'),
        address: 'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM',
        nationality: 'Việt Nam',
        taxCode: '8491209384',
        bankName: 'Techcombank',
        bankAccount: '19034567891011',
        emergencyContactName: 'Nguyễn Văn Minh (Anh trai)',
        emergencyContactPhone: '0903332211',
        emergencyContactRelation: 'Anh ruột'
      },
      create: {
        candidateId: cand2.id,
        cccd: '079201009876',
        gender: 'MALE',
        dateOfBirth: new Date('1996-11-20'),
        address: 'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM',
        nationality: 'Việt Nam',
        taxCode: '8491209384',
        bankName: 'Techcombank',
        bankAccount: '19034567891011',
        emergencyContactName: 'Nguyễn Văn Minh (Anh trai)',
        emergencyContactPhone: '0903332211',
        emergencyContactRelation: 'Anh ruột'
      }
    });
  }

  // 5. Seed sample BOD Override Audit Log
  const existingAudit = await prisma.auditLog.findFirst({
    where: { action: 'BOD_OVERRIDE_ONBOARDING_PAYROLL_LOCK' }
  });
  if (!existingAudit) {
    await prisma.auditLog.create({
      data: {
        action: 'BOD_OVERRIDE_ONBOARDING_PAYROLL_LOCK',
        tableName: 'Employee',
        recordId: emp2.id,
        accountId: 'BOD_EXECUTIVE',
        details: `Ban Giám đốc phê duyệt mở khóa chi trả lương ngoại lệ cho ${emp2.fullName} (${emp2.code}). Lý do: Nhân sự ngoại tỉnh đang chờ trường đại học cấp bằng tốt nghiệp bản gốc.`
      }
    });
  }

  console.log('Successfully seeded 3 demo employees, 2 pre-onboarding candidates, and BOD Audit Log!');
  process.exit(0);
}

seedOnboardingDemo().catch(err => {
  console.error(err);
  process.exit(1);
});


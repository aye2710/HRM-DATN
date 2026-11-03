import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from '../src/db';

async function seedRecruitmentData() {
  console.log('🚀 Bắt đầu khởi tạo dữ liệu mẫu phong phú cho Module Tuyển Dụng & Quyết Định Tuyển Dụng...');

  // 1. Lấy danh sách Phòng ban & Vị trí hiện có
  const depts = await prisma.department.findMany();
  const deptMap: Record<string, string> = {};
  depts.forEach(d => {
    deptMap[d.code] = d.id;
  });

  const positions = await prisma.position.findMany();
  const posMap: Record<string, string> = {};
  positions.forEach(p => {
    posMap[p.code] = p.id;
  });

  const itDeptId = deptMap['IT'] || deptMap['DEV'] || depts[0]?.id;
  const devDeptId = deptMap['DEV'] || itDeptId;
  const baDeptId = deptMap['BA'] || itDeptId;
  const testDeptId = deptMap['TEST'] || itDeptId;
  const salesDeptId = deptMap['SALES'] || depts[0]?.id;
  const ktDeptId = deptMap['KT'] || depts[0]?.id;

  // Lấy hoặc fallback vị trí chức danh
  const feSeniorPos = positions.find(p => p.code.includes('DEV-FE-SENIOR') || p.title.includes('Frontend'))?.id || positions[0]?.id;
  const feJuniorPos = positions.find(p => p.code.includes('DEV-FE-JUNIOR') || p.title.includes('Frontend'))?.id || positions[0]?.id;
  const beMidPos = positions.find(p => p.code.includes('DEV-BE-MID') || p.title.includes('Backend'))?.id || positions[0]?.id;
  const baMidPos = positions.find(p => p.code.includes('BA-MID') || p.title.includes('BA') || p.title.includes('Phân tích'))?.id || positions[0]?.id;
  const testJuniorPos = positions.find(p => p.code.includes('TEST-JUNIOR') || p.title.includes('Test'))?.id || positions[0]?.id;
  const salesMidPos = positions.find(p => p.code.includes('SALES-MID') || p.title.includes('Sales') || p.title.includes('Kinh doanh'))?.id || positions[0]?.id;
  const ktJuniorPos = positions.find(p => p.code.includes('KT-JUNIOR') || p.title.includes('Kế toán'))?.id || positions[0]?.id;

  // Lấy nhân viên làm người phỏng vấn
  const hrManager = await prisma.employee.findFirst();
  const interviewerId = hrManager?.id || 'interviewer-system-id';

  // 2. Tạo JobPostings (Yêu cầu & Tin tuyển dụng)
  console.log('📌 Tạo các tin tuyển dụng (JobPostings)...');
  
  const jobsData = [
    {
      title: 'Senior Frontend Engineer (React/TypeScript)',
      description: 'Phát triển các module cốt lõi nền tảng Enterprise HRM, tối ưu Web Vitals, xây dựng Design System và Micro-Frontend.',
      amount: 2,
      publishDate: new Date('2026-10-01'),
      deadline: new Date('2026-11-30'),
      status: 'PUBLISHED',
      salaryRange: '28.000.000 - 38.000.000 VNĐ',
      jobType: 'Full-time',
      level: 'Senior',
      location: 'Hà Nội',
      workplaceType: 'Hybrid',
      experienceLevel: 'Từ 3-5 năm kinh nghiệm',
      recruitmentReason: 'EXPANSION',
      recruiterName: 'Phòng Nhân Sự LLA',
      departmentId: devDeptId,
      positionId: feSeniorPos
    },
    {
      title: 'Mid-Level Backend Developer (Node.js/PostgreSQL)',
      description: 'Thiết kế RESTful APIs, tối ưu hóa cơ sở dữ liệu PostgreSQL với Prisma ORM, xây dựng kiến trúc mở rộng và bảo mật đa tầng.',
      amount: 3,
      publishDate: new Date('2026-10-05'),
      deadline: new Date('2026-11-25'),
      status: 'PUBLISHED',
      salaryRange: '18.000.000 - 25.000.000 VNĐ',
      jobType: 'Full-time',
      level: 'Middle',
      location: 'Hà Nội',
      workplaceType: 'On-site',
      experienceLevel: '2 năm kinh nghiệm Node.js',
      recruitmentReason: 'PROJECT',
      recruiterName: 'Phòng Nhân Sự LLA',
      departmentId: devDeptId,
      positionId: beMidPos
    },
    {
      title: 'Chuyên Viên Phân Tích Nghiệp Vụ (Business Analyst - BA)',
      description: 'Làm việc trực tiếp cùng khách hàng doanh nghiệp, khảo sát quy trình HRM/ERP, viết tài liệu đặc tả SRS, Wireframe và User Story.',
      amount: 2,
      publishDate: new Date('2026-10-10'),
      deadline: new Date('2026-11-20'),
      status: 'PUBLISHED',
      salaryRange: '16.000.000 - 24.000.000 VNĐ',
      jobType: 'Full-time',
      level: 'Middle',
      location: 'Hà Nội',
      workplaceType: 'On-site',
      experienceLevel: '2 năm kinh nghiệm BA phần mềm',
      recruitmentReason: 'EXPANSION',
      recruiterName: 'Phòng Nhân Sự LLA',
      departmentId: baDeptId,
      positionId: baMidPos
    },
    {
      title: 'Kỹ Sư Kiểm Thử Chất Lượng Phần Mềm (QA/QC Automation Tester)',
      description: 'Lập kịch bản kiểm thử tự động (Automation Test) với Cypress/Selenium, kiểm thử hiệu năng API (JMeter) và kiểm soát chất lượng bàn giao.',
      amount: 2,
      publishDate: new Date('2026-10-12'),
      deadline: new Date('2026-11-18'),
      status: 'PUBLISHED',
      salaryRange: '13.000.000 - 18.000.000 VNĐ',
      jobType: 'Full-time',
      level: 'Junior',
      location: 'Hà Nội',
      workplaceType: 'On-site',
      experienceLevel: '1 năm kinh nghiệm kiểm thử',
      recruitmentReason: 'EXPANSION',
      recruiterName: 'Phòng Nhân Sự LLA',
      departmentId: testDeptId,
      positionId: testJuniorPos
    },
    {
      title: 'Chuyên Viên Kinh Doanh Giải Pháp B2B (Sales Executive)',
      description: 'Tìm kiếm mở rộng tệp khách hàng doanh nghiệp vừa và lớn, tư vấn triển khai phần mềm quản trị nhân sự LLA HRM.',
      amount: 2,
      publishDate: new Date('2026-10-15'),
      deadline: new Date('2026-11-30'),
      status: 'PUBLISHED',
      salaryRange: '12.000.000 - 20.000.000 VNĐ + Thưởng DS',
      jobType: 'Full-time',
      level: 'Middle',
      location: 'Hà Nội',
      workplaceType: 'On-site',
      experienceLevel: '1-2 năm kinh nghiệm Sales B2B/SaaS',
      recruitmentReason: 'EXPANSION',
      recruiterName: 'Phòng Nhân Sự LLA',
      departmentId: salesDeptId,
      positionId: salesMidPos
    },
    {
      title: 'Kế Toán Viên Tổng Hợp Doanh Nghiệp',
      description: 'Quản lý thu chi nội bộ, đối soát hóa đơn chứng từ điện tử, lập tờ khai thuế GTGT và phối hợp làm bảng lương tháng.',
      amount: 1,
      publishDate: new Date('2026-09-15'),
      deadline: new Date('2026-10-25'),
      status: 'CLOSED',
      salaryRange: '11.000.000 - 15.000.000 VNĐ',
      jobType: 'Full-time',
      level: 'Junior',
      location: 'Hà Nội',
      workplaceType: 'On-site',
      experienceLevel: '1 năm kinh nghiệm kế toán',
      recruitmentReason: 'REPLACEMENT',
      recruiterName: 'Phòng Nhân Sự LLA',
      departmentId: ktDeptId,
      positionId: ktJuniorPos
    }
  ];

  const createdJobs = [];
  for (const job of jobsData) {
    const existing = await prisma.jobPosting.findFirst({ where: { title: job.title } });
    if (!existing) {
      const created = await prisma.jobPosting.create({ data: job });
      createdJobs.push(created);
    } else {
      createdJobs.push(existing);
    }
  }

  const jobFE = createdJobs[0];
  const jobBE = createdJobs[1];
  const jobBA = createdJobs[2];
  const jobQA = createdJobs[3];
  const jobSales = createdJobs[4];

  // 3. Tạo danh sách Ứng viên (Candidates) theo phễu ATS
  console.log('📌 Tạo danh sách ứng viên (Candidates)...');
  const candidatesData = [
    // Giai đoạn 1: APPLIED (Nộp hồ sơ)
    {
      name: 'Nguyễn Hoàng Nam',
      email: 'nam.nguyen98@gmail.com',
      phone: '0988112233',
      cvUrl: 'https://lla-hrm.vn/cv/nam-nguyen-fe-senior.pdf',
      jobPostingId: jobFE.id,
      status: 'APPLIED' as const
    },
    {
      name: 'Trần Thùy Linh',
      email: 'linh.tran.ba@gmail.com',
      phone: '0977223344',
      cvUrl: 'https://lla-hrm.vn/cv/thuy-linh-ba.pdf',
      jobPostingId: jobBA.id,
      status: 'APPLIED' as const
    },
    {
      name: 'Đỗ Minh Quân',
      email: 'quan.do.tester@gmail.com',
      phone: '0966334455',
      cvUrl: 'https://lla-hrm.vn/cv/minh-quan-qa.pdf',
      jobPostingId: jobQA.id,
      status: 'APPLIED' as const
    },

    // Giai đoạn 2: SCREENING (Sơ loại hồ sơ)
    {
      name: 'Lê Văn Đức',
      email: 'duc.le.dev@gmail.com',
      phone: '0912345678',
      cvUrl: 'https://lla-hrm.vn/cv/van-duc-backend.pdf',
      jobPostingId: jobBE.id,
      status: 'SCREENING' as const
    },
    {
      name: 'Vũ Thị Mai',
      email: 'mai.vu.sales@gmail.com',
      phone: '0933445566',
      cvUrl: 'https://lla-hrm.vn/cv/mai-vu-sales-b2b.pdf',
      jobPostingId: jobSales.id,
      status: 'SCREENING' as const
    },

    // Giai đoạn 3: INTERVIEWING (Đang phỏng vấn)
    {
      name: 'Phạm Gia Huy',
      email: 'huy.pham.fe@gmail.com',
      phone: '0944556677',
      cvUrl: 'https://lla-hrm.vn/cv/gia-huy-react-senior.pdf',
      jobPostingId: jobFE.id,
      status: 'INTERVIEWING' as const
    },
    {
      name: 'Bùi Thu Trang',
      email: 'trang.bui.ba@gmail.com',
      phone: '0922889900',
      cvUrl: 'https://lla-hrm.vn/cv/thu-trang-ba-lead.pdf',
      jobPostingId: jobBA.id,
      status: 'INTERVIEWING' as const
    },

    // Giai đoạn 4: OFFERING (Đang gửi Thư mời nhận việc)
    {
      name: 'Đặng Quốc Bảo',
      email: 'bao.dang.be@gmail.com',
      phone: '0911778899',
      cvUrl: 'https://lla-hrm.vn/cv/quoc-bao-backend-nodejs.pdf',
      jobPostingId: jobBE.id,
      status: 'OFFERING' as const
    },

    // Giai đoạn 5: HIRED (Đã nhận việc & Trúng tuyển)
    {
      name: 'Hoàng Minh Tuấn',
      email: 'tuan.hoang.fe@gmail.com',
      phone: '0909123456',
      cvUrl: 'https://lla-hrm.vn/cv/hoang-tuan-fe.pdf',
      jobPostingId: jobFE.id,
      status: 'HIRED' as const
    },
    {
      name: 'Nguyễn Thị Ngọc Ánh',
      email: 'anh.nguyen.qa@gmail.com',
      phone: '0908654321',
      cvUrl: 'https://lla-hrm.vn/cv/ngoc-anh-qa.pdf',
      jobPostingId: jobQA.id,
      status: 'HIRED' as const
    }
  ];

  const createdCandidates: Record<string, any> = {};

  for (const c of candidatesData) {
    let candidate = await prisma.candidate.findUnique({
      where: { email_jobPostingId: { email: c.email, jobPostingId: c.jobPostingId } }
    });

    if (!candidate) {
      candidate = await prisma.candidate.create({ data: c });
    } else {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: { status: c.status, phone: c.phone, name: c.name }
      });
    }
    createdCandidates[c.email] = candidate;
  }

  // 4. Tạo lịch phỏng vấn (InterviewRound & Feedback)
  console.log('📌 Tạo lịch phỏng vấn & đánh giá ứng viên...');
  
  // Lịch 1: Phạm Gia Huy
  const candHuy = createdCandidates['huy.pham.fe@gmail.com'];
  if (candHuy) {
    const existingInterview = await prisma.interviewRound.findFirst({ where: { candidateId: candHuy.id } });
    if (!existingInterview) {
      const interviewHuy = await prisma.interviewRound.create({
        data: {
          candidateId: candHuy.id,
          interviewerId: interviewerId,
          roundName: 'Vòng 1: Đánh giá Năng lực Kỹ thuật (Technical Test)',
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 ngày sau
          status: 'CONFIRMED',
          location: 'Trực tuyến Google Meet (meet.google.com/lla-tech-fe)',
          candidateResponse: 'Ứng viên xác nhận tham gia đúng giờ.',
          respondedAt: new Date()
        }
      });
      await prisma.candidateFeedback.create({
        data: {
          interviewRoundId: interviewHuy.id,
          score: 88,
          comments: 'Ứng viên có kiến thức sâu về React hooks, state management và micro-frontend. Trả lời xuất sắc phần tối ưu DOM và bundle size.'
        }
      });
    }
  }

  // Lịch 2: Bùi Thu Trang
  const candTrang = createdCandidates['trang.bui.ba@gmail.com'];
  if (candTrang) {
    const existingInterview = await prisma.interviewRound.findFirst({ where: { candidateId: candTrang.id } });
    if (!existingInterview) {
      const interviewTrang = await prisma.interviewRound.create({
        data: {
          candidateId: candTrang.id,
          interviewerId: interviewerId,
          roundName: 'Vòng 2: Phỏng vấn Nghiệp vụ & Văn hóa doanh nghiệp',
          scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 ngày sau
          status: 'CONFIRMED',
          location: 'Phòng họp VIP Tầng 3 - Trụ sở chính LLA Building',
          candidateResponse: 'Đã nhận thư mời và xác nhận tham gia.',
          respondedAt: new Date()
        }
      });
      await prisma.candidateFeedback.create({
        data: {
          interviewRoundId: interviewTrang.id,
          score: 92,
          comments: 'Kỹ năng giao tiếp xuất sắc, nắm chắc nghiệp vụ HRM/Payroll và quy trình Agile Scrum. Rất phù hợp với văn hóa công ty.'
        }
      });
    }
  }

  // 5. Tạo Thư mời nhận việc (JobOffer)
  console.log('📌 Tạo thư mời nhận việc (JobOffer)...');
  
  // Offer cho Đặng Quốc Bảo (OFFERING)
  const candBao = createdCandidates['bao.dang.be@gmail.com'];
  if (candBao) {
    const existingOffer = await prisma.jobOffer.findUnique({ where: { candidateId: candBao.id } });
    if (!existingOffer) {
      await prisma.jobOffer.create({
        data: {
          candidateId: candBao.id,
          baseSalary: 22000000,
          probationRate: 85,
          startDate: new Date('2026-11-15'),
          contractType: 'PROBATION',
          notes: 'Mức lương chính thức 22.000.000 VNĐ/tháng. Thử việc 02 tháng hưởng 85% lương cơ bản kèm phụ cấp cơm trưa 730.000 VNĐ.',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  // Offer cho Hoàng Minh Tuấn (ACCEPTED)
  const candTuan = createdCandidates['tuan.hoang.fe@gmail.com'];
  if (candTuan) {
    const existingOffer = await prisma.jobOffer.findUnique({ where: { candidateId: candTuan.id } });
    if (!existingOffer) {
      await prisma.jobOffer.create({
        data: {
          candidateId: candTuan.id,
          baseSalary: 15000000,
          probationRate: 85,
          startDate: new Date('2026-10-01'),
          contractType: 'PROBATION',
          notes: 'Đã hoàn tất thủ tục và đồng ý ký Hợp đồng lao động.',
          status: 'ACCEPTED',
          respondedAt: new Date('2026-09-28')
        }
      });
    }
  }

  // Offer cho Nguyễn Thị Ngọc Ánh (ACCEPTED)
  const candAnh = createdCandidates['anh.nguyen.qa@gmail.com'];
  if (candAnh) {
    const existingOffer = await prisma.jobOffer.findUnique({ where: { candidateId: candAnh.id } });
    if (!existingOffer) {
      await prisma.jobOffer.create({
        data: {
          candidateId: candAnh.id,
          baseSalary: 13500000,
          probationRate: 85,
          startDate: new Date('2026-10-05'),
          contractType: 'PROBATION',
          notes: 'Ứng viên đã nộp đủ hồ sơ cá nhân và tiếp nhận công việc.',
          status: 'ACCEPTED',
          respondedAt: new Date('2026-10-02')
        }
      });
    }
  }

  // 6. Tạo Nhân sự tương ứng trong bảng Employee để liên kết với Quyết định Tiếp nhận
  console.log('📌 Đồng bộ nhân sự vào danh sách Employee & Tạo Quyết định Tuyển dụng...');

  // Nhân viên 1: Hoàng Minh Tuấn
  let empTuan = await prisma.employee.findFirst({ where: { email: 'tuan.hoang.fe@gmail.com' } });
  if (!empTuan) {
    empTuan = await prisma.employee.create({
      data: {
        code: 'NV-2026-001',
        fullName: 'Hoàng Minh Tuấn',
        email: 'tuan.hoang.fe@gmail.com',
        phone: '0909123456',
        gender: 'MALE',
        dateOfBirth: new Date('1998-05-15'),
        departmentId: devDeptId,
        positionId: feJuniorPos,
        status: 'ACTIVE',
        joinDate: new Date('2026-10-01'),
        officialJoinDate: new Date('2026-11-01')
      }
    });

    // Tạo hợp đồng chính thức
    await prisma.contract.create({
      data: {
        contractNumber: 'HĐLĐ-2026/001/LLA',
        employeeId: empTuan.id,
        contractType: 'OFFICIAL_1Y',
        baseSalary: 15000000,
        startDate: new Date('2026-11-01'),
        endDate: new Date('2027-10-31'),
        status: 'ACTIVE'
      }
    });
  }

  // Nhân viên 2: Nguyễn Thị Ngọc Ánh
  let empAnh = await prisma.employee.findFirst({ where: { email: 'anh.nguyen.qa@gmail.com' } });
  if (!empAnh) {
    empAnh = await prisma.employee.create({
      data: {
        code: 'NV-2026-002',
        fullName: 'Nguyễn Thị Ngọc Ánh',
        email: 'anh.nguyen.qa@gmail.com',
        phone: '0908654321',
        gender: 'FEMALE',
        dateOfBirth: new Date('2000-09-20'),
        departmentId: testDeptId,
        positionId: testJuniorPos,
        status: 'ACTIVE',
        joinDate: new Date('2026-10-05'),
        officialJoinDate: new Date('2026-11-05')
      }
    });

    await prisma.contract.create({
      data: {
        contractNumber: 'HĐLĐ-2026/002/LLA',
        employeeId: empAnh.id,
        contractType: 'OFFICIAL_1Y',
        baseSalary: 13500000,
        startDate: new Date('2026-11-05'),
        endDate: new Date('2027-11-04'),
        status: 'ACTIVE'
      }
    });
  }

  // Nhân viên 3: Đặng Quốc Bảo (Đang trong giai đoạn chuẩn bị tiếp nhận)
  let empBao = await prisma.employee.findFirst({ where: { email: 'bao.dang.be@gmail.com' } });
  if (!empBao) {
    empBao = await prisma.employee.create({
      data: {
        code: 'NV-2026-003',
        fullName: 'Đặng Quốc Bảo',
        email: 'bao.dang.be@gmail.com',
        phone: '0911778899',
        gender: 'MALE',
        dateOfBirth: new Date('1997-12-10'),
        departmentId: devDeptId,
        positionId: beMidPos,
        status: 'PROBATION',
        joinDate: new Date('2026-11-15')
      }
    });
  }

  // 7. Tạo các Quyết định Tuyển dụng (type: RECRUITMENT)
  console.log('📌 Tạo các Quyết định Tuyển dụng / Tiếp nhận chính thức...');

  const recruitmentDecisions = [
    {
      decisionNumber: 'QĐ-2026/001/LLA',
      title: 'Quyết định tiếp nhận nhân sự chính thức sau thời gian thử việc',
      type: 'RECRUITMENT' as const,
      employeeId: empTuan.id,
      newPositionId: feJuniorPos,
      newDepartmentId: devDeptId,
      oldSalary: 12750000, // 85% thử việc
      newSalary: 15000000, // Chính thức 100%
      reason: 'Căn cứ vào kết quả đánh giá hoàn thành xuất sắc thời gian thử việc của nhân sự tại Tổ Phát triển phần mềm.',
      effectiveDate: new Date('2026-11-01'),
      signBy: 'Tổng Giám Đốc',
      status: 'APPROVED' as const
    },
    {
      decisionNumber: 'QĐ-2026/002/LLA',
      title: 'Quyết định tiếp nhận nhân viên chính thức vào Tổ Kiểm thử chất lượng (QA/QC)',
      type: 'RECRUITMENT' as const,
      employeeId: empAnh.id,
      newPositionId: testJuniorPos,
      newDepartmentId: testDeptId,
      oldSalary: 11475000,
      newSalary: 13500000,
      reason: 'Căn cứ vào biên bản đánh giá thử việc đạt loại Giỏi và đề xuất tiếp nhận của Trưởng bộ phận QA/QC.',
      effectiveDate: new Date('2026-11-05'),
      signBy: 'Ban Giám Đốc',
      status: 'APPROVED' as const
    },
    {
      decisionNumber: 'QĐ-2026/003/LLA',
      title: 'Quyết định tiếp nhận nhân tài Mid-Level Backend Developer',
      type: 'RECRUITMENT' as const,
      employeeId: empBao.id,
      newPositionId: beMidPos,
      newDepartmentId: devDeptId,
      oldSalary: 18700000,
      newSalary: 22000000,
      reason: 'Căn cứ vào kết quả phỏng vấn tuyển dụng xuất sắc và thỏa thuận trong Thư mời nhận việc (Job Offer).',
      effectiveDate: new Date('2026-11-15'),
      signBy: 'Ban Giám Đốc',
      status: 'PENDING' as const
    }
  ];

  for (const dec of recruitmentDecisions) {
    const existing = await prisma.decision.findUnique({ where: { decisionNumber: dec.decisionNumber } });
    if (!existing) {
      await prisma.decision.create({ data: dec });
      console.log(`  + Đã tạo văn bản ${dec.decisionNumber}: ${dec.title}`);
    } else {
      await prisma.decision.update({
        where: { decisionNumber: dec.decisionNumber },
        data: dec
      });
      console.log(`  * Đã cập nhật văn bản ${dec.decisionNumber}`);
    }
  }

  console.log('✅ Hoàn tất khởi tạo toàn bộ dữ liệu mẫu cho Module Tuyển Dụng!');
}

seedRecruitmentData()
  .catch(err => {
    console.error('❌ Lỗi khi seed dữ liệu tuyển dụng:', err);
  })
  .finally(() => prisma.$disconnect());

import { prisma } from '../src/db';

async function main() {
  console.log('--- SEEDING KPI TEMPLATES ---');

  const templates = [
    {
      name: 'Bộ tiêu chí KPI Khối Phát triển Phần mềm (Dev)',
      department: 'Tổ Phát triển (Dev)',
      criteria: 4,
      weight: '100%',
      status: 'Active',
      items: JSON.stringify([
        {
          title: 'Tỷ lệ hoàn thành Sprint (Sprint Velocity)',
          category: 'OUTPUT',
          target: 90,
          unit: '%',
          weight: 30,
          description: 'Tỷ lệ Story Points hoàn thành đúng hạn so với cam kết đầu Sprint.'
        },
        {
          title: 'Tối ưu hóa hiệu năng & Latency API',
          category: 'QUALITY',
          target: 200,
          unit: 'ms',
          weight: 25,
          description: 'Thời gian phản hồi trung bình của API hệ thống dưới 200ms.'
        },
        {
          title: 'Độ bao phủ kiểm thử tự động (Unit Test Coverage)',
          category: 'QUALITY',
          target: 80,
          unit: '%',
          weight: 25,
          description: 'Độ bao phủ code coverage của các modules kiểm thử tự động.'
        },
        {
          title: 'Tuân thủ quy chế làm việc & Kỷ luật bảo mật',
          category: 'COMPLIANCE',
          target: 98,
          unit: '%',
          weight: 20,
          description: 'Chấm công đúng giờ >= 98%, tuân thủ an toàn thông tin theo Nghị định 13.'
        }
      ])
    },
    {
      name: 'Bộ tiêu chí KPI Khối Kiểm thử chất lượng (QA/QC)',
      department: 'Tổ Kiểm thử',
      criteria: 4,
      weight: '100%',
      status: 'Active',
      items: JSON.stringify([
        {
          title: 'Tỷ lệ thực thi kịch bản kiểm thử (Test Case Execution)',
          category: 'OUTPUT',
          target: 100,
          unit: '%',
          weight: 35,
          description: 'Hoàn thành 100% test cases được giao trước ngày bàn giao phiên bản.'
        },
        {
          title: 'Tỷ lệ lọt lỗi Defect Leakage sang UAT / Khách hàng',
          category: 'QUALITY',
          target: 2,
          unit: '%',
          weight: 35,
          description: 'Tỷ lệ lỗi do khách hàng hoặc UAT phát hiện không quá 2%.'
        },
        {
          title: 'Thời gian log và tái hiện lỗi (Time to Log Bug)',
          category: 'TIMELINE',
          target: 1,
          unit: 'giờ',
          weight: 15,
          description: 'Báo cáo và đính kèm đầy đủ log/reproduce steps trong vòng 1 giờ.'
        },
        {
          title: 'Đào tạo & Nâng cao kỹ năng tự động hóa',
          category: 'GROWTH',
          target: 1,
          unit: 'khóa',
          weight: 15,
          description: 'Hoàn thành tối thiểu 1 khóa đào tạo/chứng chỉ Automation testing.'
        }
      ])
    },
    {
      name: 'Bộ tiêu chí KPI Khối Tuyển dụng & Quản trị Nhân sự',
      department: 'Phòng Nhân sự',
      criteria: 4,
      weight: '100%',
      status: 'Active',
      items: JSON.stringify([
        {
          title: 'Tỷ lệ hoàn thành định biên tuyển dụng (Hiring Target)',
          category: 'OUTPUT',
          target: 90,
          unit: '%',
          weight: 35,
          description: 'Tuyển đủ nhân sự theo kế hoạch tuyển dụng được duyệt.'
        },
        {
          title: 'Thời gian tuyển dụng trung bình (Time-to-Hire)',
          category: 'TIMELINE',
          target: 25,
          unit: 'ngày',
          weight: 25,
          description: 'Đóng các vị trí tuyển dụng trong vòng 25 ngày kể từ khi mở.'
        },
        {
          title: 'Chất lượng nhân sự mới vượt qua thử việc',
          category: 'QUALITY',
          target: 85,
          unit: '%',
          weight: 25,
          description: 'Tỷ lệ nhân viên mới được ký Hợp đồng lao động chính thức sau thử việc.'
        },
        {
          title: 'Độ hài lòng trải nghiệm Onboarding & Ứng viên',
          category: 'GROWTH',
          target: 90,
          unit: '%',
          weight: 15,
          description: 'Khảo sát độ hài lòng của ứng viên và tân binh đạt trên 90%.'
        }
      ])
    },
    {
      name: 'Bộ tiêu chí KPI Khối Kinh doanh & Bán hàng (Sales B2B)',
      department: 'Phòng Kinh doanh',
      criteria: 4,
      weight: '100%',
      status: 'Active',
      items: JSON.stringify([
        {
          title: 'Doanh thu hợp đồng ký mới (Sales Quota)',
          category: 'OUTPUT',
          target: 300000000,
          unit: 'VNĐ',
          weight: 50,
          description: 'Doanh số thực tế ký hợp đồng thanh toán trong kỳ.'
        },
        {
          title: 'Số lượng khách hàng tiềm năng tiếp cận mới (New Leads)',
          category: 'OUTPUT',
          target: 40,
          unit: 'leads',
          weight: 20,
          description: 'Tiếp cận và xác nhận nhu cầu của doanh nghiệp mới.'
        },
        {
          title: 'Tỷ lệ chuyển đổi Demo sang ký Hợp đồng (Conversion Rate)',
          category: 'QUALITY',
          target: 25,
          unit: '%',
          weight: 15,
          description: 'Chốt hợp đồng thành công tối thiểu 25% số khách hàng demo.'
        },
        {
          title: 'Thu hồi công nợ đúng hạn',
          category: 'COMPLIANCE',
          target: 95,
          unit: '%',
          weight: 15,
          description: 'Thu hồi công nợ đúng hạn mức cam kết theo hợp đồng.'
        }
      ])
    }
  ];

  // Xóa cũ và tạo mới
  await prisma.kPITemplate.deleteMany({});
  for (const t of templates) {
    await prisma.kPITemplate.create({ data: t });
    console.log(`+ Created KPI Template: ${t.name}`);
  }

  // Khởi tạo ReviewCycle mẫu Quý 3 / 2026 nếu chưa có
  let cycle = await prisma.reviewCycle.findFirst({
    where: { name: 'Đánh giá Hiệu suất Quý 3 - 2026' }
  });
  if (!cycle) {
    cycle = await prisma.reviewCycle.create({
      data: {
        name: 'Đánh giá Hiệu suất Quý 3 - 2026',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-09-30'),
        status: 'ACTIVE'
      }
    });
    console.log('+ Created Review Cycle: Đánh giá Hiệu suất Quý 3 - 2026');
  }

  // Khởi tạo các bài đánh giá PerformanceReview cho nhân sự
  const employees = await prisma.employee.findMany();
  for (const emp of employees) {
    const existingReview = await prisma.performanceReview.findFirst({
      where: { employeeId: emp.id, reviewCycleId: cycle.id }
    });

    if (!existingReview) {
      let score = 85;
      let finalGrade = 'B';
      let comments = 'Hoàn thành tốt công việc được giao, tinh thần phối hợp đội ngũ tốt.';
      if (emp.code === 'NV-2026-001') {
        score = 94;
        finalGrade = 'A';
        comments = 'Top Performer: Tối ưu frontend mượt mà, lead dự án vượt tiến độ.';
      } else if (emp.code === 'NV-2026-003') {
        score = 78;
        finalGrade = 'B';
        comments = 'Đang trong giai đoạn thử việc, nắm bắt nhanh nghiệp vụ backend.';
      } else if (emp.code === 'NV-2026-002') {
        score = 91;
        finalGrade = 'A';
        comments = 'Kiểm thử cẩn thận, phát hiện nhiều bug khó trước khi bàn giao.';
      }

      await prisma.performanceReview.create({
        data: {
          employeeId: emp.id,
          reviewCycleId: cycle.id,
          score,
          selfScore: score,
          finalGrade,
          comments,
          status: 'COMPLETED'
        }
      });
      console.log(`+ Created Performance Review for ${emp.fullName} (${score} pts - Grade ${finalGrade})`);
    }
  }

  // Gán luôn bộ KPI cá nhân mẫu cho nhân viên NV-2026-001 (Hoàng Minh Tuấn) và NV-2026-002 (Nguyễn Thị Ngọc Ánh)
  const devEmp = employees.find(e => e.code === 'NV-2026-001');
  if (devEmp) {
    const existingKpis = await prisma.kPI.findMany({ where: { employeeId: devEmp.id } });
    if (existingKpis.length === 0) {
      await prisma.kPI.createMany({
        data: [
          {
            employeeId: devEmp.id,
            description: 'Tỷ lệ hoàn thành Sprint (Sprint Velocity)',
            target: 90,
            achieved: 95,
            unit: '%',
            weight: 30,
            category: 'OUTPUT',
            period: 'Q3-2026',
            status: 'COMPLETED'
          },
          {
            employeeId: devEmp.id,
            description: 'Tối ưu hóa hiệu năng & Latency API',
            target: 200,
            achieved: 185,
            unit: 'ms',
            weight: 25,
            category: 'QUALITY',
            period: 'Q3-2026',
            status: 'COMPLETED'
          },
          {
            employeeId: devEmp.id,
            description: 'Độ bao phủ kiểm thử tự động (Unit Test Coverage)',
            target: 80,
            achieved: 84,
            unit: '%',
            weight: 25,
            category: 'QUALITY',
            period: 'Q3-2026',
            status: 'COMPLETED'
          },
          {
            employeeId: devEmp.id,
            description: 'Tuân thủ quy chế làm việc & Kỷ luật bảo mật',
            target: 98,
            achieved: 100,
            unit: '%',
            weight: 20,
            category: 'COMPLIANCE',
            period: 'Q3-2026',
            status: 'COMPLETED'
          }
        ]
      });
      console.log(`+ Assigned initial KPIs for ${devEmp.fullName}`);
    }
  }

  const qaEmp = employees.find(e => e.code === 'NV-2026-002');
  if (qaEmp) {
    const existingKpis = await prisma.kPI.findMany({ where: { employeeId: qaEmp.id } });
    if (existingKpis.length === 0) {
      await prisma.kPI.createMany({
        data: [
          {
            employeeId: qaEmp.id,
            description: 'Tỷ lệ thực thi kịch bản kiểm thử (Test Case Execution)',
            target: 100,
            achieved: 100,
            unit: '%',
            weight: 35,
            category: 'OUTPUT',
            period: 'Q3-2026',
            status: 'COMPLETED'
          },
          {
            employeeId: qaEmp.id,
            description: 'Tỷ lệ lọt lỗi Defect Leakage sang UAT / Khách hàng',
            target: 2,
            achieved: 1,
            unit: '%',
            weight: 35,
            category: 'QUALITY',
            period: 'Q3-2026',
            status: 'COMPLETED'
          },
          {
            employeeId: qaEmp.id,
            description: 'Thời gian log và tái hiện lỗi (Time to Log Bug)',
            target: 1,
            achieved: 0.8,
            unit: 'giờ',
            weight: 15,
            category: 'TIMELINE',
            period: 'Q3-2026',
            status: 'COMPLETED'
          },
          {
            employeeId: qaEmp.id,
            description: 'Đào tạo & Nâng cao kỹ năng tự động hóa',
            target: 1,
            achieved: 1,
            unit: 'khóa',
            weight: 15,
            category: 'GROWTH',
            period: 'Q3-2026',
            status: 'COMPLETED'
          }
        ]
      });
      console.log(`+ Assigned initial KPIs for ${qaEmp.fullName}`);
    }
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { prisma } from '../src/db';

async function setupPositionsAndQuotas() {
  console.log('🔄 Đang cập nhật Định biên (Quota) và Danh mục Vị trí chức danh...');

  // 1. Cập nhật Quota các phòng ban
  const deptUpdates = [
    { code: 'BGD', quota: 2 },
    { code: 'KT', quota: 3 },
    { code: 'SALES', quota: 4 },
    { code: 'IT', quota: 26 },
    { code: 'TEST', quota: 4 },
    { code: 'BA', quota: 7 },
    { code: 'DEV', quota: 15 }
  ];

  for (const item of deptUpdates) {
    await prisma.department.updateMany({
      where: { code: item.code },
      data: { quota: item.quota }
    });
  }
  console.log('✅ Đã cập nhật xong Định biên (Quota) chuẩn cho tất cả các phòng ban!');

  // Lấy danh sách phòng ban để map ID
  const depts = await prisma.department.findMany();
  const deptMap: Record<string, string> = {};
  depts.forEach(d => {
    deptMap[d.code] = d.id;
  });

  // 2. Xóa các vị trí cũ nếu có
  await prisma.position.deleteMany();

  // 3. Danh sách các Vị trí chức danh chuẩn
  const positionsData = [
    // --- Ban Giám Đốc (BGD) ---
    {
      code: 'BGD-CEO',
      title: 'Giám đốc điều hành (CEO)',
      level: 'Director',
      minSalary: 50000000,
      maxSalary: 80000000,
      deptCode: 'BGD',
      description: 'Điều hành toàn bộ hoạt động kinh doanh và chiến lược phát triển của công ty'
    },
    {
      code: 'BGD-DIR',
      title: 'Phó Giám đốc điều hành',
      level: 'Director',
      minSalary: 40000000,
      maxSalary: 65000000,
      deptCode: 'BGD',
      description: 'Phụ trách công tác quản trị vận hành và hỗ trợ Giám đốc điều hành'
    },

    // --- Phòng Kế toán (KT) ---
    {
      code: 'KT-LEAD',
      title: 'Kế toán trưởng (Chief Accountant)',
      level: 'Manager',
      minSalary: 18000000,
      maxSalary: 30000000,
      deptCode: 'KT',
      description: 'Chỉ đạo và quản lý toàn bộ công tác tài chính kế toán, lập BCTC và quyết toán thuế'
    },
    {
      code: 'KT-KTTH',
      title: 'Chuyên viên Kế toán tổng hợp',
      level: 'Mid',
      minSalary: 12000000,
      maxSalary: 18000000,
      deptCode: 'KT',
      description: 'Thực hiện hạch toán nghiệp vụ kế toán phát sinh, kiểm tra đối chiếu số liệu sổ sách'
    },
    {
      code: 'KT-JR',
      title: 'Kế toán viên thanh toán / Thu ngân',
      level: 'Junior',
      minSalary: 8000000,
      maxSalary: 13000000,
      deptCode: 'KT',
      description: 'Quản lý thu chi tiền mặt, lập phiếu chi, theo dõi tạm ứng và thanh toán ngân hàng'
    },

    // --- Phòng Sales (SALES) ---
    {
      code: 'SALES-LEAD',
      title: 'Trưởng phòng Kinh doanh (Sales Lead)',
      level: 'Manager',
      minSalary: 20000000,
      maxSalary: 35000000,
      deptCode: 'SALES',
      description: 'Lập kế hoạch doanh số, phân bổ chỉ tiêu và quản lý điều phối đội ngũ kinh doanh'
    },
    {
      code: 'SALES-SR',
      title: 'Senior Sales Executive',
      level: 'Senior',
      minSalary: 14000000,
      maxSalary: 22000000,
      deptCode: 'SALES',
      description: 'Tìm kiếm, tiếp cận và đàm phán hợp đồng giải pháp công nghệ với khách hàng doanh nghiệp lớn'
    },
    {
      code: 'SALES-JR',
      title: 'Junior Sales Executive',
      level: 'Junior',
      minSalary: 8000000,
      maxSalary: 15000000,
      deptCode: 'SALES',
      description: 'Tìm kiếm khách hàng tiềm năng, giới thiệu sản phẩm và hỗ trợ chốt hợp đồng'
    },

    // --- Tổ Kiểm thử (TEST) ---
    {
      code: 'TEST-LEAD',
      title: 'QA/QC Lead (Trưởng nhóm Kiểm thử)',
      level: 'Lead',
      minSalary: 20000000,
      maxSalary: 30000000,
      deptCode: 'TEST',
      description: 'Xây dựng quy trình kiểm thử, lập Test Plan và quản lý chất lượng dự án phần mềm'
    },
    {
      code: 'TEST-MID',
      title: 'Middle QA/QC Engineer',
      level: 'Mid',
      minSalary: 12000000,
      maxSalary: 18000000,
      deptCode: 'TEST',
      description: 'Thiết kế Test Cases chuyên sâu, thực hiện Functional & Regression Testing, Auto Test cơ bản'
    },
    {
      code: 'TEST-JR',
      title: 'Junior QA/QC Tester',
      level: 'Junior',
      minSalary: 9000000,
      maxSalary: 14000000,
      deptCode: 'TEST',
      description: 'Kiểm thử phần mềm theo Test Cases, theo dõi và log bug trên Jira/hệ thống quản lý lỗi'
    },
    {
      code: 'TEST-INT',
      title: 'Fresher / Intern Tester',
      level: 'Intern',
      minSalary: 4000000,
      maxSalary: 8000000,
      deptCode: 'TEST',
      description: 'Thực tập sinh kiểm thử phần mềm, học việc và hỗ trợ kiểm thử giao diện tính năng'
    },

    // --- Tổ Phân tích nghiệp vụ (BA) ---
    {
      code: 'BA-LEAD',
      title: 'Lead Business Analyst (Trưởng nhóm BA)',
      level: 'Lead',
      minSalary: 22000000,
      maxSalary: 35000000,
      deptCode: 'BA',
      description: 'Chủ trì khảo sát yêu cầu khách hàng, thẩm định kiến trúc giải pháp và quản lý nhóm BA'
    },
    {
      code: 'BA-SR',
      title: 'Senior Business Analyst',
      level: 'Senior',
      minSalary: 18000000,
      maxSalary: 26000000,
      deptCode: 'BA',
      description: 'Phân tích quy trình kinh doanh, xây dựng tài liệu BRD, SRS, Software Functional Specs'
    },
    {
      code: 'BA-MID',
      title: 'Middle Business Analyst',
      level: 'Mid',
      minSalary: 14000000,
      maxSalary: 20000000,
      deptCode: 'BA',
      description: 'Làm việc trực tiếp với khách hàng, mô hình hóa luồng xử lý (BPMN), vẽ wireframe mockups'
    },
    {
      code: 'BA-JR',
      title: 'Junior Business Analyst',
      level: 'Junior',
      minSalary: 10000000,
      maxSalary: 15000000,
      deptCode: 'BA',
      description: 'Viết User Stories, chi tiết Acceptance Criteria và hỗ trợ giải đáp nghiệp vụ cho Dev/Test'
    },
    {
      code: 'BA-INT',
      title: 'Fresher / Intern BA',
      level: 'Intern',
      minSalary: 4000000,
      maxSalary: 8000000,
      deptCode: 'BA',
      description: 'Thực tập sinh BA, soạn thảo biên bản cuộc họp và viết tài liệu hướng dẫn sử dụng'
    },

    // --- Tổ Phát triển (DEV) ---
    {
      code: 'DEV-LEAD',
      title: 'Technical Lead (Trưởng nhóm kỹ thuật)',
      level: 'Lead',
      minSalary: 30000000,
      maxSalary: 50000000,
      deptCode: 'DEV',
      description: 'Thiết kế kiến trúc hệ thống, lựa chọn công nghệ, giải quyết tắc nghẽn kỹ thuật và Review Code'
    },

    // Nhánh Backend
    {
      code: 'DEV-BE-SR',
      title: 'Senior Backend Developer',
      level: 'Senior',
      minSalary: 22000000,
      maxSalary: 35000000,
      deptCode: 'DEV',
      description: 'Thiết kế cơ sở dữ liệu quan hệ, tối ưu truy vấn, xây dựng RESTful/GraphQL APIs hiệu năng cao'
    },
    {
      code: 'DEV-BE-MID',
      title: 'Middle Backend Developer',
      level: 'Mid',
      minSalary: 15000000,
      maxSalary: 24000000,
      deptCode: 'DEV',
      description: 'Phát triển các module nghiệp vụ Backend (NodeJS/Express/PostgreSQL), viết Unit Test'
    },
    {
      code: 'DEV-BE-JR',
      title: 'Junior Backend Developer',
      level: 'Junior',
      minSalary: 10000000,
      maxSalary: 16000000,
      deptCode: 'DEV',
      description: 'Phát triển API theo thiết kế kỹ thuật, sửa lỗi và tham gia tối ưu mã nguồn'
    },
    {
      code: 'DEV-BE-INT',
      title: 'Fresher / Intern Backend Dev',
      level: 'Intern',
      minSalary: 5000000,
      maxSalary: 9000000,
      deptCode: 'DEV',
      description: 'Thực tập sinh lập trình Backend NodeJS/PostgreSQL theo hướng dẫn của Lead'
    },

    // Nhánh Frontend
    {
      code: 'DEV-FE-SR',
      title: 'Senior Frontend Developer',
      level: 'Senior',
      minSalary: 20000000,
      maxSalary: 32000000,
      deptCode: 'DEV',
      description: 'Thiết kế kiến trúc giao diện SPA React, tối ưu Web Vitals, bảo mật và trải nghiệm người dùng'
    },
    {
      code: 'DEV-FE-MID',
      title: 'Middle Frontend Developer',
      level: 'Mid',
      minSalary: 14000000,
      maxSalary: 22000000,
      deptCode: 'DEV',
      description: 'Xây dựng giao diện tương tác React/TypeScript, quản lý state và tích hợp API mượt mà'
    },
    {
      code: 'DEV-FE-JR',
      title: 'Junior Frontend Developer',
      level: 'Junior',
      minSalary: 10000000,
      maxSalary: 15000000,
      deptCode: 'DEV',
      description: 'Cắt giao diện Responsive, hoàn thiện components theo thiết kế Figma và kết nối APIs'
    },
    {
      code: 'DEV-FE-INT',
      title: 'Fresher / Intern Frontend Dev',
      level: 'Intern',
      minSalary: 5000000,
      maxSalary: 9000000,
      deptCode: 'DEV',
      description: 'Thực tập sinh lập trình Frontend React/Tailwind/HTML/CSS'
    }
  ];

  for (const pos of positionsData) {
    const departmentId = deptMap[pos.deptCode];
    await prisma.position.create({
      data: {
        code: pos.code,
        title: pos.title,
        level: pos.level,
        minSalary: pos.minSalary,
        maxSalary: pos.maxSalary,
        description: pos.description,
        status: 'ACTIVE',
        departmentId: departmentId || null
      }
    });
  }

  const allPositions = await prisma.position.findMany({
    include: { department: true },
    orderBy: { code: 'asc' }
  });

  console.log(`✅ ĐÃ TẠO THÀNH CÔNG ${allPositions.length} VỊ TRÍ CHỨC DANH!`);
  console.table(allPositions.map(p => ({
    'Mã': p.code,
    'Chức danh': p.title,
    'Cấp bậc': p.level,
    'Lương Min (Tr)': (p.minSalary / 1000000).toFixed(0),
    'Lương Max (Tr)': (p.maxSalary / 1000000).toFixed(0),
    'Phòng ban': p.department?.name
  })));
}

setupPositionsAndQuotas()
  .catch((err) => {
    console.error('❌ Lỗi thiết lập vị trí:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


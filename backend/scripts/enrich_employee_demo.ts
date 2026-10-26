import { prisma } from '../src/db';

async function enrichDemo() {
  console.log('Enriching employee demo data with compliance and comprehensive fields...');
  
  const employees = await prisma.employee.findMany({
    take: 10,
    orderBy: { id: 'asc' },
    include: { position: true, department: true }
  });

  if (employees.length === 0) {
    console.log('No employees found.');
    return;
  }

  // 1. Set the first employee as Manager (Trưởng phòng)
  const managerEmp = employees[0];
  await prisma.employee.update({
    where: { id: managerEmp.id },
    data: {
      fullName: managerEmp.fullName || 'Nguyễn Văn Minh',
      cccd: '001090012345',
      cccdIssueDate: new Date('2021-05-15'),
      cccdIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
      cccdExpiryDate: new Date('2035-05-15'),
      birthPlace: 'Hà Nội',
      hometown: 'Ý Yên, Nam Định',
      ethnicity: 'Kinh',
      religion: 'Không',
      permanentAddress: 'Số 12A ngõ 45 phố Hoàng Cầu, P. Ô Chợ Dừa, Q. Đống Đa, Hà Nội',
      temporaryAddress: 'Căn hộ 1502 Chung cư Sunrise City, Q. 7, TP. Hồ Chí Minh',
      currentAddress: 'Căn hộ 1502 Chung cư Sunrise City, Q. 7, TP. Hồ Chí Minh',
      dataConsent: true,
      dataConsentDate: new Date('2024-01-15'),
      managementRole: 'MANAGER',
      workLocation: 'Trụ sở chính Công ty TNHH LLA (TP.HCM)',
      employmentType: 'FULL_TIME',
      probationStartDate: new Date('2022-01-15'),
      officialJoinDate: new Date('2022-03-15'),
      taxCode: '8012345678',
      socialInsurance: '7912345678',
      bankName: 'Ngân hàng TMCP Ngoại thương VN (Vietcombank)',
      bankBranch: 'Chi nhánh Nam Sài Gòn',
      bankAccount: '0071000888999',
      bankAccountHolder: 'NGUYEN VAN MINH',
      highestEducation: 'Thạc sĩ Quản trị Kinh doanh (MBA)'
    }
  });

  // Add Relative with Tax Deduction & CCCD
  await prisma.relative.deleteMany({ where: { employeeId: managerEmp.id } });
  await prisma.relative.create({
    data: {
      employeeId: managerEmp.id,
      fullName: 'Nguyễn Minh Khang',
      relation: 'Con ruột',
      isDependent: true,
      taxCode: '8910234567',
      cccd: '001215009876',
      taxDeductionStart: new Date('2022-01-01'),
      taxDeductionEnd: new Date('2038-09-01'),
      proofDocument: 'Giấy khai sinh số 142/2015/GKS - UBND Phường Ô Chợ Dừa'
    }
  });

  // Add Degree & Certificate
  await prisma.degree.deleteMany({ where: { employeeId: managerEmp.id } });
  await prisma.degree.create({
    data: {
      employeeId: managerEmp.id,
      degreeName: 'Cử nhân Khoa học Máy tính',
      institution: 'Đại học Bách Khoa TP.HCM',
      major: 'Công nghệ Thông tin',
      gradYear: 2018,
      classification: 'Giỏi',
      fileUrl: '/uploads/degrees/bang_dai_hoc_sample.pdf'
    }
  });

  await prisma.certificate.deleteMany({ where: { employeeId: managerEmp.id } });
  await prisma.certificate.create({
    data: {
      employeeId: managerEmp.id,
      name: 'AWS Certified Solutions Architect - Associate',
      issuedBy: 'Amazon Web Services',
      issueDate: new Date('2023-04-10'),
      expiryDate: new Date('2026-04-10'),
      fileUrl: '/uploads/certs/aws_saa_sample.pdf'
    }
  });

  // Add Contract with Salary Breakdown
  await prisma.contract.deleteMany({ where: { employeeId: managerEmp.id } });
  await prisma.contract.create({
    data: {
      employeeId: managerEmp.id,
      contractNumber: 'HĐLĐ-LLA/2023/001',
      contractType: 'INDEFINITE',
      baseSalary: 35000000,
      allowance: 5000000,
      insuranceSalary: 35000000,
      paymentMethod: 'Chuyển khoản (Ngân hàng)',
      signBy: 'Trần Đại Nghĩa - Tổng Giám Đốc',
      signDate: new Date('2023-03-15'),
      startDate: new Date('2023-03-15'),
      workLocation: 'Văn phòng Công ty TNHH LLA - TP.HCM',
      appendixNote: 'Phụ lục số 01/2024: Điều chỉnh phụ cấp chức vụ lãnh đạo +5,000,000 VNĐ/tháng',
      status: 'ACTIVE'
    }
  });

  // 2. Enrich other employees reporting to this Manager
  for (let i = 1; i < employees.length; i++) {
    const emp = employees[i];
    const roles = ['TEAM_LEAD', 'STAFF', 'STAFF', 'STAFF', 'STAFF'];
    const statuses = ['ACTIVE', 'ACTIVE', 'PROBATION', 'MATERNITY_LEAVE', 'UNPAID_LEAVE'];
    const assignedRole = roles[i % roles.length];
    const assignedStatus = statuses[i % statuses.length];

    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        cccd: `079201${String(100000 + i).padStart(6, '0')}`,
        cccdIssueDate: new Date('2022-08-20'),
        cccdIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
        cccdExpiryDate: new Date('2037-08-20'),
        birthPlace: i % 2 === 0 ? 'TP. Hồ Chí Minh' : 'Đà Nẵng',
        hometown: i % 2 === 0 ? 'Bến Tre' : 'Quảng Nam',
        ethnicity: 'Kinh',
        religion: 'Không',
        permanentAddress: `Số ${20 + i} đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh`,
        currentAddress: `Số ${45 + i} đường Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh`,
        dataConsent: true,
        dataConsentDate: new Date('2024-02-01'),
        managementRole: assignedRole,
        managerId: managerEmp.id,
        workLocation: 'Trụ sở chính Công ty TNHH LLA',
        employmentType: i === 3 ? 'PART_TIME' : 'FULL_TIME',
        status: assignedStatus,
        taxCode: `80${String(10000000 + i)}`,
        socialInsurance: `79${String(10000000 + i)}`,
        bankName: 'Vietcombank',
        bankBranch: 'Chi nhánh TP.HCM',
        bankAccount: `007100${String(1000000 + i)}`,
        bankAccountHolder: emp.fullName.toUpperCase()
      }
    });

    // Add sample contract
    await prisma.contract.deleteMany({ where: { employeeId: emp.id } });
    await prisma.contract.create({
      data: {
        employeeId: emp.id,
        contractNumber: `HĐLĐ-LLA/2024/00${i}`,
        contractType: assignedStatus === 'PROBATION' ? 'PROBATION' : 'OFFICIAL_1Y',
        baseSalary: 18000000 + i * 2000000,
        allowance: 2000000,
        insuranceSalary: 18000000 + i * 2000000,
        paymentMethod: 'Chuyển khoản (Ngân hàng)',
        signBy: 'Trần Đại Nghĩa - Tổng Giám Đốc',
        signDate: new Date('2024-01-10'),
        startDate: new Date('2024-01-10'),
        endDate: assignedStatus === 'PROBATION' ? new Date('2024-03-10') : new Date('2025-01-10'),
        workLocation: 'Trụ sở chính Công ty TNHH LLA',
        status: 'ACTIVE'
      }
    });
  }

  console.log('Successfully enriched employee demo data with full compliance and enterprise fields!');
}

enrichDemo()
  .catch(console.error)
  .finally(() => process.exit(0));

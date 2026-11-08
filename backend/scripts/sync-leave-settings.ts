import { prisma } from '../src/db';

async function main() {
  const newSettings = [
    {
      category: 'HR',
      key: 'LEAVE_CALC_BASE_DATE',
      name: 'Mốc ngày bắt đầu tính Quỹ phép năm (SOP LLA & BLLĐ)',
      value: 'JOIN_DATE',
      dataType: 'TEXT',
      unit: 'Loại mốc',
      description: 'JOIN_DATE: Tính từ ngày bắt đầu vào làm trên hồ sơ gốc (kể cả thời gian thử việc theo Khoản 2 Điều 65 NĐ 145/2020 & SOP LLA). OFFICIAL_DATE: Chỉ tính từ ngày ký HĐLĐ chính thức.'
    },
    {
      category: 'HR',
      key: 'LEAVE_MONTH_CUTOFF_DAY',
      name: 'Mốc ngày cắt tính trọn tháng phép khi vào làm (SOP LLA)',
      value: '15',
      dataType: 'NUMBER',
      unit: 'Ngày trong tháng',
      description: 'Theo quy chế LLA: Nhân sự vào làm từ ngày 01 đến ngày 15 của tháng thì tháng đó được tính trọn (+1 ngày phép); vào sau ngày 15 thì tháng đó chưa tính.'
    },
    {
      category: 'HR',
      key: 'MAX_CARRY_FORWARD_DAYS',
      name: 'Số ngày phép tồn tối đa được chuyển sang năm sau (SOP LLA)',
      value: '5',
      dataType: 'NUMBER',
      unit: 'Ngày',
      description: 'Quy chế LLA: Hết năm, tối đa 5 ngày phép năm cũ chưa nghỉ được bảo lưu chuyển sang năm sau. Phần vượt quá 5 ngày sẽ tự động hết hạn.'
    },
    {
      category: 'HR',
      key: 'CARRY_FORWARD_EXPIRY_DATE',
      name: 'Hạn chót sử dụng ngày phép năm cũ chuyển tiếp',
      value: '03-31',
      dataType: 'TEXT',
      unit: 'Tháng-Ngày (MM-DD)',
      description: 'Phép năm cũ chuyển sang chỉ có giá trị sử dụng đến hết ngày này (Mặc định 31/03 hàng năm theo SOP LLA). Sau ngày này số dư phép tồn cũ sẽ tự động về 0.'
    },
    {
      category: 'HR',
      key: 'MIN_OFFICIAL_MONTHS_FOR_LEAVE',
      name: 'Số tháng làm việc chính thức tối thiểu để kích hoạt Quỹ phép năm',
      value: '0',
      dataType: 'NUMBER',
      unit: 'Tháng',
      description: 'Mặc định 0 theo BLLĐ 2019 & SOP LLA (tính ngay từ ngày vào làm). Có thể cấu hình thành 1-3 tháng nếu công ty áp dụng quy chế riêng.'
    },
    {
      category: 'HR',
      key: 'LEAVE_ACCRUAL_MODE',
      name: 'Cách tính ngày phép khi hoàn thành đủ thời gian thử thách',
      value: 'FULL_ACCUMULATED',
      dataType: 'TEXT',
      unit: 'Quy tắc',
      description: 'FULL_ACCUMULATED: Tính trọn vẹn số tháng làm việc từ ngày bắt đầu vào làm theo BLLĐ 2019. PRORATED_REMAINING: Chỉ tính các tháng còn lại trong năm.'
    }
  ];

  for (const s of newSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: s,
      update: {
        name: s.name,
        value: s.value,
        description: s.description,
        unit: s.unit
      }
    });
    console.log(`✓ Đã cập nhật tham số: ${s.key} = ${s.value}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

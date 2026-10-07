import express, { Request, Response } from 'express';
import { prisma } from '../db';

const router = express.Router();

const DEFAULT_SETTINGS = [
  // Lương & Thuế
  {
    category: 'PAYROLL',
    key: 'INSURANCE_RATE',
    name: 'Tỷ lệ trích BHXH, BHYT, BHTN của người lao động',
    value: '10.5',
    dataType: 'PERCENT',
    unit: '%',
    description: 'Bao gồm BHXH 8%, BHYT 1.5%, BHTN 1% trừ trực tiếp vào lương tháng.'
  },
  {
    category: 'PAYROLL',
    key: 'PERSONAL_DEDUCTION',
    name: 'Mức giảm trừ gia cảnh bản thân (Thuế TNCN)',
    value: '11000000',
    dataType: 'NUMBER',
    unit: 'VNĐ / tháng',
    description: 'Mức miễn trừ tính thuế TNCN cho cá nhân người nộp thuế theo Luật Thuế TNCN hiện hành.'
  },
  {
    category: 'PAYROLL',
    key: 'DEPENDENT_DEDUCTION',
    name: 'Mức giảm trừ mỗi người phụ thuộc',
    value: '4400000',
    dataType: 'NUMBER',
    unit: 'VNĐ / người / tháng',
    description: 'Mức giảm trừ cho mỗi người phụ thuộc có đăng ký MST hợp lệ.'
  },
  {
    category: 'PAYROLL',
    key: 'MAX_INSURANCE_SALARY',
    name: 'Mức trần lương tính đóng BHXH bắt buộc',
    value: '46800000',
    dataType: 'NUMBER',
    unit: 'VNĐ',
    description: 'Tương đương 20 lần mức lương cơ sở (2.340.000 VNĐ x 20).'
  },
  {
    category: 'PAYROLL',
    key: 'STANDARD_WORKING_DAYS',
    name: 'Số ngày công chuẩn trung bình tháng',
    value: '22',
    dataType: 'NUMBER',
    unit: 'Ngày',
    description: 'Số ngày công định mức trong tháng làm căn cứ chia đơn giá ngày lương.'
  },
  {
    category: 'PAYROLL',
    key: 'PAYROLL_CUTOFF_DAY',
    name: 'Ngày chốt bảng chấm công hàng tháng',
    value: '25',
    dataType: 'NUMBER',
    unit: 'Hàng tháng',
    description: 'Chu kỳ tính lương chốt từ ngày 26 tháng trước đến ngày 25 tháng này.'
  },

  // Làm thêm giờ (OT)
  {
    category: 'ATTENDANCE',
    key: 'OT_RATE_NORMAL',
    name: 'Hệ số lương làm thêm giờ ngày làm việc thường',
    value: '150',
    dataType: 'PERCENT',
    unit: '%',
    description: 'Tối thiểu 150% theo Điều 98 Bộ luật Lao động.'
  },
  {
    category: 'ATTENDANCE',
    key: 'OT_RATE_WEEKEND',
    name: 'Hệ số lương làm thêm giờ ngày nghỉ hàng tuần',
    value: '200',
    dataType: 'PERCENT',
    unit: '%',
    description: 'Tối thiểu 200% áp dụng vào ngày Thứ 7, Chủ nhật.'
  },
  {
    category: 'ATTENDANCE',
    key: 'OT_RATE_HOLIDAY',
    name: 'Hệ số lương làm thêm giờ ngày Lễ, Tết có hưởng lương',
    value: '300',
    dataType: 'PERCENT',
    unit: '%',
    description: 'Tối thiểu 300% chưa kể tiền lương ngày lễ đối với người lao động hưởng lương ngày.'
  },

  // Quản trị Nhân sự & Quy trình
  {
    category: 'HR',
    key: 'LEAVE_APPROVAL_THRESHOLD',
    name: 'Ngưỡng ngày nghỉ phép phân cấp Tổng Giám Đốc phê duyệt',
    value: '2',
    dataType: 'NUMBER',
    unit: 'Ngày',
    description: 'Đơn xin nghỉ từ mức ngày này trở lên bắt buộc phải qua cấp TGĐ/CEO duyệt sau Trưởng phòng.'
  },
  {
    category: 'HR',
    key: 'CONTRACT_EXPIRY_WARN_DAYS',
    name: 'Thời gian cảnh báo trước hạn Hợp đồng lao động',
    value: '30',
    dataType: 'NUMBER',
    unit: 'Ngày',
    description: 'Hệ thống tự động hiển thị danh sách hợp đồng sắp hết hạn để chuẩn bị tái ký.'
  },
  {
    category: 'HR',
    key: 'PROBATION_PERIOD_DAYS',
    name: 'Thời gian thử việc tiêu chuẩn chức danh đại học/chuyên viên',
    value: '60',
    dataType: 'NUMBER',
    unit: 'Ngày',
    description: 'Thời gian thử việc tối đa theo quy định pháp luật lao động.'
  }
];

// Helper seed default settings
export const seedDefaultSettings = async () => {
  const count = await prisma.systemSetting.count();
  if (count === 0) {
    for (const s of DEFAULT_SETTINGS) {
      await prisma.systemSetting.create({ data: s });
    }
  }
};

// GET /api/settings - Lấy toàn bộ tham số nghiệp vụ
router.get('/', async (req: Request, res: Response) => {
  try {
    await seedDefaultSettings();
    const settings = await prisma.systemSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }]
    });

    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings/bulk - Cập nhật hàng loạt tham số nghiệp vụ
router.put('/bulk', async (req: Request, res: Response) => {
  try {
    const { updates } = req.body; // Array of { key: string, value: string }
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Dữ liệu cập nhật không hợp lệ' });
    }

    const updatedItems = [];
    for (const item of updates) {
      if (item.key && item.value !== undefined) {
        const updated = await prisma.systemSetting.upsert({
          where: { key: item.key },
          update: { value: String(item.value) },
          create: {
            category: item.category || 'GENERAL',
            key: item.key,
            name: item.name || item.key,
            value: String(item.value),
            dataType: item.dataType || 'STRING',
            unit: item.unit || '',
            description: item.description || ''
          }
        });
        updatedItems.push(updated);
      }
    }

    res.json({ message: 'Lưu cấu hình tham số nghiệp vụ thành công', settings: updatedItems });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper for other routes to get numerical or string parameter value
export const getSettingValue = async (key: string, defaultValue: number | string): Promise<any> => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) return defaultValue;
    if (setting.dataType === 'NUMBER' || setting.dataType === 'PERCENT') {
      const num = Number(setting.value);
      return isNaN(num) ? defaultValue : num;
    }
    return setting.value;
  } catch (e) {
    return defaultValue;
  }
};

export default router;

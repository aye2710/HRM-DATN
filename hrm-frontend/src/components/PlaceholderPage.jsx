import React from 'react';
import { Hammer } from 'lucide-react';

export const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>{title}</h1>
          <p className="text-muted text-sm">{description || 'Module đang được lên kế hoạch phát triển'}</p>
        </div>
      </div>
      <div className="card glass flex-1 flex flex-col items-center justify-center opacity-80">
        <div className="p-4 rounded-full mb-4" style={{ backgroundColor: 'var(--bg-hover)' }}>
          <Hammer size={40} color="var(--primary)" />
        </div>
        <h3 className="text-xl font-bold mb-2">Đang xây dựng: {title}</h3>
        <p className="text-muted text-center max-w-md">
          Khung định tuyến (Routing) đã được thiết lập độc lập. Giao diện và API chi tiết sẽ được "đắp thịt" theo chuẩn tài liệu PRD trong các giai đoạn sau.
        </p>
      </div>
    </div>
  );
};

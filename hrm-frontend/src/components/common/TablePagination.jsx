import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

/**
 * Hook quản lý phân trang chuẩn dùng chung toàn hệ thống (đồng bộ theo trang Nhân sự).
 */
export function usePagination(items = [], defaultPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  const paginatedItems = useMemo(
    () => safeItems.slice(startIndex, startIndex + pageSize),
    [safeItems, startIndex, pageSize]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageSizeChange = useCallback((nextSize) => {
    setPageSize(Number(nextSize) || 10);
    setCurrentPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage: safePage,
    setCurrentPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalItems,
    totalPages,
    startIndex,
    paginatedItems,
    resetPage,
  };
}

/**
 * Thanh phân trang thống nhất toàn bộ giao diện (theo mẫu /internal/employees):
 * - Bên trái: Dropdown chọn số dòng/trang (10, 20, 50) + thống kê (Hiển thị A - B / Tổng đơn vị).
 * - Bên phải: Nút Trang đầu (<<), Trang trước (<), "Trang X / Y", Trang sau (>), Trang cuối (>>).
 */
export function TablePagination({
  currentPage = 1,
  totalPages: propTotalPages,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'dòng',
  pageSizeOptions = [10, 20, 50],
  flush = true,
  style,
}) {
  if (!totalItems || totalItems <= 0) return null;

  const totalPages = Math.max(1, propTotalPages || Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const normalizedOptions = Array.from(new Set([...pageSizeOptions, pageSize])).sort((a, b) => a - b);

  const baseStyle = flush
    ? {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.85rem 1.25rem',
        borderTop: '1px solid #E2E8F0',
        backgroundColor: '#FFFFFF',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }
    : {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0.25rem 0',
        borderTop: 'none',
        backgroundColor: 'transparent',
        flexWrap: 'wrap',
        gap: '0.75rem',
      };

  return (
    <div style={{ ...baseStyle, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748B', flexWrap: 'wrap' }}>
        {onPageSizeChange && (
          <>
            <span>Hiển thị</span>
            <select
              className="form-input"
              style={{ width: 70, padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {normalizedOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>{itemLabel}/trang</span>
          </>
        )}
        <span>
          (Hiển thị {startIndex + 1} - {endIndex} / {totalItems} {itemLabel})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '0.35rem 0.55rem', opacity: safePage === 1 ? 0.4 : 1 }}
          disabled={safePage === 1}
          onClick={() => onPageChange?.(1)}
          title="Trang đầu"
        >
          <ChevronsLeft size={15} />
        </button>
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '0.35rem 0.55rem', opacity: safePage === 1 ? 0.4 : 1 }}
          disabled={safePage === 1}
          onClick={() => onPageChange?.(Math.max(1, safePage - 1))}
          title="Trang trước"
        >
          <ChevronLeft size={15} />
        </button>

        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', padding: '0 0.5rem', whiteSpace: 'nowrap' }}>
          Trang {safePage} / {totalPages}
        </span>

        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '0.35rem 0.55rem', opacity: safePage >= totalPages ? 0.4 : 1 }}
          disabled={safePage >= totalPages}
          onClick={() => onPageChange?.(Math.min(totalPages, safePage + 1))}
          title="Trang sau"
        >
          <ChevronRight size={15} />
        </button>
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '0.35rem 0.55rem', opacity: safePage >= totalPages ? 0.4 : 1 }}
          disabled={safePage >= totalPages}
          onClick={() => onPageChange?.(totalPages)}
          title="Trang cuối"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}


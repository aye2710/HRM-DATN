import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Download, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

/**
 * Checkbox đồng bộ chuẩn giao diện bảng (hỗ trợ indeterminate ở tiêu đề cột).
 */
export const TableCheckbox = ({ checked, indeterminate = false, onChange, title }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = Boolean(indeterminate && !checked);
    }
  }, [indeterminate, checked]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={Boolean(checked)}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      title={title}
      style={{
        width: '17px',
        height: '17px',
        accentColor: '#2563EB',
        cursor: 'pointer',
        borderRadius: '4px',
        verticalAlign: 'middle',
        margin: 0
      }}
    />
  );
};

/**
 * Hook quản lý chọn nhiều dòng trong bảng (hỗ trợ đa trang và tự đồng bộ khi dữ liệu thay đổi).
 */
export function useTableSelection(items, getId = (item) => item.id) {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const validIds = new Set((items || []).map(getId));
    setSelectedIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [items]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleOne = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleMany = useCallback((visibleItems) => {
    const visibleIds = (visibleItems || []).map(getId);
    if (visibleIds.length === 0) return;

    setSelectedIds((prev) => {
      const prevSet = new Set(prev);
      const allVisibleSelected = visibleIds.every((id) => prevSet.has(id));
      if (allVisibleSelected) {
        const visibleSet = new Set(visibleIds);
        return prev.filter((id) => !visibleSet.has(id));
      }
      const next = [...prev];
      visibleIds.forEach((id) => {
        if (!prevSet.has(id)) next.push(id);
      });
      return next;
    });
  }, []);

  const getHeaderCheckState = useCallback(
    (visibleItems) => {
      const visibleIds = (visibleItems || []).map(getId);
      if (visibleIds.length === 0) {
        return { checked: false, indeterminate: false };
      }
      const selectedOnPage = visibleIds.filter((id) => selectedSet.has(id)).length;
      return {
        checked: selectedOnPage === visibleIds.length,
        indeterminate: selectedOnPage > 0 && selectedOnPage < visibleIds.length
      };
    },
    [selectedSet]
  );

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const getSelectedItems = useCallback(
    () => (items || []).filter((item) => selectedSet.has(getId(item))),
    [items, selectedSet]
  );

  return {
    selectedIds,
    selectedSet,
    selectedCount: selectedIds.length,
    toggleOne,
    toggleMany,
    getHeaderCheckState,
    clearSelection,
    getSelectedItems
  };
}

/**
 * Thanh thao tác hàng loạt hiển thị khi người dùng đã tích chọn ít nhất 1 dòng.
 */
export const BulkSelectionBar = ({
  selectedCount,
  itemLabel = 'mục',
  onExportSelected,
  onDeleteSelected,
  onClear,
  isDeleting = false
}) => {
  if (!selectedCount) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.55rem 1rem',
        borderRadius: '10px',
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: '#1E40AF' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 22,
            height: 22,
            padding: '0 6px',
            borderRadius: '999px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.75rem'
          }}
        >
          {selectedCount}
        </span>
        <span>
          Đã chọn <strong>{selectedCount}</strong> {itemLabel}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {onExportSelected && (
          <button
            type="button"
            onClick={onExportSelected}
            className="btn btn-outline"
            style={{
              height: 32,
              padding: '0 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              borderColor: '#93C5FD',
              color: '#1D4ED8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Download size={14} /> Xuất đã chọn ({selectedCount})
          </button>
        )}

        {onDeleteSelected && (
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={isDeleting}
            className="btn btn-outline"
            style={{
              height: 32,
              padding: '0 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: '#FEF2F2',
              borderColor: '#FECACA',
              color: '#DC2626',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}
          >
            <Trash2 size={14} /> {isDeleting ? 'Đang xóa...' : `Xóa đã chọn (${selectedCount})`}
          </button>
        )}

        <button
          type="button"
          onClick={onClear}
          className="btn btn-outline"
          style={{
            height: 32,
            padding: '0 0.65rem',
            fontSize: '0.78rem',
            backgroundColor: '#FFFFFF',
            borderColor: '#CBD5E1',
            color: '#64748B',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Bỏ chọn tất cả"
        >
          <X size={13} /> Bỏ chọn
        </button>
      </div>
    </div>
  );
};

/**
 * Xóa hàng loạt kèm hộp thoại xác nhận và báo cáo chi tiết các mục thành công/ràng buộc.
 */
export async function runBatchDelete({
  count,
  itemLabel = 'mục',
  confirmText,
  executeDeletes,
  onDone,
  setIsDeleting
}) {
  const result = await Swal.fire({
    title: `Xác nhận xóa ${count} ${itemLabel}?`,
    text: confirmText || `Các ${itemLabel} đã chọn sẽ bị xóa khỏi hệ thống (những mục đang có ràng buộc dữ liệu sẽ được bảo vệ và giữ lại).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: `Xóa (${count})`,
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#DC2626'
  });

  if (!result.isConfirmed) return;

  setIsDeleting?.(true);
  try {
    const results = await Promise.allSettled(executeDeletes());
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected');

    if (succeeded > 0 && failed.length === 0) {
      toast.success(`Đã xóa thành công ${succeeded} ${itemLabel}!`);
    } else if (succeeded > 0 && failed.length > 0) {
      const reason = failed[0].reason?.response?.data?.error || failed[0].reason?.message || 'Đang có ràng buộc dữ liệu';
      toast.success(`Đã xóa ${succeeded} ${itemLabel} (${failed.length} mục giữ lại do: ${reason})`);
    } else if (failed.length > 0) {
      const reason = failed[0].reason?.response?.data?.error || failed[0].reason?.message || `Không thể xóa các ${itemLabel} đã chọn`;
      toast.error(reason);
    }

    onDone?.();
  } finally {
    setIsDeleting?.(false);
  }
}


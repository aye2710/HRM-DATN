import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, User } from 'lucide-react';

export const SearchableEmployeeSelect = ({
  employees = [],
  value = '',
  onChange,
  placeholder = '-- Tìm kiếm & chọn nhân sự áp dụng --',
  required = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // Tìm nhân viên đang được chọn
  const selectedEmployee = useMemo(() => {
    return employees.find(e => String(e.id) === String(value)) || null;
  }, [employees, value]);

  // Lọc danh sách nhân viên theo từ khóa tìm kiếm
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase().trim();
    return employees.filter(emp => {
      const name = (emp.fullName || '').toLowerCase();
      const code = (emp.code || '').toLowerCase();
      const dept = (emp.department?.name || '').toLowerCase();
      const pos = (emp.position?.title || '').toLowerCase();
      return name.includes(term) || code.includes(term) || dept.includes(term) || pos.includes(term);
    });
  }, [employees, searchTerm]);

  // Click ra ngoài thì đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Tự động focus vào ô tìm kiếm khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSelect = (emp) => {
    if (onChange) {
      onChange(emp.id, emp);
    }
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange('', null);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Nút bấm hiển thị chính */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          border: isOpen ? '1px solid #3B82F6' : '1px solid #CBD5E1',
          borderRadius: '8px',
          padding: '8px 12px',
          minHeight: '44px',
          backgroundColor: disabled ? '#F8FAFC' : '#FFFFFF',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          transition: 'all 0.15s ease'
        }}
      >
        {selectedEmployee ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              backgroundColor: '#EFF6FF', color: '#1D4ED8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, flexShrink: 0
            }}>
              {selectedEmployee.fullName ? selectedEmployee.fullName.charAt(0).toUpperCase() : 'E'}
            </div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
                {selectedEmployee.fullName}
              </span>
              <span style={{ marginLeft: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '1px 6px', borderRadius: '4px' }}>
                {selectedEmployee.code || 'NV'}
              </span>
              <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#64748B' }}>
                {selectedEmployee.department?.name || 'Chưa gán PB'} ({selectedEmployee.position?.title || 'Chưa có vị trí'})
              </span>
            </div>
          </div>
        ) : (
          <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
            {placeholder}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {selectedEmployee && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94A3B8', padding: '2px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Xóa lựa chọn"
            >
              <X size={15} />
            </button>
          )}
          <ChevronDown
            size={18}
            color="#64748B"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease'
            }}
          />
        </div>
      </div>

      {/* Menu thả xuống chứa ô tìm kiếm và danh sách */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '6px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 8px 12px -6px rgba(0, 0, 0, 0.08)',
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          {/* Ô tìm kiếm nhanh */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Gõ tên, mã NV, phòng ban hoặc chức vụ để tìm..."
                style={{
                  width: '100%',
                  height: '36px',
                  paddingLeft: '32px',
                  paddingRight: searchTerm ? '30px' : '10px',
                  fontSize: '0.82rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  outline: 'none',
                  backgroundColor: '#FFFFFF'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
              <span>Tìm thấy <strong>{filteredEmployees.length}</strong> nhân sự</span>
              {searchTerm && <span>Từ khóa: "{searchTerm}"</span>}
            </div>
          </div>

          {/* Danh sách nhân sự */}
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {filteredEmployees.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                Không tìm thấy nhân sự nào phù hợp với từ khóa "{searchTerm}"
              </div>
            ) : (
              filteredEmployees.map(emp => {
                const isSelected = String(emp.id) === String(value);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #F8FAFC',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                        color: isSelected ? '#1D4ED8' : '#475569',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 700, flexShrink: 0
                      }}>
                        {emp.fullName ? emp.fullName.charAt(0).toUpperCase() : 'E'}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isSelected ? '#1D4ED8' : '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {emp.fullName}
                          <span style={{ marginLeft: '6px', fontSize: '0.72rem', fontWeight: 600, color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '1px 5px', borderRadius: '4px' }}>
                            {emp.code || 'NV'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.department?.name || 'Chưa gán PB'} • {emp.position?.title || 'Chưa có chức vụ'}
                        </div>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, marginLeft: '10px' }}>
                      {isSelected ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '0.75rem', fontWeight: 600, color: '#16A34A',
                          backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px'
                        }}>
                          <Check size={13} /> Đã chọn
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          Chọn
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

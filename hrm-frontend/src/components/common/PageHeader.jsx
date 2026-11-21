import React from 'react';

/**
 * Header chuẩn đồng bộ cho toàn bộ các trang trong hệ thống:
 * Khung thẻ trắng bo góc, viền mảnh, icon nhận diện bên trái, tiêu đề + mô tả + badge và cụm nút thao tác bên phải.
 */
export const PageHeader = ({
  icon = null,
  iconBg = '#EFF6FF',
  iconColor = '#2563EB',
  title,
  titleColor = '#0F172A',
  badge = null,
  subtitle = null,
  breadcrumb = null,
  leftActions = null,
  actions = null,
  children = null,
  style = {},
}) => {
  const renderBadge = () => {
    if (!badge) return null;
    if (typeof badge === 'string') {
      return (
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '6px',
            backgroundColor: '#EFF6FF',
            color: '#1D4ED8',
            border: '1px solid #BFDBFE',
            whiteSpace: 'nowrap',
          }}
        >
          {badge}
        </span>
      );
    }
    return badge;
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '1rem 1.35rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: children ? '0.85rem' : 0,
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: '1 1 auto', minWidth: 0 }}>
          {leftActions && <div style={{ flexShrink: 0 }}>{leftActions}</div>}

          {icon && (
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: iconBg,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            {breadcrumb && <div style={{ marginBottom: '0.15rem' }}>{breadcrumb}</div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '1.22rem',
                  fontWeight: 800,
                  color: titleColor,
                  margin: 0,
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h1>
              {renderBadge()}
            </div>

            {subtitle && (
              <p
                style={{
                  margin: '0.2rem 0 0 0',
                  color: '#64748B',
                  fontSize: '0.82rem',
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
};

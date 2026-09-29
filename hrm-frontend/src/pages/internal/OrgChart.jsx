import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import axios from 'axios';

const OrgNode = ({ department }) => {
  const children = department.children || [];
  
  const calculateTotalEmployees = (node) => {
    let total = node._count?.employees || 0;
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        total += calculateTotalEmployees(child);
      });
    }
    return total;
  };

  const totalEmployees = calculateTotalEmployees(department);
  
  return (
    <div className="flex flex-col items-center">
      <div className="card glass card-hover p-4 text-center min-w-[220px]" style={{ zIndex: 1 }}>
        <div className="avatar mx-auto mb-3 flex items-center justify-center font-bold" style={{ width: 48, height: 48, fontSize: '1.2rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%' }}>
          {department.managerName ? department.managerName.charAt(0).toUpperCase() : department.name.charAt(0).toUpperCase()}
        </div>
        <h4 className="font-bold text-main m-0 mb-1" style={{ fontSize: '1.05rem' }}>{department.name}</h4>
        <p className="text-muted text-xs mb-3">{department.managerName || 'Chưa có đại diện'}</p>
        <span className="badge badge-primary inline-flex items-center" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: 'none', padding: '0.25rem 0.75rem' }}>
          <Users size={12} className="mr-2 text-muted" /> Tổng nhân sự: {totalEmployees}
        </span>
      </div>
      
      {children.length > 0 && (
        <>
          <div style={{ width: '2px', height: '24px', backgroundColor: 'var(--border)' }}></div>
          <div className="flex justify-center" style={{ position: 'relative' }}>
            <div className="flex">
              {children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === children.length - 1;
                const isOnly = children.length === 1;
                return (
                  <div key={child.id} className="flex flex-col items-center px-4" style={{ position: 'relative' }}>
                    {!isOnly && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: isFirst ? '50%' : 0,
                        right: isLast ? '50%' : 0,
                        height: '2px',
                        backgroundColor: 'var(--border)'
                      }}></div>
                    )}
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '2px', height: '24px', backgroundColor: 'var(--border)' }}></div>
                    <div style={{ marginTop: '24px' }}>
                      <OrgNode department={child} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const OrgChart = () => {
  const [departments, setDepartments] = useState([]);
  
  useEffect(() => {
    axios.get('http://localhost:5000/api/departments')
      .then(res => setDepartments(res.data))
      .catch(err => console.error(err));
  }, []);

  // Build tree
  const buildTree = (flatList) => {
    let map = {};
    let roots = [];
    flatList.forEach(node => {
      map[node.id] = { ...node, children: [] };
    });
    flatList.forEach(node => {
      if (node.parentId && map[node.parentId]) {
        map[node.parentId].children.push(map[node.id]);
      } else {
        roots.push(map[node.id]);
      }
    });
    return roots;
  };

  const tree = buildTree(departments);

  return (
    <div className="flex-col gap-6 animate-fade-in h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>Sơ đồ Tổ chức</h1>
          <p className="text-muted text-sm">Cấu trúc phân bổ phòng ban và số lượng nhân sự tự động từ Database</p>
        </div>
      </div>

      <div className="card glass flex-1 overflow-auto p-10" style={{ backgroundColor: 'var(--bg-hover)', minHeight: '600px' }}>
        {departments.length === 0 ? (
           <div className="text-muted text-center p-10">Đang tải dữ liệu sơ đồ...</div>
        ) : (
           <div className="flex gap-16 justify-center min-w-max">
             {tree.map(rootNode => (
               <OrgNode key={rootNode.id} department={rootNode} />
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

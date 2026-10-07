import React, { useState, useEffect } from 'react';
import { Users, Building, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const OrgNode = ({ department, isRoot = false }) => {
  const children = department.children || [];
  const [isExpanded, setIsExpanded] = useState(isRoot);
  
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
      <div 
        className={`card-hover text-left ${children.length > 0 ? 'cursor-pointer' : ''}`} 
        style={{ 
          zIndex: 1, 
          position: 'relative', 
          width: '240px', 
          background: 'var(--bg-card)',
          borderRadius: '0.75rem',
          boxShadow: isExpanded && children.length > 0 ? '0 0 0 2px var(--primary), 0 10px 25px -5px rgba(37,99,235,0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid var(--border)',
          transition: 'all 0.3s ease',
          padding: '1.25rem'
        }}
        onClick={() => { if (children.length > 0) setIsExpanded(!isExpanded); }}
      >
        <div className="flex items-start justify-between mb-3">
          <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(37,99,235,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Building size={18} />
          </div>
          <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
            <Users size={12} className="mr-1" style={{ display: 'inline-block' }} /> {totalEmployees}
          </span>
        </div>
        
        <h4 className="font-bold m-0 mb-1 leading-tight" style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{department.name}</h4>
        
        <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px dashed var(--border)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
             {department.managerName ? department.managerName.charAt(0).toUpperCase() : '?'}
          </div>
          <p className="text-muted text-xs truncate m-0">
            {department.managerName || 'Chưa có đại diện'}
          </p>
        </div>
        
        {children.length > 0 && (
          <div style={{ 
            position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)', 
            background: isExpanded ? 'var(--primary)' : '#fff', 
            color: isExpanded ? 'white' : 'var(--text-muted)', 
            border: `1px solid ${isExpanded ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 10, transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </div>
      
      {isExpanded && children.length > 0 && (
        <>
          <div style={{ width: '2px', height: '24px', backgroundColor: '#CBD5E1' }}></div>
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
                        backgroundColor: '#CBD5E1'
                      }}></div>
                    )}
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '2px', height: '24px', backgroundColor: '#CBD5E1' }}></div>
                    <div style={{ marginTop: '24px' }}>
                      <OrgNode department={child} isRoot={false} />
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
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Sơ đồ Tổ chức</h1>
          <p className="text-muted text-sm">Cấu trúc phân bổ phòng ban và số lượng nhân sự tự động từ Database</p>
        </div>
      </div>

      <div 
        className="card flex-1 overflow-auto p-10" 
        style={{ 
          backgroundColor: '#F8FAFC', 
          backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 0)',
          backgroundSize: '24px 24px',
          minHeight: '600px',
          border: '1px solid var(--border)' 
        }}
      >
        {departments.length === 0 ? (
           <div className="text-muted text-center p-10 font-medium">Đang tải dữ liệu sơ đồ...</div>
        ) : (
           <div className="flex gap-16 justify-center min-w-max pt-4 pb-8 px-8">
             {tree.map(rootNode => (
               <OrgNode key={rootNode.id} department={rootNode} isRoot={true} />
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

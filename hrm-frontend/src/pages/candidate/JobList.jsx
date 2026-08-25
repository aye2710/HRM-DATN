import React from 'react';
import { MapPin, Briefcase, Clock, ChevronRight } from 'lucide-react';
import { jobPostings } from '../../mockData';

export const JobList = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="text-center mb-10">
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>Khám Phá Cơ Hội Nghề Nghiệp</h1>
        <p style={{ fontSize: '1.125rem' }}>Gia nhập cùng chúng tôi để xây dựng tương lai</p>
      </div>

      <div className="flex-col gap-4">
        {jobPostings.map(job => (
          <div key={job.id} className="card flex items-center justify-between" style={{ transition: 'var(--transition)', cursor: 'pointer' }}>
            <div>
              <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{job.title}</h3>
              <div className="flex items-center gap-4 text-muted" style={{ fontSize: '0.875rem' }}>
                <span className="flex items-center gap-1"><MapPin size={16} /> {job.location}</span>
                <span className="flex items-center gap-1"><Briefcase size={16} /> {job.department}</span>
                <span className="flex items-center gap-1"><Clock size={16} /> {job.type}</span>
              </div>
            </div>
            <button className="btn btn-primary" style={{ borderRadius: '9999px', padding: '0.5rem' }}>
              <ChevronRight size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

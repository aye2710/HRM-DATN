const { prisma } = require('../src/db');

async function seedATS() {
    console.log('Seeding ATS...');
    
    // Create Jobs
    const job1 = await prisma.jobPosting.create({
        data: {
            title: 'Lập trình viên ReactJS (Mid-level)',
            description: 'Yêu cầu 2 năm kinh nghiệm ReactJS, am hiểu hook, context API.',
            status: 'OPEN'
        }
    });

    const job2 = await prisma.jobPosting.create({
        data: {
            title: 'Chuyên viên Nhân sự (Tuyển dụng)',
            description: 'Tìm kiếm nhân tài, phỏng vấn và đánh giá ứng viên.',
            status: 'OPEN'
        }
    });

    // Create Candidates
    await prisma.candidate.createMany({
        data: [
            {
                name: 'Nguyễn Văn A',
                email: 'nva@gmail.com',
                phone: '0987654321',
                jobPostingId: job1.id,
                status: 'APPLIED'
            },
            {
                name: 'Trần Thị B',
                email: 'ttb@gmail.com',
                phone: '0123456789',
                jobPostingId: job1.id,
                status: 'INTERVIEWING'
            },
            {
                name: 'Lê Văn C',
                email: 'lvc@gmail.com',
                phone: '0933111222',
                jobPostingId: job2.id,
                status: 'OFFERED'
            }
        ]
    });

    console.log('Done seeding ATS!');
}

seedATS().finally(() => prisma.$disconnect());

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
async function main() {
    // 1. Check if employee already exists with test email or cccd
    const testEmail = "test.tiepnhan@lla.vn";
    const testCccd = "079203009988";

    // Clean up old test employee if exists from previous runs
    const existingEmp = await db_1.prisma.employee.findFirst({
        where: { OR: [{ email: testEmail }, { cccd: testCccd }] }
    });
    if (existingEmp) {
        await db_1.prisma.contract.deleteMany({ where: { employeeId: existingEmp.id } });
        await db_1.prisma.employmentHistory.deleteMany({ where: { employeeId: existingEmp.id } });
        await db_1.prisma.employee.delete({ where: { id: existingEmp.id } });
        console.log("Deleted existing test employee");
    }

    // Clean up old test candidate if exists
    const existingCand = await db_1.prisma.candidate.findFirst({
        where: { email: testEmail }
    });
    if (existingCand) {
        await db_1.prisma.jobOffer.deleteMany({ where: { candidateId: existingCand.id } });
        await db_1.prisma.preOnboardingProfile.deleteMany({ where: { candidateId: existingCand.id } });
        await db_1.prisma.candidate.delete({ where: { id: existingCand.id } });
        console.log("Deleted existing test candidate");
    }

    // Find any active job posting
    const jobPosting = await db_1.prisma.jobPosting.findFirst({
        include: { department: true, position: true }
    });

    if (!jobPosting) {
        console.log("No job posting found");
        return;
    }

    // Create Candidate
    const newCand = await db_1.prisma.candidate.create({
        data: {
            name: "Trần Văn Tiếp Nhận (Test)",
            email: testEmail,
            phone: "0988776655",
            status: "OFFERING",
            jobPostingId: jobPosting.id
        }
    });

    // Create Offer with status ACCEPTED
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 3);

    await db_1.prisma.jobOffer.create({
        data: {
            candidateId: newCand.id,
            baseSalary: 18000000,
            probationRate: 85,
            startDate: startDate,
            contractType: "PROBATION",
            status: "ACCEPTED",
            notes: "Offer sẵn sàng để HR kiểm thử Tiếp nhận nhân sự"
        }
    });

    // Create PreOnboarding with full details
    await db_1.prisma.preOnboardingProfile.create({
        data: {
            candidateId: newCand.id,
            cccd: testCccd,
            gender: "MALE",
            dateOfBirth: new Date("1998-05-15"),
            address: "123 Cách Mạng Tháng 8, Quận 3, TP.HCM",
            nationality: "Việt Nam",
            maritalStatus: "SINGLE",
            bankName: "Vietcombank",
            bankAccount: "998877665544",
            taxCode: "8412398765"
        }
    });

    console.log("SUCCESS: Created candidate ready for test:", newCand.name, newCand.email);
}
main().catch(console.error).finally(() => db_1.prisma.$disconnect());

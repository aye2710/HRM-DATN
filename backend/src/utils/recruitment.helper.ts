import { Prisma } from '@prisma/client';
import { prisma } from '../db';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

export class RecruitmentLimitError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'RecruitmentLimitError';
  }
}

/**
 * Kiểm tra chiến dịch tuyển dụng còn chỉ tiêu hay đã tuyển đủ số lượng yêu cầu.
 * Ném lỗi 400 nếu số nhân sự đã tuyển (HIRED) >= chỉ tiêu (amount).
 */
export async function assertJobHasOpenSlots(tx: PrismaLike, jobPostingId: string): Promise<{
  jobTitle: string;
  amount: number;
  hiredCount: number;
}> {
  const job = await tx.jobPosting.findUnique({
    where: { id: jobPostingId },
    select: { id: true, title: true, amount: true, status: true }
  });

  if (!job) {
    throw new RecruitmentLimitError('Không tìm thấy chiến dịch tuyển dụng liên kết.');
  }

  const hiredCount = await tx.candidate.count({
    where: { jobPostingId: job.id, status: 'HIRED' }
  });

  if (hiredCount >= job.amount) {
    throw new RecruitmentLimitError(
      `Chiến dịch "${job.title}" đã tuyển đủ chỉ tiêu (${hiredCount}/${job.amount}), không thể tuyển vượt quá số lượng yêu cầu.`
    );
  }

  return { jobTitle: job.title, amount: job.amount, hiredCount };
}

/**
 * Tự động đóng tin tuyển dụng khi số lượng ứng viên HIRED đạt đủ chỉ tiêu.
 */
export async function autoCloseJobIfFilled(tx: PrismaLike, jobPostingId: string): Promise<void> {
  const job = await tx.jobPosting.findUnique({
    where: { id: jobPostingId },
    select: { id: true, amount: true, status: true }
  });

  if (!job || job.status === 'CLOSED') return;

  const hiredCount = await tx.candidate.count({
    where: { jobPostingId: job.id, status: 'HIRED' }
  });

  if (hiredCount >= job.amount) {
    await tx.jobPosting.update({
      where: { id: job.id },
      data: { status: 'CLOSED' }
    });
  }
}


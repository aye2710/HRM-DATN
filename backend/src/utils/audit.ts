import { prisma } from '../db';

export interface AuditLogParams {
  action: string;
  tableName: string;
  recordId: string;
  accountId?: string;
  details?: string;
}

/**
 * Creates an immutable audit trail entry in the database.
 */
export async function createAuditLog(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: params.action,
        tableName: params.tableName,
        recordId: params.recordId,
        accountId: params.accountId || 'SYSTEM',
        details: params.details || null
      }
    });
  } catch (error) {
    console.error('[AuditLog] Error recording audit trail:', error);
    return null;
  }
}

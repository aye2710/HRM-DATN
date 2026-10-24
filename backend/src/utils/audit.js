"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
const db_1 = require("../db");
/**
 * Creates an immutable audit trail entry in the database.
 */
async function createAuditLog(params) {
    try {
        return await db_1.prisma.auditLog.create({
            data: {
                action: params.action,
                tableName: params.tableName,
                recordId: params.recordId,
                accountId: params.accountId || 'SYSTEM',
                details: params.details || null
            }
        });
    }
    catch (error) {
        console.error('[AuditLog] Error recording audit trail:', error);
        return null;
    }
}

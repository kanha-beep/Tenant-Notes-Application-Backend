import AuditLog from "../Models/AuditLogSchema.js";

export async function recordAuditLog({
  tenantId,
  actorId = null,
  action,
  entityType,
  entityId,
  metadata = {},
}) {
  if (!tenantId || !action || !entityType || !entityId) {
    return null;
  }

  return AuditLog.create({
    tenant: tenantId,
    actor: actorId,
    action,
    entityType,
    entityId: String(entityId),
    metadata,
  });
}

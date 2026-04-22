const activityLogService = require('../../services/activityLogService');
const ActivityLog = require('../../models/sql/ActivityLog');
const AppError = require('../../utils/AppError');
const { createActivityLog } = require('../factories/activityLogFactory');
const { clearSQLTable } = require('../helpers/db');


describe('activityLogService', () => {
  beforeEach(async () => {
    await clearSQLTable(ActivityLog);
  });

  it('should create a log', async () => {
    const log = await createActivityLog({ userId: 'u1', action: 'CREATE_PROJECT', entity: 'User', entityId: 'e1', metadata: { foo: 'bar' } });
    expect(log).toBeDefined();
    expect(log.userId).toBe('u1');
  });

  it('should create a log using activityLogService.createLog', async () => {
    const log = await activityLogService.createLog({ userId: 'uService', action: 'CREATE_PROJECT', entity: 'User', entityId: 'eService', metadata: { bar: 'baz' } });
    expect(log).toBeDefined();
    expect(log.userId).toBe('uService');
    expect(log.entityId).toBe('eService');
    expect(log.metadata).toEqual({ bar: 'baz' });
  });

  it('should filter logs by userId, action, entity, entityId', async () => {
    await createActivityLog({ userId: 'u2', action: 'UPDATE_PROJECT', entity: 'User', entityId: 'e2', metadata: {} });
    const logs = await activityLogService.getAllLogs({ userId: 'u2', action: 'UPDATE_PROJECT', entity: 'User', entityId: 'e2' });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should filter logs by date range', async () => {
    await createActivityLog({ userId: 'u3', action: 'CREATE_PROJECT', entity: 'Project', entityId: 'e3', metadata: {} });
    const start = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const end = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const logs = await activityLogService.getAllLogs({ startDate: start, endDate: end });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should get logs by user', async () => {
    await createActivityLog({ userId: 'u4', action: 'CREATE_PROJECT', entity: 'Project', entityId: 'e4', metadata: {} });
    const logs = await activityLogService.getLogsByUser('u4');
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should get logs by entity', async () => {
    await createActivityLog({ userId: 'u5', action: 'CREATE_PROJECT', entity: 'Project', entityId: 'e5', metadata: {} });
    const logs = await activityLogService.getLogsByEntity('Project', 'e5');
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should delete all logs', async () => {
    await createActivityLog({ userId: 'u6', action: 'CREATE_PROJECT', entity: 'Project', entityId: 'e6', metadata: {} });
    const result = await activityLogService.deleteLogs();
    expect(result.message).toMatch(/deleted successfully/);
    const logs = await ActivityLog.findAll();
    expect(logs.length).toBe(0);
  });

  it('should delete old logs before a date', async () => {
    await createActivityLog({ userId: 'u7', action: 'CREATE_PROJECT', entity: 'Project', entityId: 'e7', metadata: {} });
    const beforeDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const result = await activityLogService.deleteOldLogs(beforeDate);
    expect(result.deletedCount).toBeGreaterThan(0);
  });

  it('should throw error if beforeDate is missing in deleteOldLogs', async () => {
    await expect(activityLogService.deleteOldLogs()).rejects.toThrow(AppError);
  });
});

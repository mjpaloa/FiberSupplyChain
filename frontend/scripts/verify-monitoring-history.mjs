import assert from 'node:assert/strict';
import {
  getFarmerMonitoringHistory,
  getHistoryRecordCategory,
  getOverdueMonitoring,
  getUpcomingMonitoring,
  partitionMonitoringRecords,
} from '../src/utils/monitoringHelpers.ts';

function makeRecord(overrides = {}) {
  return {
    monitoringId: 'MON-1',
    dateOfVisit: '2026-10-01',
    monitoredBy: 'MAO Officer',
    farmerId: 'farmer-1',
    farmerName: 'Sample Farmer',
    associationName: 'CUSAFA',
    farmCondition: 'Healthy',
    growthStage: 'Vegetative',
    issuesObserved: [],
    actionsTaken: 'Checked crop health',
    recommendations: 'Continue maintenance',
    nextMonitoringDate: '2026-12-15',
    status: 'Ongoing',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
    ...overrides,
  };
}

// 1. Existing finished visits ('Done Monitor' / 'Completed') stay out of Active start view and go to History
{
  const records = [
    makeRecord({ monitoringId: 'MON-DONE-1', status: 'Done Monitor', nextMonitoringDate: '' }),
    makeRecord({ monitoringId: 'MON-COMP-1', farmerId: 'farmer-2', farmerName: 'Farmer Two', status: 'Completed', nextMonitoringDate: '' }),
  ];

  const partitioned = partitionMonitoringRecords(records);
  assert.equal(partitioned.active.length, 0, 'Done/Completed records should not appear in Active');
  assert.equal(partitioned.history.length, 2, 'Done/Completed records belong in History');
  assert.equal(getHistoryRecordCategory(records[0]), 'done');
  assert.equal(getHistoryRecordCategory(records[1]), 'completed');
}

// 2. Starting a new Ongoing visit places only the new visit in Active while older Done Monitor visits remain in History
{
  const oldDone = makeRecord({
    monitoringId: 'MON-OLD-DONE',
    dateOfVisit: '2025-12-28',
    status: 'Done Monitor',
    nextMonitoringDate: '',
  });
  const newOngoing = makeRecord({
    monitoringId: 'MON-NEW-ONGOING',
    dateOfVisit: '2026-11-24',
    status: 'Ongoing',
    nextMonitoringDate: '2026-12-30',
  });

  const partitioned = partitionMonitoringRecords([oldDone, newOngoing]);
  assert.deepEqual(partitioned.active.map((r) => r.monitoringId), ['MON-NEW-ONGOING']);
  assert.deepEqual(partitioned.history.map((r) => r.monitoringId), ['MON-OLD-DONE']);

  const timeline = getFarmerMonitoringHistory([oldDone, newOngoing], oldDone);
  assert.deepEqual(timeline.map((r) => r.monitoringId), ['MON-NEW-ONGOING', 'MON-OLD-DONE']);
}

// 3. A newer Ongoing follow-up visit automatically archives the previous Ongoing visit to History
{
  const firstVisit = makeRecord({
    monitoringId: 'MON-V1',
    dateOfVisit: '2026-11-01',
    status: 'Ongoing',
    nextMonitoringDate: '2026-11-20',
  });
  const secondVisit = makeRecord({
    monitoringId: 'MON-V2',
    dateOfVisit: '2026-11-24',
    status: 'Ongoing',
    nextMonitoringDate: '2026-12-24',
  });

  const partitioned = partitionMonitoringRecords([firstVisit, secondVisit]);
  assert.deepEqual(partitioned.active.map((r) => r.monitoringId), ['MON-V2']);
  assert.deepEqual(partitioned.history.map((r) => r.monitoringId), ['MON-V1']);
  assert.equal(getHistoryRecordCategory(partitioned.history[0]), 'previous');
}

// 4. Final Completed visit closes the farmer's cycle: moves both latest & earlier Ongoing out of Active / Upcoming / Overdue
{
  const ongoingVisit = makeRecord({
    monitoringId: 'MON-PREV-ONG',
    dateOfVisit: '2026-10-01',
    status: 'Ongoing',
    nextMonitoringDate: '2026-10-15',
  });
  const finalVisit = makeRecord({
    monitoringId: 'MON-FINAL-COMP',
    dateOfVisit: '2026-11-24',
    status: 'Completed',
    nextMonitoringDate: '',
  });

  const all = [ongoingVisit, finalVisit];
  const partitioned = partitionMonitoringRecords(all);
  assert.equal(partitioned.active.length, 0);
  assert.deepEqual(partitioned.history.map((r) => r.monitoringId), ['MON-FINAL-COMP', 'MON-PREV-ONG']);
  assert.equal(getUpcomingMonitoring(all).length, 0);
  assert.equal(getOverdueMonitoring(all).length, 0);
}

// 5. Same-date tie-break uses createdAt descending
{
  const earlierCreated = makeRecord({
    monitoringId: 'MON-T1',
    dateOfVisit: '2026-11-24',
    createdAt: '2026-11-24T08:00:00Z',
    status: 'Ongoing',
  });
  const laterCreated = makeRecord({
    monitoringId: 'MON-T2',
    dateOfVisit: '2026-11-24',
    createdAt: '2026-11-24T10:30:00Z',
    status: 'Ongoing',
  });

  const partitioned = partitionMonitoringRecords([earlierCreated, laterCreated]);
  assert.deepEqual(partitioned.active.map((r) => r.monitoringId), ['MON-T2']);
  assert.deepEqual(partitioned.history.map((r) => r.monitoringId), ['MON-T1']);
}

// 6. Null/empty farmerId falls back to normalized farmerName without merging distinct farmers
{
  const sampleFarmerA = makeRecord({
    monitoringId: 'MON-NAME-1',
    farmerId: '',
    farmerName: 'Maria Clara',
    dateOfVisit: '2026-11-24',
    status: 'Ongoing',
  });
  const sampleFarmerB = makeRecord({
    monitoringId: 'MON-NAME-2',
    farmerId: '',
    farmerName: 'Juan Dela Cruz',
    dateOfVisit: '2026-11-23',
    status: 'Ongoing',
  });

  const partitioned = partitionMonitoringRecords([sampleFarmerA, sampleFarmerB]);
  assert.equal(partitioned.active.length, 2, 'Farmers with empty farmerId should group by farmerName independently');
}

console.log('PASS: All 6 monitoring history tests succeeded.');

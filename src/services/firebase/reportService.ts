import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Report } from '../../types/schemas';
import { activityService } from './activityService';

const REPORTS_COLLECTION = 'reports';

export const reportService = {
  async createReport(report: Report): Promise<void> {
    const reportRef = doc(db, REPORTS_COLLECTION, report.id);
    await setDoc(reportRef, {
      ...report,
      createdAt: Timestamp.fromDate(report.createdAt),
      updatedAt: Timestamp.fromDate(report.updatedAt),
      schedule: report.schedule ? {
        ...report.schedule,
        nextRun: Timestamp.fromDate(report.schedule.nextRun),
        lastRun: report.schedule.lastRun ? Timestamp.fromDate(report.schedule.lastRun) : null,
      } : null,
    });

    await activityService.logActivity({
      type: 'create',
      entityType: 'report',
      entityId: report.id,
      description: 'יצירת דוח חדש',
      createdBy: report.createdBy,
      metadata: {
        reportName: report.name,
        category: report.category,
        type: report.type,
      },
    });
  },

  async updateReport(id: string, updates: Partial<Report>): Promise<void> {
    const reportRef = doc(db, REPORTS_COLLECTION, id);
    const updateData = { 
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
      schedule: updates.schedule ? {
        ...updates.schedule,
        nextRun: updates.schedule.nextRun ? Timestamp.fromDate(updates.schedule.nextRun) : undefined,
        lastRun: updates.schedule.lastRun ? Timestamp.fromDate(updates.schedule.lastRun) : undefined,
      } : undefined,
    };
    await updateDoc(reportRef, updateData);

    await activityService.logActivity({
      type: 'update',
      entityType: 'report',
      entityId: id,
      description: 'עדכון דוח',
      createdBy: updates.updatedBy!,
      metadata: {
        updatedFields: Object.keys(updates),
      },
    });
  },

  async getReport(id: string): Promise<Report | null> {
    const reportRef = doc(db, REPORTS_COLLECTION, id);
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) return null;
    return reportSnap.data() as Report;
  },

  async getAllReports(): Promise<Report[]> {
    const reportsSnap = await getDocs(collection(db, REPORTS_COLLECTION));
    return reportsSnap.docs.map(doc => doc.data() as Report);
  },

  async getReportsByCategory(category: string): Promise<Report[]> {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('category', '==', category),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    const reportsSnap = await getDocs(q);
    return reportsSnap.docs.map(doc => doc.data() as Report);
  },

  async getScheduledReports(): Promise<Report[]> {
    const now = new Date();
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('schedule.nextRun', '<=', Timestamp.fromDate(now)),
      where('isDeleted', '==', false)
    );
    const reportsSnap = await getDocs(q);
    return reportsSnap.docs.map(doc => doc.data() as Report);
  },

  async deleteReport(id: string, deletedBy: string): Promise<void> {
    const reportRef = doc(db, REPORTS_COLLECTION, id);
    await updateDoc(reportRef, {
      isDeleted: true,
      deletedAt: Timestamp.fromDate(new Date()),
      deletedBy,
    });

    await activityService.logActivity({
      type: 'delete',
      entityType: 'report',
      entityId: id,
      description: 'מחיקת דוח',
      createdBy: deletedBy,
    });
  },

  async updateReportSchedule(
    id: string,
    schedule: NonNullable<Report['schedule']>
  ): Promise<void> {
    const reportRef = doc(db, REPORTS_COLLECTION, id);
    await updateDoc(reportRef, {
      schedule: {
        ...schedule,
        nextRun: Timestamp.fromDate(schedule.nextRun),
        lastRun: schedule.lastRun ? Timestamp.fromDate(schedule.lastRun) : null,
      },
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  async updateReportVisualizations(
    id: string,
    visualizations: Report['visualizations']
  ): Promise<void> {
    const reportRef = doc(db, REPORTS_COLLECTION, id);
    await updateDoc(reportRef, { 
      visualizations,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },
};

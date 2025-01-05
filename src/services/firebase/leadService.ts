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
  limit,
  Timestamp,
  DocumentData,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Lead } from '../../types/schemas';
import { activityService } from './activityService';

const LEADS_COLLECTION = 'leads';

const convertLeadFromFirestore = (doc: DocumentData): Lead => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    lastContact: data.lastContact?.toDate() || null,
    meetings: data.meetings?.map((meeting: any) => ({
      ...meeting,
      date: meeting.date?.toDate() || new Date(),
    })) || [],
  };
};

export const leadService = {
  async createLead(lead: Lead): Promise<void> {
    const leadRef = doc(db, LEADS_COLLECTION, lead.id);
    await setDoc(leadRef, {
      ...lead,
      createdAt: Timestamp.fromDate(lead.createdAt),
      updatedAt: Timestamp.fromDate(lead.updatedAt),
      lastContact: lead.lastContact ? Timestamp.fromDate(lead.lastContact) : null,
      meetings: lead.meetings?.map(meeting => ({
        ...meeting,
        date: Timestamp.fromDate(meeting.date),
      })),
    });

    await activityService.logActivity({
      type: 'create',
      entityType: 'lead',
      entityId: lead.id,
      description: 'יצירת ליד חדש',
      createdBy: lead.createdBy,
      metadata: {
        leadName: `${lead.firstName} ${lead.lastName}`,
        company: lead.company,
        status: lead.status,
      },
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: lead.createdBy
    });
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
    const leadRef = doc(db, LEADS_COLLECTION, id);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
      lastContact: updates.lastContact ? Timestamp.fromDate(updates.lastContact) : undefined,
      meetings: updates.meetings?.map(meeting => ({
        ...meeting,
        date: Timestamp.fromDate(meeting.date),
      })),
    };
    await updateDoc(leadRef, updateData);
  },

  async getLead(id: string): Promise<Lead | null> {
    const leadRef = doc(db, LEADS_COLLECTION, id);
    const leadDoc = await getDoc(leadRef);
    if (!leadDoc.exists()) return null;
    return convertLeadFromFirestore(leadDoc);
  },

  async getLeadsByStatus(status: string, limitCount?: number): Promise<Lead[]> {
    try {
      const leadsQuery = query(
        collection(db, 'leads'),
        where('status', '==', status),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );

      const finalQuery = limitCount ? query(leadsQuery, limit(limitCount)) : leadsQuery;
      const querySnapshot = await getDocs(finalQuery);
      return querySnapshot.docs.map(convertLeadFromFirestore);
    } catch (error) {
      throw error;
    }
  },

  async getLeadsByAssignee(assigneeId: string): Promise<Lead[]> {
    const leadsQuery = query(
      collection(db, LEADS_COLLECTION),
      where('assignedTo', '==', assigneeId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(leadsQuery);
    return querySnapshot.docs.map(convertLeadFromFirestore);
  },

  async deleteLead(id: string, deletedBy: string): Promise<void> {
    const leadRef = doc(db, LEADS_COLLECTION, id);
    await updateDoc(leadRef, {
      isDeleted: true,
      deletedAt: Timestamp.fromDate(new Date()),
      deletedBy,
    });

    await activityService.logActivity({
      type: 'delete',
      entityType: 'lead',
      entityId: id,
      description: 'מחיקת ליד',
      createdBy: deletedBy,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: deletedBy
    });
  },

  async addLeadMeeting(
    leadId: string,
    meeting: Omit<NonNullable<Lead['meetings']>[number], 'date'>
  ): Promise<void> {
    const leadRef = doc(db, LEADS_COLLECTION, leadId);
    const leadDoc = await getDoc(leadRef);
    if (!leadDoc.exists()) throw new Error('Lead not found');

    const lead = convertLeadFromFirestore(leadDoc);
    const meetings = lead.meetings || [];
    meetings.push({
      ...meeting,
      date: new Date(),
    });

    await updateDoc(leadRef, {
      meetings: meetings.map(m => ({
        ...m,
        date: Timestamp.fromDate(m.date),
      })),
      lastContact: Timestamp.fromDate(new Date()),
    });
  },
};

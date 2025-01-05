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
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Customer } from '../../types/schemas';
import { activityService } from './activityService';
import { v4 as uuidv4 } from 'uuid';

const CUSTOMERS_COLLECTION = 'customers';

const convertCustomerFromFirestore = (doc: DocumentData): Customer => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    lastContact: data.lastContact?.toDate() || null,
    contracts: data.contracts?.map((contract: any) => ({
      ...contract,
      startDate: contract.startDate?.toDate() || new Date(),
      endDate: contract.endDate?.toDate() || new Date(),
    })) || [],
    status: data.status || 'active',
    isDeleted: data.isDeleted || false,
  };
};

export const customerService = {
  async createCustomer(customer: Customer): Promise<void> {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customer.id);
    await setDoc(customerRef, {
      ...customer,
      createdAt: Timestamp.fromDate(customer.createdAt),
      updatedAt: Timestamp.fromDate(customer.updatedAt),
      lastContact: customer.lastContact ? Timestamp.fromDate(customer.lastContact) : null,
      contracts: customer.contracts?.map(contract => ({
        ...contract,
        startDate: Timestamp.fromDate(contract.startDate),
        endDate: Timestamp.fromDate(contract.endDate),
      })),
      isDeleted: false,
      status: 'active',
    });

    await activityService.logActivity({
      id: uuidv4(),
      type: 'create',
      entityType: 'customer',
      entityId: customer.id,
      description: 'יצירת לקוח חדש',
      createdBy: customer.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: customer.createdBy,
      metadata: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        company: customer.companyName,
        status: customer.status,
      },
    });
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
      lastContact: updates.lastContact instanceof Date ? Timestamp.fromDate(updates.lastContact) : updates.lastContact,
      contracts: updates.contracts?.map(contract => ({
        ...contract,
        startDate: Timestamp.fromDate(contract.startDate),
        endDate: Timestamp.fromDate(contract.endDate),
      })),
    };
    await updateDoc(customerRef, updateData);
  },

  async getCustomer(id: string): Promise<Customer | null> {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
    const customerDoc = await getDoc(customerRef);
    if (!customerDoc.exists()) return null;
    return convertCustomerFromFirestore(customerDoc);
  },

  async getActiveCustomers(maxResults?: number): Promise<Customer[]> {
    const baseQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('status', '==', 'active'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(baseQuery);
    return querySnapshot.docs.map(convertCustomerFromFirestore);
  },

  async getCustomersByStatus(status: Customer['status']): Promise<Customer[]> {
    const baseQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('status', '==', status),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(baseQuery);
    return querySnapshot.docs.map(convertCustomerFromFirestore);
  },

  async deleteCustomer(id: string, deletedBy: string): Promise<void> {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
    
    // Soft delete
    await updateDoc(customerRef, {
      isDeleted: true,
      status: 'inactive',
      updatedAt: Timestamp.fromDate(new Date()),
      updatedBy: deletedBy,
    });

    // Log deletion activity
    await activityService.logActivity({
      id: uuidv4(),
      type: 'delete',
      entityType: 'customer',
      entityId: id,
      description: 'מחיקת לקוח',
      createdBy: deletedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: deletedBy,
      metadata: {
        customerId: id,
      },
    });
  },
};

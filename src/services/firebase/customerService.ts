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
    status: data.status || 'פעיל',
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
      status: 'פעיל',
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
      completedAt: undefined,
      dueDate: undefined
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

  async getActiveCustomers(userId: string, maxResults?: number): Promise<Customer[]> {
    const baseQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('status', '==', 'פעיל'),
      where('isDeleted', '==', false),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(baseQuery);
    return querySnapshot.docs.map(convertCustomerFromFirestore);
  },

  async getAllCustomers(userId: string): Promise<Customer[]> {
    console.log('Getting all customers for userId:', userId);
    try {
      // First try without orderBy to see if we get results
      const baseQuery = query(
        collection(db, CUSTOMERS_COLLECTION),
        where('userId', '==', userId),
        where('isDeleted', '==', false)
      );
      
      console.log('Executing Firestore query...');
      const querySnapshot = await getDocs(baseQuery);
      console.log('Raw query results:', querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const customers = querySnapshot.docs.map(convertCustomerFromFirestore);
      console.log('Processed customers:', customers);
      
      // Sort in memory if we get results
      return customers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error in getAllCustomers:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  async getCustomersByStatus(userId: string, status: Customer['status']): Promise<Customer[]> {
    const customersQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('status', '==', status),
      where('userId', '==', userId),
      where('isDeleted', '==', false)
    );

    const querySnapshot = await getDocs(customersQuery);
    return querySnapshot.docs.map(convertCustomerFromFirestore);
  },

  async getCustomer(userId: string, id: string): Promise<Customer | null> {
    const customerDoc = await getDoc(doc(db, CUSTOMERS_COLLECTION, id));
    
    if (!customerDoc.exists()) return null;
    
    const customerData = customerDoc.data();
    if (customerData.userId !== userId) return null;
    
    return convertCustomerFromFirestore(customerDoc);
  },

  async deleteCustomer(id: string, deletedBy: string): Promise<void> {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
    
    // Soft delete
    await updateDoc(customerRef, {
      isDeleted: true,
      status: 'לא פעיל',
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
      completedAt: undefined,
      dueDate: undefined
    });
  },
};

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  setDoc,
  Timestamp,
  orderBy,
  limit,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { CustomerClass } from '../../types/customer';

const COLLECTION = 'Customers';

function convertCustomerFromFirestore(doc: DocumentData): CustomerClass {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.Name || '',
    lastName: data.LastName || '',
    companyName: data.CompanyName || '',
    assignedTo: data.AssignTo || [],
    Balance: data.Balance || 0,
    ComeFrom: data.ComeFrom || '',
    Comments: data.Comments || [],
    CreatedBy: data.CreatedBy || '',
    createdAt: data.createdAt || new Date().toISOString(),
    Email: data.Email || '',
    IsDeleted: data.IsDeleted || false,
    Links: data.Links || [],
    Phone: data.Phone || 0,
    Projects: data.Projects || [],
    Status: data.Status || 'פעיל',
    Tags: data.Tags || [],
    Tasks: data.Tasks || [],
    Files: data.Files || []
  };
}

function convertCustomerToFirestore(customer: Partial<CustomerClass>) {
  return { ...customer };
}

async function createCustomer(customer: Partial<CustomerClass>): Promise<string> {
  const customerData = convertCustomerToFirestore(customer);
  const docRef = await addDoc(collection(db, COLLECTION), customerData);
  return docRef.id;
}

async function updateCustomer(id: string, updates: Partial<CustomerClass>): Promise<void> {
  const customerRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(customerRef);
  
  if (!docSnap.exists()) {
    // If document doesn't exist, create it
    await setDoc(customerRef, updates);
  } else {
    // If document exists, update it
    await updateDoc(customerRef, updates);
  }
}

async function getActiveCustomers(userId: string, maxResults?: number): Promise<CustomerClass[]> {
  const customersRef = collection(db, COLLECTION);
  const q = maxResults
    ? query(
        customersRef,
        where('CreatedBy', '==', userId),
        where('IsDeleted', '==', false),
        orderBy('CompanyName'),
        limit(maxResults)
      )
    : query(
        customersRef,
        where('CreatedBy', '==', userId),
        where('IsDeleted', '==', false),
        orderBy('CompanyName')
      );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(convertCustomerFromFirestore);
}

async function getAllCustomers(userId: string): Promise<CustomerClass[]> {
  const customersRef = collection(db, COLLECTION);
  const q = query(
    customersRef,
    where('CreatedBy', '==', userId),
    orderBy('CompanyName')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(convertCustomerFromFirestore);
}

async function getCustomersByStatus(userId: string, status: CustomerClass['Status']): Promise<CustomerClass[]> {
  const customersRef = collection(db, COLLECTION);
  const q = query(
    customersRef,
    where('CreatedBy', '==', userId),
    where('Status', '==', status),
    where('IsDeleted', '==', false)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(convertCustomerFromFirestore);
}

async function getCustomer(userId: string, id: string): Promise<CustomerClass | null> {
  const customerRef = doc(db, COLLECTION, id);
  const customerDoc = await getDoc(customerRef);
  
  if (!customerDoc.exists()) return null;
  
  const customer = convertCustomerFromFirestore(customerDoc);
  return customer.CreatedBy === userId ? customer : null;
}

async function deleteCustomer(id: string, deletedBy: string): Promise<void> {
  try {
    console.log('Attempting to delete customer with ID:', id);
    
    // First try to find the document by querying
    const q = query(collection(db, COLLECTION), where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    let customerRef;
    if (!querySnapshot.empty) {
      // If found by query, use that document reference
      customerRef = querySnapshot.docs[0].ref;
    } else {
      // If not found by query, try direct reference
      customerRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(customerRef);
      if (!docSnap.exists()) {
        console.error('Customer document not found. Collection:', COLLECTION, 'ID:', id);
        throw new Error('Customer not found');
      }
    }
    
    await updateDoc(customerRef, {
      IsDeleted: true,
      Status: 'לא פעיל',
      deletedBy,
      deletedAt: Timestamp.now()
    });
    console.log('Successfully marked customer as deleted');
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    console.error('Collection:', COLLECTION);
    console.error('Customer ID:', id);
    throw error;
  }
}

export const customerService = {
  createCustomer,
  updateCustomer,
  getActiveCustomers,
  getAllCustomers,
  getCustomersByStatus,
  getCustomer,
  deleteCustomer
};

// src/services/firebase/leadService.ts
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Lead } from '../../types/schemas';
import { db } from '../../config/firebase';

const COLLECTION_NAME = 'leads';

const getLeads = async () => {
  try {
    const leadsRef = collection(db, COLLECTION_NAME);
    const q = query(
      leadsRef,
      where('isDeleted', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Lead[];
  } catch (error) {
    console.error('Error getting leads:', error);
    throw error;
  }
};

const createLead = async (leadData: Partial<Lead>) => {
  try {
    const leadsRef = collection(db, COLLECTION_NAME);
    const now = Timestamp.now();
    const newLead: Partial<Lead> = {
      ...leadData,
      assignedTo: "vnHPBuFgksf9LDqJryrBdawIkfx1",
      createdAt: now,
      updatedAt: now,
      createdBy: "vnHPBuFgksf9LDqJryrBdawIkfx1",
      updatedBy: "vnHPBuFgksf9LDqJryrBdawIkfx1",
      isDeleted: false,
      meetings: [],
      tags: [],
      score: 0,
      estimatedValue: 0,
      status: "חדש",
      lastContact: now,
    };
    
    const docRef = await addDoc(leadsRef, newLead);
    
    // Return the full lead object with the new ID
    return {
      id: docRef.id,
      ...newLead
    } as Lead;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};

const updateLead = async (id: string, leadData: Partial<Lead>) => {
  try {
    if (!id) {
      throw new Error('Lead ID is required for updating');
    }
    console.log('Updating lead with ID:', id);
    console.log('Collection Name:', COLLECTION_NAME);
    console.log('Database:', db);

    const leadRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      ...leadData,
      updatedAt: Timestamp.now(),
      updatedBy: "vnHPBuFgksf9LDqJryrBdawIkfx1"
    };
    return await updateDoc(leadRef, updateData);
  } catch (error) {
    console.error('Error updating lead:', error);
    console.error('Lead ID:', id);
    console.error('Lead Data:', leadData);
    throw error;
  }
};

const deleteLead = async (id: string) => {
  try {
    if (!id) {
      throw new Error('Lead ID is required for deletion');
    }
    console.log('Deleting lead with ID:', id);
    console.log('Collection Name:', COLLECTION_NAME);
    console.log('Database:', db);

    const leadRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(leadRef, {
      isDeleted: true,
      updatedAt: Timestamp.now(),
      updatedBy: "vnHPBuFgksf9LDqJryrBdawIkfx1"
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    console.error('Lead ID:', id);
    throw error;
  }
};

export const leadService = {
  getLeads,
  createLead,
  updateLead,
  deleteLead
};
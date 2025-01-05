import { getDatabase, ref, get, remove } from 'firebase/database';
import { getFirestore, collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import firebase from '../services/firebase';

interface DataToMigrate {
  leads: any[];
  customers: any[];
  tasks: any[];
}

export const migrateToFirestore = async (userId: string) => {
  try {
    // Get data from Realtime Database
    const rtdb = getDatabase();
    const db = getFirestore();
    
    const data: DataToMigrate = {
      leads: [],
      customers: [],
      tasks: []
    };

    // Fetch all data from Realtime Database
    const leadsSnapshot = await get(ref(rtdb, `users/${userId}/leads`));
    const customersSnapshot = await get(ref(rtdb, `users/${userId}/customers`));
    const tasksSnapshot = await get(ref(rtdb, `users/${userId}/tasks`));

    if (leadsSnapshot.exists()) {
      leadsSnapshot.forEach((child) => {
        data.leads.push({
          id: child.key,
          ...child.val()
        });
      });
    }

    if (customersSnapshot.exists()) {
      customersSnapshot.forEach((child) => {
        data.customers.push({
          id: child.key,
          ...child.val()
        });
      });
    }

    if (tasksSnapshot.exists()) {
      tasksSnapshot.forEach((child) => {
        data.tasks.push({
          id: child.key,
          ...child.val()
        });
      });
    }

    // Migrate data to Firestore
    const batch = [];

    // Migrate leads
    for (const lead of data.leads) {
      const { id, ...leadData } = lead;
      batch.push(
        setDoc(doc(db, `users/${userId}/leads/${id}`), leadData)
      );
    }

    // Migrate customers
    for (const customer of data.customers) {
      const { id, ...customerData } = customer;
      batch.push(
        setDoc(doc(db, `users/${userId}/customers/${id}`), customerData)
      );
    }

    // Migrate tasks
    for (const task of data.tasks) {
      const { id, ...taskData } = task;
      batch.push(
        setDoc(doc(db, `users/${userId}/tasks/${id}`), taskData)
      );
    }

    // Execute all migrations
    await Promise.all(batch);

    // Delete data from Realtime Database
    await remove(ref(rtdb, `users/${userId}/leads`));
    await remove(ref(rtdb, `users/${userId}/customers`));
    await remove(ref(rtdb, `users/${userId}/tasks`));

    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, message: 'Migration failed', error };
  }
};

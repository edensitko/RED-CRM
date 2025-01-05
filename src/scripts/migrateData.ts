import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import dotenv from 'dotenv';
import {
  adminUsers,
  users,
  tasks,
  customers,
  leads,
  reports,
  activities,
} from '../data/mockData';
import { userService } from '../services/firebase/userService';
import { taskService } from '../services/firebase/taskService';
import { customerService } from '../services/firebase/customerService';
import { leadService } from '../services/firebase/leadService';
import { reportService } from '../services/firebase/reportService';
import { activityService } from '../services/firebase/activityService';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateData() {
  try {
    console.log('Starting data migration...');

    // Migrate admin users
    console.log('Migrating admin users...');
    for (const admin of adminUsers) {
      await userService.createUser(admin);
    }

    // Migrate regular users
    console.log('Migrating regular users...');
    for (const user of users) {
      await userService.createUser(user);
    }

    // Migrate tasks
    console.log('Migrating tasks...');
    for (const task of tasks) {
      await taskService.createTask(task);
    }

    // Migrate customers
    console.log('Migrating customers...');
    for (const customer of customers) {
      await customerService.createCustomer(customer);
    }

    // Migrate leads
    console.log('Migrating leads...');
    for (const lead of leads) {
      await leadService.createLead(lead);
    }

    // Migrate reports
    console.log('Migrating reports...');
    for (const report of reports) {
      await reportService.createReport(report);
    }

    // Migrate activities
    console.log('Migrating activities...');
    for (const activity of activities) {
      await activityService.logActivity(activity);
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during data migration:', error);
    throw error;
  }
}

// Run migration
migrateData().catch(console.error);

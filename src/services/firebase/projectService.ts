import { doc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ProjectClass } from '../../types/project';
import { customerService } from './customerService';

const PROJECTS_COLLECTION = 'projects';

const toggleProjectFavorite = async (projectId: string, isFavorite: boolean) => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
      isFavorite: !isFavorite
    });
    return true;
  } catch (error) {
    console.error('Error toggling project favorite:', error);
    return false;
  }
};

const getAllProjects = async (userId: string): Promise<ProjectClass[]> => {
  try {
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    const q = query(projectsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return ProjectClass.fromFirestore({ id: doc.id, ...data });
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    return [];
  }
};

const createProject = async (projectData: Partial<ProjectClass>): Promise<string | null> => {
  try {
    const project = new ProjectClass({
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'לביצוע',
      assignedTo: [],
      tasks: []
    });

    // 1. Create the project
    const projectsRef = collection(db, PROJECTS_COLLECTION);
    const newProjectRef = await addDoc(projectsRef, project.toFirestore());

    // 2. Update the customer's projectIds array
    if (project.customerId) {
      const customer = await customerService.getCustomer(project.createdBy, project.customerId);
      if (customer) {
        const updatedProjectIds = [...(customer.Projects || []), newProjectRef.id];
        await customerService.updateCustomer(project.customerId, {
          Projects: updatedProjectIds
        });
      }
    }

    return newProjectRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
};

const deleteProject = async (projectId: string): Promise<boolean> => {
  try {
    if (!projectId) {
      console.error('Invalid project ID');
      return false;
    }

    // 1. Get the project to find its customerId
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      console.error('Project not found');
      return false;
    }

    const projectData = projectSnap.data();
    const project = ProjectClass.fromFirestore({ id: projectId, ...projectData });

    // 2. Delete the project from the projects collection
    await deleteDoc(projectRef);

    // 3. Remove the project from the customer's projectIds array
    if (project.customerId) {
      const customer = await customerService.getCustomer(project.createdBy, project.customerId);
      if (customer && customer.Projects) {
        const updatedProjectIds = customer.Projects.filter(id => id !== projectId);
        await customerService.updateCustomer(project.customerId, {
          Projects: updatedProjectIds
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
};

const updateProject = async (projectId: string, updates: Partial<ProjectClass>): Promise<boolean> => {
  try {
    // 1. Get current project data
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectSnap = await getDoc(projectRef);
    const currentData = projectSnap.data();
    
    // 2. Create updated project object
    const updatedProject = ProjectClass.fromFirestore({
      ...currentData,
      ...updates,
      id: projectId,
      updatedAt: new Date().toISOString()
    });

    // 3. Handle customer change if necessary
    if (updates.customerId && updates.customerId !== currentData?.customerId) {
      // Remove from old customer
      if (currentData?.customerId) {
        const oldCustomer = await customerService.getCustomer(currentData.createdBy, currentData.customerId);
        if (oldCustomer && oldCustomer.Projects) {
          const updatedProjectIds = oldCustomer.Projects.filter(id => id !== projectId);
          await customerService.updateCustomer(currentData.customerId, {
            Projects: updatedProjectIds
          });
        }
      }
      
      // Add to new customer
      const newCustomer = await customerService.getCustomer(updatedProject.createdBy, updates.customerId);
      if (newCustomer) {
        const updatedProjectIds = [...(newCustomer.Projects || []), projectId];
        await customerService.updateCustomer(updates.customerId, {
          Projects: updatedProjectIds
        });
      }
    }

    // 4. Update the project document
    await updateDoc(projectRef, updatedProject.toFirestore());

    return true;
  } catch (error) {
    console.error('Error updating project:', error);
    return false;
  }
};

const subscribeToProjects = (userId: string, callback: (projects: ProjectClass[]) => void) => {
  if (!userId) {
    console.error('No userId provided to subscribeToProjects');
    return () => {};
  }

  const projectsRef = collection(db, PROJECTS_COLLECTION);
  const q = query(projectsRef, where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => {
      const data = doc.data();
      return ProjectClass.fromFirestore({ id: doc.id, ...data });
    });
    callback(projects);
  }, (error) => {
    console.error('Firebase subscription error:', error);
    callback([]);
  });
};

export const projectService = {
  toggleProjectFavorite,
  getAllProjects,
  createProject,
  deleteProject,
  updateProject,
  subscribeToProjects
};

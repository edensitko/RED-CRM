import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const PROJECTS_COLLECTION = 'projects';

export const toggleProjectFavorite = async (projectId: string, isFavorite: boolean) => {
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

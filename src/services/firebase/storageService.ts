import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from '../../config/firebase';

export const storageService = {
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },

  async getFileUrl(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  },

  async listFiles(path: string): Promise<string[]> {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    return Promise.all(result.items.map(item => getDownloadURL(item)));
  },
};

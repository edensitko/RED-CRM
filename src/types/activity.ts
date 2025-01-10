export interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'other' | 'login' | 'export';
  entityType: string;
  entityId: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  metadata?: {
    updatedFields?: string[];
    [key: string]: any;
  };
}

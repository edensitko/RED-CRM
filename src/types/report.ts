export interface Report {
  id: string;
  title: string;
  description: string;
  type: string;
  data: any;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  name: string;
}

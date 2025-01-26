import { CustomerClass } from './schemas'
import { Timestamp } from 'firebase/firestore';

export type ProjectStatus = 'לביצוע' | 'בתהליך' | 'הושלם';

export interface ProjectTask {
    id: string;
    title: string;
    description: string;
    status: string;
    dueDate?: string;
    assignedTo?: string;
}

export class ProjectClass {
    id: string;
    name: string;
    description: string;
    budget: number;
    customerId: string;
    status: ProjectStatus;
    startDate: Timestamp;
    endDate: Timestamp | null;
    isFavorite: boolean;
    createdAt: Timestamp;
    createdBy: string;
    updatedAt: Timestamp;
    updatedBy: string;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    assignedTo: string[];
    tasks: ProjectTask[];
    userId: string;
    projectManager: string;
    links: string[];
    comments: string[];
    customer?: CustomerClass;

    constructor(data: Partial<ProjectClass> = {}) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.description = data.description || '';
        this.budget = data.budget || 0;
        this.customerId = data.customerId || '';
        this.status = data.status || 'לביצוע';
        this.startDate = data.startDate || Timestamp.now();
        this.endDate = data.endDate || null;
        this.isFavorite = data.isFavorite || false;
        this.createdAt = data.createdAt || Timestamp.now();
        this.createdBy = data.createdBy || '';
        this.updatedAt = data.updatedAt || Timestamp.now();
        this.updatedBy = data.updatedBy || '';
        this.isDeleted = data.isDeleted || false;
        this.deletedAt = data.deletedAt;
        this.deletedBy = data.deletedBy;
        this.assignedTo = data.assignedTo || [];
        this.tasks = data.tasks || [];
        this.userId = data.userId || '';
        this.projectManager = data.projectManager || '';
        this.links = data.links || [];
        this.comments = data.comments || [];
        this.customer = data.customer;
    }

    static fromFirestore(data: Record<string, any>): ProjectClass {
        if (!data.id) {
            console.error('Attempting to create ProjectClass without ID:', data);
            // Generate a temporary ID if none exists
            data.id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        return new ProjectClass({
            ...data,
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now(),
            status: data.status || 'לביצוע',
            assignedTo: data.assignedTo || [],
            tasks: data.tasks || [],
            isFavorite: data.isFavorite || false,
            budget: Number(data.budget) || 0,
            userId: data.userId || '',
            projectManager: data.projectManager || '',
            links: data.links || [],
            comments: data.comments || [],
            customer: data.customer
        });
    }

    toFirestore(): Record<string, any> {
        const data: Record<string, any> = {
            id: this.id,
            name: this.name,
            description: this.description,
            budget: this.budget,
            customerId: this.customerId,
            status: this.status,
            startDate: this.startDate,
            endDate: this.endDate,
            isFavorite: this.isFavorite,
            createdAt: this.createdAt,
            createdBy: this.createdBy,
            updatedAt: this.updatedAt,
            updatedBy: this.updatedBy,
            isDeleted: this.isDeleted,
            deletedAt: this.deletedAt || null,
            deletedBy: this.deletedBy || null,
            assignedTo: this.assignedTo,
            tasks: this.tasks,
            userId: this.userId,
            projectManager: this.projectManager,
            links: this.links,
            comments: this.comments
        };

        // Remove any undefined values
        Object.keys(data).forEach((key: keyof typeof data) => {
            if (data[key] === undefined) {
                delete data[key];
            }
        });

        return data;
    }
}

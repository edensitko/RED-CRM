import { SubTask } from "./schemas";

export interface CustomerClass {
  id: string;
  name: string;  
  lastName: string;
  companyName: string;  
  assignedTo: string[];
  Balance: number;
  ComeFrom: string;
  Comments: string[];
  CreatedBy: string;
  createdAt: string;
  Email: string;
  IsDeleted: boolean;
  Links: Array<string | { url: string; description: string }>;
  Phone: number;
  Projects: string[];
  Status: "פעיל" | "לא פעיל" | "בטיפול";
  Tags: string[];
  Tasks: string[];
  Files: Array<{ name: string; url: string; uploadedAt: string; size: number }>;
 subTasks: SubTask[];  
}

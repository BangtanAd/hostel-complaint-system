export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  rollNumber: string;
  hostelBlock: string;
  roomNumber: string;
  token?: string;
}

export interface Complaint {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    rollNumber: string;
    hostelBlock: string;
    roomNumber: string;
  };
  title: string;
  category: 'Water' | 'Electricity' | 'Wi-Fi' | 'Maintenance' | 'Cleanliness' | 'Furniture' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  description: string;
  status: 'Submitted' | 'In Progress' | 'Resolved';
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AppNotification {
  _id: string;
  message: string;
  complaintId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ComplaintStats {
  summary: {
    total: number;
    submitted: number;
    inProgress: number;
    resolved: number;
  };
  byCategory: { _id: string; count: number }[];
  byPriority: { _id: string; count: number }[];
}
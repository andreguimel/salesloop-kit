export interface Phone {
  id?: string;
  number: string;
  status: 'valid' | 'uncertain' | 'invalid' | 'pending';
  type: 'mobile' | 'landline';
}

export interface Company {
  id: string;
  name: string;
  cnae: string;
  cnaeDescription: string;
  city: string;
  state: string;
  segment: string;
  phones: Phone[];
  messageStatus?: 'sent' | 'not_delivered' | 'pending' | 'none';
  selectedPhones?: string[];
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
}

export interface SearchFilters {
  cnae: string;
  city: string;
  segment: string;
}

export interface DashboardMetrics {
  totalCompanies: number;
  validPhones: number;
  messagesSent: number;
  pendingMessages: number;
}

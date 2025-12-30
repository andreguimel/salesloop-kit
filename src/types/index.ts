export interface Phone {
  id?: string;
  number: string;
  status: 'valid' | 'uncertain' | 'invalid' | 'pending';
  type: 'mobile' | 'landline';
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  cnae: string;
  cnaeDescription: string;
  city: string;
  state: string;
  address?: string;
  cep?: string;
  segment: string;
  phones: Phone[];
  messageStatus?: 'sent' | 'not_delivered' | 'pending' | 'none';
  selectedPhones?: string[];
  // Enrichment fields
  website?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  aiSummary?: string;
  enrichedAt?: string;
  // CRM fields
  crmStageId?: string;
  dealValue?: number;
  expectedCloseDate?: string;
  crmNotes?: string;
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

// CRM Types
export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface CrmActivity {
  id: string;
  companyId: string;
  activityType: 'note' | 'call' | 'email' | 'meeting' | 'task';
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  company?: Company;
}

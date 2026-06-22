export interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  convertedAt: string | Date | null;
  convertedContactId: string | null;
  convertedCompanyId: string | null;
  convertedDealId: string | null;
}

export interface ContactRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyId: string | null;
  status: string;
  source: string | null;
  notes: string | null;
}

export interface CompanyRow {
  id: string;
  name: string;
  status: string;
  industry: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface DealRow {
  id: string;
  title: string;
  companyId: string | null;
  contactId: string | null;
  stageId: string | null;
  value: string | null;
  expectedCloseDate: string | null;
  notes: string | null;
}

export interface StageRow {
  id: string;
  name: string;
  kind: "open" | "won" | "lost";
  sortOrder: number;
  dealCount: number;
  totalValue: number;
  deletedAt?: string | null;
}

export interface ActivityRow {
  id: string;
  entityType: "lead" | "contact" | "company" | "deal";
  entityId: string;
  type: "note" | "task" | "call" | "meeting";
  title: string;
  details: string | null;
  dueAt: string | null;
  occurredAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
}

export interface SummaryResponse {
  leads: number;
  contacts: number;
  companies: number;
  deals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  overdueTasks: number;
  stageCounts: Array<{
    id: string;
    name: string;
    kind: "open" | "won" | "lost";
    dealCount: number;
    totalValue: number;
  }>;
}

export interface OptionItem {
  value: string;
  label: string;
}

export type LeadFormValues = {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  status: string;
  source?: string;
  notes?: string;
};

export type LeadConvertValues = {
  contactName: string;
  companyName?: string;
  createCompany: boolean;
  createDeal: boolean;
  dealTitle?: string;
  dealValue?: string | number;
  stageId?: string;
};

export type ContactFormValues = {
  name: string;
  email?: string;
  phone?: string;
  companyId?: string;
  status: string;
  source?: string;
  notes?: string;
};

export type CompanyFormValues = {
  name: string;
  status: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type DealFormValues = {
  title: string;
  companyId?: string;
  contactId?: string;
  stageId?: string;
  value?: string | number;
  expectedCloseDate?: string;
  notes?: string;
};

export type StageFormValues = {
  name: string;
  kind: "open" | "won" | "lost";
};

export type ActivityFormValues = {
  type: "note" | "task" | "call" | "meeting";
  title: string;
  details?: string;
  dueAt?: string;
  occurredAt?: string;
  completed: boolean;
};

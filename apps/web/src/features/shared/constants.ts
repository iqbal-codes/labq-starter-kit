import type {
  ActivityFormValues,
  CompanyFormValues,
  ContactFormValues,
  DealFormValues,
  LeadConvertValues,
  LeadFormValues,
  OptionItem,
  StageFormValues,
} from "./types";

export const LEAD_STATUS_OPTIONS: OptionItem[] = [
  { value: "new", label: "New" },
  { value: "working", label: "Working" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "disqualified", label: "Disqualified" },
];

export const CONTACT_STATUS_OPTIONS: OptionItem[] = [
  { value: "active", label: "Active" },
  { value: "nurturing", label: "Nurturing" },
  { value: "customer", label: "Customer" },
  { value: "inactive", label: "Inactive" },
];

export const COMPANY_STATUS_OPTIONS: OptionItem[] = [
  { value: "prospect", label: "Prospect" },
  { value: "customer", label: "Customer" },
  { value: "partner", label: "Partner" },
  { value: "inactive", label: "Inactive" },
];

export const ACTIVITY_TYPE_OPTIONS: OptionItem[] = [
  { value: "note", label: "Note" },
  { value: "task", label: "Task" },
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
];

export const STAGE_KIND_OPTIONS: OptionItem[] = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const EMPTY_LEAD_FORM: LeadFormValues = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  status: "new",
  source: "",
  notes: "",
};

export const EMPTY_LEAD_CONVERT_FORM: LeadConvertValues = {
  contactName: "",
  companyName: "",
  createCompany: true,
  createDeal: false,
  dealTitle: "",
  dealValue: "",
  stageId: "",
};

export const EMPTY_CONTACT_FORM: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  companyId: "",
  status: "active",
  source: "",
  notes: "",
};

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
  name: "",
  status: "prospect",
  industry: "",
  website: "",
  email: "",
  phone: "",
  address: "",
};

export const EMPTY_DEAL_FORM: DealFormValues = {
  title: "",
  companyId: "",
  contactId: "",
  stageId: "",
  value: "",
  expectedCloseDate: "",
  notes: "",
};

export const EMPTY_STAGE_FORM: StageFormValues = {
  name: "",
  kind: "open",
};

export const EMPTY_ACTIVITY_FORM: ActivityFormValues = {
  type: "note",
  title: "",
  details: "",
  dueAt: "",
  occurredAt: "",
  completed: false,
};

export const CONTACT_CSV_COLUMNS = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "status", label: "Status", required: false },
  { key: "source", label: "Source", required: false },
  { key: "notes", label: "Notes", required: false },
] as const;

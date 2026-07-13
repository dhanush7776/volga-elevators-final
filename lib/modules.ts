// ============================================================================
// MODULE REGISTRY
// Every business module in the ERP is described here as data: which Supabase
// table it reads from, which columns show in the table, which fields appear
// in the add/edit form, and who is allowed to see it. The generic CrudPage
// component (components/CrudPage.tsx) reads this config and renders full
// search/sort/filter/pagination/export/print CRUD for every module without
// needing a bespoke page per module.
// ============================================================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'select'
  | 'checkbox'
  | 'badge';

export type FieldOption = { value: string; label: string };

export type ModuleField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
  // for select fields backed by another table, e.g. customer_id -> customers.name
  relation?: { table: string; valueKey: string; labelKey: string };
  showInTable?: boolean;
  showInForm?: boolean;
  badgeColors?: Record<string, string>;
};

export type ModuleConfig = {
  slug: string;
  label: string;
  description: string;
  table: string;
  icon: string; // lucide-react icon name
  fields: ModuleField[];
  searchableKeys: string[];
  defaultSort: { key: string; direction: 'asc' | 'desc' };
  roles: Array<'admin' | 'technician'>;
  // which roles can actually perform writes (mirrors the RLS policies in 0001_init.sql)
  writeRoles?: Array<'admin' | 'technician'>;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  codePrefix?: string; // used to auto-generate a human friendly code field
};

const statusBadgeColors = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  assigned: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  in_progress: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  completed: 'bg-mint-500/15 text-mint-300 border-mint-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  open: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  resolved: 'bg-mint-500/15 text-mint-300 border-mint-500/30',
  closed: 'bg-white/10 text-white/50 border-white/20',
  paid: 'bg-mint-500/15 text-mint-300 border-mint-500/30',
  unpaid: 'bg-red-500/15 text-red-400 border-red-500/30',
  overdue: 'bg-red-500/15 text-red-400 border-red-500/30',
  partial: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  active: 'bg-mint-500/15 text-mint-300 border-mint-500/30',
  expired: 'bg-red-500/15 text-red-400 border-red-500/30',
  present: 'bg-mint-500/15 text-mint-300 border-mint-500/30',
  absent: 'bg-red-500/15 text-red-400 border-red-500/30',
  half_day: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  on_leave: 'bg-white/10 text-white/50 border-white/20',
};

export const MODULES: ModuleConfig[] = [
  {
    slug: 'customers',
    label: 'Customers',
    description: 'Manage customer profiles and contact details',
    table: 'customers',
    icon: 'Users',
    searchableKeys: ['name', 'phone', 'email', 'city', 'customer_code'],
    defaultSort: { key: 'created_at', direction: 'desc' },
    roles: ['admin'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    codePrefix: 'CUST',
    fields: [
      { key: 'customer_code', label: 'Customer ID', type: 'text', showInForm: false },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text', required: false },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'gst_number', label: 'GST Number', type: 'text' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    slug: 'buildings',
    label: 'Buildings',
    description: 'Buildings/sites belonging to customers',
    table: 'buildings',
    icon: 'Building2',
    searchableKeys: ['name', 'address', 'city'],
    defaultSort: { key: 'created_at', direction: 'desc' },
    roles: ['admin'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    fields: [
      {
        key: 'customer_id',
        label: 'Customer',
        type: 'select',
        required: true,
        relation: { table: 'customers', valueKey: 'id', labelKey: 'name' },
      },
      { key: 'name', label: 'Building Name', type: 'text', required: true },
      { key: 'address', label: 'Address', type: 'textarea', required: true },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'pincode', label: 'Pincode', type: 'text' },
      { key: 'total_floors', label: 'Total Floors', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    slug: 'elevators',
    label: 'Elevators',
    description: 'Elevator units installed across buildings',
    table: 'elevators',
    icon: 'ArrowUpDown',
    searchableKeys: ['elevator_code', 'brand', 'model'],
    defaultSort: { key: 'created_at', direction: 'desc' },
    roles: ['admin'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    codePrefix: 'ELV',
    fields: [
      { key: 'elevator_code', label: 'Elevator Code', type: 'text', showInForm: false },
      {
        key: 'building_id',
        label: 'Building',
        type: 'select',
        required: true,
        relation: { table: 'buildings', valueKey: 'id', labelKey: 'name' },
      },
      {
        key: 'elevator_type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'Passenger', label: 'Passenger' },
          { value: 'Freight', label: 'Freight' },
          { value: 'Hospital', label: 'Hospital' },
          { value: 'Panoramic', label: 'Panoramic' },
        ],
      },
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'capacity_kg', label: 'Capacity (kg)', type: 'number' },
      { key: 'floors_served', label: 'Floors Served', type: 'number' },
      { key: 'installation_date', label: 'Installation Date', type: 'date' },
      { key: 'last_service_date', label: 'Last Service', type: 'date' },
      { key: 'next_service_due', label: 'Next Service Due', type: 'date' },
      {
        key: 'status',
        label: 'Status',
        type: 'badge',
        options: [
          { value: 'operational', label: 'Operational' },
          { value: 'under_maintenance', label: 'Under Maintenance' },
          { value: 'out_of_service', label: 'Out of Service' },
        ],
        badgeColors: statusBadgeColors,
      },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    slug: 'service-requests',
    label: 'Service Requests',
    description: 'Breakdown calls and scheduled service jobs',
    table: 'service_requests',
    icon: 'Wrench',
    searchableKeys: ['request_number', 'description'],
    defaultSort: { key: 'created_at', direction: 'desc' },
    roles: ['admin', 'technician'],
    writeRoles: ['admin', 'technician'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    codePrefix: 'SR',
    fields: [
      { key: 'request_number', label: 'Request #', type: 'text', showInForm: false },
      {
        key: 'customer_id',
        label: 'Customer',
        type: 'select',
        required: true,
        relation: { table: 'customers', valueKey: 'id', labelKey: 'name' },
      },
      {
        key: 'elevator_id',
        label: 'Elevator',
        type: 'select',
        relation: { table: 'elevators', valueKey: 'id', labelKey: 'elevator_code' },
      },
      {
        key: 'assigned_technician_id',
        label: 'Technician',
        type: 'select',
        relation: { table: 'technicians', valueKey: 'id', labelKey: 'employee_code' },
      },
      {
        key: 'request_type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'breakdown', label: 'Breakdown' },
          { value: 'routine', label: 'Routine Service' },
          { value: 'installation', label: 'Installation' },
          { value: 'inspection', label: 'Inspection' },
        ],
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'normal', label: 'Normal' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' },
        ],
      },
      { key: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
      {
        key: 'status',
        label: 'Status',
        type: 'badge',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'assigned', label: 'Assigned' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
        badgeColors: statusBadgeColors,
      },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    slug: 'maintenance-records',
    label: 'Maintenance Records',
    description: 'Historical maintenance and service work log',
    table: 'maintenance_records',
    icon: 'ClipboardList',
    searchableKeys: ['work_performed', 'parts_used'],
    defaultSort: { key: 'service_date', direction: 'desc' },
    roles: ['admin', 'technician'],
    writeRoles: ['admin', 'technician'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    fields: [
      {
        key: 'elevator_id',
        label: 'Elevator',
        type: 'select',
        required: true,
        relation: { table: 'elevators', valueKey: 'id', labelKey: 'elevator_code' },
      },
      {
        key: 'technician_id',
        label: 'Technician',
        type: 'select',
        relation: { table: 'technicians', valueKey: 'id', labelKey: 'employee_code' },
      },
      {
        key: 'maintenance_type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'routine', label: 'Routine' },
          { value: 'repair', label: 'Repair' },
          { value: 'emergency', label: 'Emergency' },
        ],
      },
      { key: 'service_date', label: 'Service Date', type: 'date', required: true },
      { key: 'next_due_date', label: 'Next Due Date', type: 'date' },
      { key: 'work_performed', label: 'Work Performed', type: 'textarea' },
      { key: 'parts_used', label: 'Parts Used', type: 'textarea' },
    ],
  },
  {
    slug: 'amc-contracts',
    label: 'AMC Contracts',
    description: 'Annual maintenance contracts',
    table: 'amc_contracts',
    icon: 'FileSignature',
    searchableKeys: ['contract_number'],
    defaultSort: { key: 'end_date', direction: 'asc' },
    roles: ['admin'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    codePrefix: 'AMC',
    fields: [
      { key: 'contract_number', label: 'Contract #', type: 'text', showInForm: false },
      {
        key: 'customer_id',
        label: 'Customer',
        type: 'select',
        required: true,
        relation: { table: 'customers', valueKey: 'id', labelKey: 'name' },
      },
      {
        key: 'elevator_id',
        label: 'Elevator',
        type: 'select',
        relation: { table: 'elevators', valueKey: 'id', labelKey: 'elevator_code' },
      },
      { key: 'start_date', label: 'Start Date', type: 'date', required: true },
      { key: 'end_date', label: 'End Date', type: 'date', required: true },
      { key: 'contract_value', label: 'Contract Value', type: 'currency' },
      { key: 'visits_per_year', label: 'Visits / Year', type: 'number' },
      {
        key: 'status',
        label: 'Status',
        type: 'badge',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'expired', label: 'Expired' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
        badgeColors: statusBadgeColors,
      },
      { key: 'terms', label: 'Terms', type: 'textarea' },
    ],
  },
  {
    slug: 'complaints',
    label: 'Complaints',
    description: 'Customer complaints and resolutions',
    table: 'complaints',
    icon: 'MessageSquareWarning',
    searchableKeys: ['complaint_number', 'subject'],
    defaultSort: { key: 'created_at', direction: 'desc' },
    roles: ['admin', 'technician'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    codePrefix: 'CMP',
    fields: [
      { key: 'complaint_number', label: 'Complaint #', type: 'text', showInForm: false },
      {
        key: 'customer_id',
        label: 'Customer',
        type: 'select',
        required: true,
        relation: { table: 'customers', valueKey: 'id', labelKey: 'name' },
      },
      {
        key: 'elevator_id',
        label: 'Elevator',
        type: 'select',
        relation: { table: 'elevators', valueKey: 'id', labelKey: 'elevator_code' },
      },
      {
        key: 'assigned_technician_id',
        label: 'Assigned To',
        type: 'select',
        relation: { table: 'technicians', valueKey: 'id', labelKey: 'employee_code' },
      },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'normal', label: 'Normal' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' },
        ],
      },
      {
        key: 'status',
        label: 'Status',
        type: 'badge',
        options: [
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'closed', label: 'Closed' },
        ],
        badgeColors: statusBadgeColors,
      },
      { key: 'resolution_notes', label: 'Resolution Notes', type: 'textarea' },
    ],
  },
  {
    slug: 'payments',
    label: 'Payments',
    description: 'Invoices and payment tracking',
    table: 'payments',
    icon: 'IndianRupee',
    searchableKeys: ['invoice_number'],
    defaultSort: { key: 'due_date', direction: 'asc' },
    roles: ['admin'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    codePrefix: 'INV',
    fields: [
      { key: 'invoice_number', label: 'Invoice #', type: 'text', showInForm: false },
      {
        key: 'customer_id',
        label: 'Customer',
        type: 'select',
        required: true,
        relation: { table: 'customers', valueKey: 'id', labelKey: 'name' },
      },
      {
        key: 'amc_contract_id',
        label: 'AMC Contract',
        type: 'select',
        relation: { table: 'amc_contracts', valueKey: 'id', labelKey: 'contract_number' },
      },
      { key: 'amount', label: 'Amount', type: 'currency', required: true },
      { key: 'amount_paid', label: 'Amount Paid', type: 'currency' },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'paid_date', label: 'Paid Date', type: 'date' },
      {
        key: 'status',
        label: 'Status',
        type: 'badge',
        options: [
          { value: 'paid', label: 'Paid' },
          { value: 'pending', label: 'Pending' },
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'partial', label: 'Partial' },
        ],
        badgeColors: statusBadgeColors,
      },
      { key: 'payment_method', label: 'Payment Method', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    slug: 'technicians',
    label: 'Technicians',
    description: 'Field technician roster',
    table: 'technicians',
    icon: 'HardHat',
    searchableKeys: ['employee_code', 'specialization'],
    defaultSort: { key: 'created_at', direction: 'desc' },
    roles: ['admin'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    fields: [
      { key: 'employee_code', label: 'Employee Code', type: 'text' },
      { key: 'specialization', label: 'Specialization', type: 'text' },
      { key: 'base_salary', label: 'Base Salary', type: 'currency' },
      { key: 'join_date', label: 'Join Date', type: 'date' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  {
    slug: 'technician-salary',
    label: 'Technician Salary',
    description: 'Monthly salary processing',
    table: 'technician_salary',
    icon: 'Wallet',
    searchableKeys: [],
    defaultSort: { key: 'year', direction: 'desc' },
    roles: ['admin'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    fields: [
      {
        key: 'technician_id',
        label: 'Technician',
        type: 'select',
        required: true,
        relation: { table: 'technicians', valueKey: 'id', labelKey: 'employee_code' },
      },
      { key: 'month', label: 'Month', type: 'number', required: true },
      { key: 'year', label: 'Year', type: 'number', required: true },
      { key: 'base_amount', label: 'Base Amount', type: 'currency' },
      { key: 'bonus', label: 'Bonus', type: 'currency' },
      { key: 'deductions', label: 'Deductions', type: 'currency' },
      { key: 'advances_deducted', label: 'Advances Deducted', type: 'currency' },
      { key: 'net_amount', label: 'Net Amount', type: 'currency' },
      { key: 'paid_on', label: 'Paid On', type: 'date' },
      {
        key: 'status',
        label: 'Status',
        type: 'badge',
        options: [
          { value: 'paid', label: 'Paid' },
          { value: 'pending', label: 'Pending' },
        ],
        badgeColors: statusBadgeColors,
      },
    ],
  },
  {
    slug: 'technician-advances',
    label: 'Technician Advances',
    description: 'Salary advances given to technicians',
    table: 'technician_advances',
    icon: 'HandCoins',
    searchableKeys: ['reason'],
    defaultSort: { key: 'advance_date', direction: 'desc' },
    roles: ['admin'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    fields: [
      {
        key: 'technician_id',
        label: 'Technician',
        type: 'select',
        required: true,
        relation: { table: 'technicians', valueKey: 'id', labelKey: 'employee_code' },
      },
      { key: 'amount', label: 'Amount', type: 'currency', required: true },
      { key: 'reason', label: 'Reason', type: 'textarea' },
      { key: 'advance_date', label: 'Date', type: 'date' },
      { key: 'is_settled', label: 'Settled', type: 'checkbox' },
      { key: 'settled_date', label: 'Settled Date', type: 'date' },
    ],
  },
  {
    slug: 'attendance',
    label: 'Attendance',
    description: 'Daily technician attendance',
    table: 'attendance',
    icon: 'CalendarCheck',
    searchableKeys: [],
    defaultSort: { key: 'date', direction: 'desc' },
    roles: ['admin', 'technician'],
    writeRoles: ['admin', 'technician'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    fields: [
      {
        key: 'technician_id',
        label: 'Technician',
        type: 'select',
        required: true,
        relation: { table: 'technicians', valueKey: 'id', labelKey: 'employee_code' },
      },
      { key: 'date', label: 'Date', type: 'date', required: true },
      {
        key: 'status',
        label: 'Status',
        type: 'badge',
        options: [
          { value: 'present', label: 'Present' },
          { value: 'absent', label: 'Absent' },
          { value: 'half_day', label: 'Half Day' },
          { value: 'on_leave', label: 'On Leave' },
        ],
        badgeColors: statusBadgeColors,
      },
      { key: 'check_in', label: 'Check In', type: 'text' },
      { key: 'check_out', label: 'Check Out', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    slug: 'inventory',
    label: 'Inventory',
    description: 'Warehouse stock levels',
    table: 'inventory',
    icon: 'Boxes',
    searchableKeys: ['item_code', 'item_name', 'category'],
    defaultSort: { key: 'item_name', direction: 'asc' },
    roles: ['admin', 'technician'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    codePrefix: 'INVT',
    fields: [
      { key: 'item_code', label: 'Item Code', type: 'text' },
      { key: 'item_name', label: 'Item Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'text' },
      { key: 'reorder_level', label: 'Reorder Level', type: 'number' },
      { key: 'unit_cost', label: 'Unit Cost', type: 'currency' },
      { key: 'location', label: 'Location', type: 'text' },
    ],
  },
  {
    slug: 'spare-parts',
    label: 'Spare Parts',
    description: 'Elevator spare parts catalog',
    table: 'spare_parts',
    icon: 'Cog',
    searchableKeys: ['part_code', 'part_name', 'compatible_brands'],
    defaultSort: { key: 'part_name', direction: 'asc' },
    roles: ['admin', 'technician'],
    writeRoles: ['admin'],
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    fields: [
      { key: 'part_code', label: 'Part Code', type: 'text', required: true },
      { key: 'part_name', label: 'Part Name', type: 'text', required: true },
      { key: 'compatible_brands', label: 'Compatible Brands', type: 'text' },
      { key: 'stock_quantity', label: 'Stock Quantity', type: 'number' },
      { key: 'unit_price', label: 'Unit Price', type: 'currency' },
      { key: 'supplier', label: 'Supplier', type: 'text' },
    ],
  },
  {
    slug: 'notifications',
    label: 'Notifications',
    description: 'System alerts and reminders',
    table: 'notifications',
    icon: 'Bell',
    searchableKeys: ['title', 'message'],
    defaultSort: { key: 'created_at', direction: 'desc' },
    roles: ['admin', 'technician'],
    writeRoles: ['admin', 'technician'],
    canCreate: false,
    canUpdate: true,
    canDelete: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'message', label: 'Message', type: 'textarea' },
      { key: 'type', label: 'Type', type: 'badge', badgeColors: statusBadgeColors },
      { key: 'is_read', label: 'Read', type: 'checkbox' },
    ],
  },
  {
    slug: 'activity-logs',
    label: 'Activity Logs',
    description: 'Full audit trail of every change made in the system',
    table: 'activity_logs',
    icon: 'History',
    searchableKeys: ['action', 'entity_table'],
    defaultSort: { key: 'created_at', direction: 'desc' },
    roles: ['admin'],
    writeRoles: ['admin'],
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    fields: [
      { key: 'entity_table', label: 'Module', type: 'text' },
      { key: 'action', label: 'Action', type: 'badge', badgeColors: statusBadgeColors },
      { key: 'created_at', label: 'When', type: 'datetime' },
    ],
  },
];

export function getModule(slug: string) {
  return MODULES.find((m) => m.slug === slug);
}

export function modulesForRole(role: 'admin' | 'technician') {
  return MODULES.filter((m) => m.roles.includes(role));
}

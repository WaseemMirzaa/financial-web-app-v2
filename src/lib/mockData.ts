import { User, Employee, Customer, Loan, Chat, ChatMessage, Notification, InternalRoom, LoanStatus } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@demo.com',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'employee-1',
    email: 'employee@demo.com',
    name: 'John Employee',
    nameKey: 'detail.name.johnEmployee',
    role: 'employee',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'employee-2',
    email: 'employee2@demo.com',
    name: 'Sarah Employee',
    nameKey: 'detail.name.sarahEmployee',
    role: 'employee',
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 'customer-1',
    email: 'customer@demo.com',
    name: 'Ahmed Customer',
    nameKey: 'detail.name.ahmedCustomer',
    role: 'customer',
    isActive: true,
    createdAt: '2024-01-04T00:00:00Z',
  },
  {
    id: 'customer-2',
    email: 'customer2@demo.com',
    name: 'Fatima Customer',
    nameKey: 'detail.name.fatimaCustomer',
    role: 'customer',
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'customer-3',
    email: 'customer3@demo.com',
    name: 'Mohammed Customer',
    nameKey: 'detail.name.mohammedCustomer',
    role: 'customer',
    isActive: true,
    createdAt: '2024-01-06T00:00:00Z',
  },
];

export const mockEmployees: Employee[] = [
  {
    ...mockUsers[1],
    role: 'employee',
    assignedCustomerIds: ['customer-1', 'customer-2'],
  },
  {
    ...mockUsers[2],
    role: 'employee',
    assignedCustomerIds: ['customer-3'],
  },
];

export const mockCustomers: Customer[] = [
  {
    ...mockUsers[3],
    role: 'customer',
    assignedEmployeeId: 'employee-1',
    phone: '+1234567890',
    address: '123 Main St',
  },
  {
    ...mockUsers[4],
    role: 'customer',
    assignedEmployeeId: 'employee-1',
    phone: '+1234567891',
    address: '456 Oak Ave',
  },
  {
    ...mockUsers[5],
    role: 'customer',
    assignedEmployeeId: 'employee-2',
    phone: '+1234567892',
    address: '789 Pine Rd',
  },
];

// Mock Loans
export const mockLoans: Loan[] = [
  {
    id: 'loan-1',
    customerId: 'customer-1',
    employeeId: 'employee-1',
    amount: 50000,
    interestRate: 5.5,
    numberOfInstallments: 12,
    installmentTotal: 4500,
    startDate: '2024-02-01',
    status: 'active',
    notes: 'Monthly payment plan',
    notesKey: 'loan.notes.monthlyPayment',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'loan-2',
    customerId: 'customer-2',
    employeeId: 'employee-1',
    amount: 30000,
    interestRate: 4.5,
    numberOfInstallments: 24,
    installmentTotal: 1500,
    startDate: '2024-03-01',
    status: 'approved',
    notes: 'Pending activation',
    notesKey: 'loan.notes.pendingActivation',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  },
  {
    id: 'loan-3',
    customerId: 'customer-3',
    employeeId: 'employee-2',
    amount: 75000,
    interestRate: 6.0,
    numberOfInstallments: 36,
    installmentTotal: 2500,
    startDate: '2024-01-15',
    status: 'under_review',
    notes: 'Documentation review in progress',
    notesKey: 'loan.notes.documentationReview',
    createdAt: '2024-01-25T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z',
  },
];

// Mock Internal Rooms
export const mockInternalRooms: InternalRoom[] = [
  {
    id: 'room-1',
    name: 'Contracts',
    description: 'Discussion about contracts',
    createdBy: 'admin-1',
    memberIds: ['employee-1', 'employee-2'],
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'room-2',
    name: 'Follow Up',
    description: 'Customer follow-up discussions',
    createdBy: 'admin-1',
    memberIds: ['employee-1', 'employee-2'],
    createdAt: '2024-01-11T00:00:00Z',
  },
  {
    id: 'room-3',
    name: 'Receipts',
    description: 'Receipt and payment discussions',
    createdBy: 'admin-1',
    memberIds: ['employee-1'],
    createdAt: '2024-01-12T00:00:00Z',
  },
];

// Mock Chat Messages (contentKey/senderNameKey used for i18n in UI)
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    senderId: 'customer-1',
    senderName: 'Ahmed Customer',
    senderRole: 'customer',
    content: 'Hello, I have a question about my loan.',
    contentKey: 'chat.msg.helloQuestion',
    senderNameKey: 'chat.sender.ahmedCustomer',
    timestamp: '2024-02-15T10:00:00Z',
  },
  {
    id: 'msg-2',
    chatId: 'chat-1',
    senderId: 'employee-1',
    senderName: 'John Employee',
    senderRole: 'employee',
    content: 'Hello Ahmed, how can I help you today?',
    contentKey: 'chat.msg.helloHelp',
    senderNameKey: 'chat.sender.johnEmployee',
    timestamp: '2024-02-15T10:05:00Z',
  },
  {
    id: 'msg-3',
    chatId: 'chat-1',
    senderId: 'customer-1',
    senderName: 'Ahmed Customer',
    senderRole: 'customer',
    content: 'When is my next payment due?',
    contentKey: 'chat.msg.nextPayment',
    senderNameKey: 'chat.sender.ahmedCustomer',
    timestamp: '2024-02-15T10:10:00Z',
  },
  {
    id: 'msg-4',
    chatId: 'room-1',
    senderId: 'employee-1',
    senderName: 'John Employee',
    senderRole: 'employee',
    content: 'Has anyone reviewed the new contract template?',
    contentKey: 'chat.msg.contractTemplate',
    senderNameKey: 'chat.sender.johnEmployee',
    timestamp: '2024-02-15T09:00:00Z',
  },
];

// Mock Chats
export const mockChats: Chat[] = [
  {
    id: 'chat-1',
    type: 'customer_employee',
    participantIds: ['customer-1', 'employee-1'],
    lastMessage: mockChatMessages[2],
    unreadCount: 0,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-15T10:10:00Z',
  },
  {
    id: 'chat-2',
    type: 'customer_employee',
    participantIds: ['customer-2', 'employee-1'],
    unreadCount: 1,
    createdAt: '2024-02-05T00:00:00Z',
    updatedAt: '2024-02-15T09:30:00Z',
  },
  {
    id: 'room-1',
    type: 'internal_room',
    participantIds: ['employee-1', 'employee-2'],
    roomName: 'Contracts',
    lastMessage: mockChatMessages[3],
    unreadCount: 0,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-02-15T09:00:00Z',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'employee-1',
    title: 'New Customer Assigned',
    message: 'Ahmed Customer has been assigned to you',
    titleKey: 'notification.newCustomerAssigned',
    messageKey: 'notification.ahmedAssignedToYou',
    type: 'info',
    isRead: false,
    createdAt: '2024-02-15T08:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'customer-1',
    title: 'Loan Status Updated',
    message: 'Your loan status has been updated to Active',
    titleKey: 'notification.loanStatusUpdated',
    messageKey: 'notification.loanUpdatedToActive',
    type: 'success',
    isRead: false,
    createdAt: '2024-02-01T10:00:00Z',
  },
];

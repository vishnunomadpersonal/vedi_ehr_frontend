import { NavItem } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * Combines Kiranism dashboard starter nav with Vedi EHR clinical routes.
 * Used for both the sidebar navigation and Cmd+K bar.
 */
export const navItems: NavItem[] = [
  // ── Kiranism Starter ──
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Product',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'r'],
    isActive: false,
    items: []
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
    isActive: false,
    items: []
  },

  // ── EHR Clinical ──
  {
    title: 'Patients',
    url: '/dashboard/patients',
    icon: 'patients',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [
      {
        title: 'Patient List',
        url: '/dashboard/patients',
        shortcut: ['p', 'l']
      },
      {
        title: 'Register New',
        url: '/dashboard/patients/create',
        shortcut: ['p', 'n']
      }
    ]
  },
  {
    title: 'Encounters',
    url: '/dashboard/encounters',
    icon: 'encounters',
    shortcut: ['e', 'e'],
    isActive: false,
    items: [
      {
        title: 'All Encounters',
        url: '/dashboard/encounters',
        shortcut: ['e', 'l']
      },
      {
        title: 'Start New',
        url: '/dashboard/encounters/create',
        shortcut: ['e', 'n']
      },
      {
        title: 'Templates',
        url: '/dashboard/encounters/templates',
        shortcut: ['e', 't']
      }
    ]
  },
  {
    title: 'AI Scribe',
    url: '/dashboard/sessions',
    icon: 'mic',
    shortcut: ['a', 'i'],
    isActive: false,
    items: [
      { title: 'Audio Sessions', url: '/dashboard/sessions' },
      { title: 'Recordings', url: '/dashboard/recordings' },
      { title: 'Live Session', url: '/dashboard/recordings/live' }
    ]
  },
  {
    title: 'Schedule',
    url: '/dashboard/schedule',
    icon: 'calendar',
    shortcut: ['s', 's'],
    isActive: false,
    items: [{ title: 'Calendar', url: '/dashboard/schedule' }]
  },
  {
    title: 'Orders & Labs',
    url: '/dashboard/orders',
    icon: 'flask',
    shortcut: ['o', 'o'],
    isActive: false,
    items: [
      { title: 'All Orders', url: '/dashboard/orders' },
      { title: 'New Order', url: '/dashboard/orders/create' }
    ]
  },
  {
    title: 'Prescriptions',
    url: '/dashboard/prescriptions',
    icon: 'pill',
    shortcut: ['r', 'x'],
    isActive: false,
    items: [
      { title: 'All Prescriptions', url: '/dashboard/prescriptions' },
      { title: 'New Prescription', url: '/dashboard/prescriptions/create' },
      { title: 'Interactions', url: '/dashboard/prescriptions/interactions' },
      { title: 'Renewals', url: '/dashboard/prescriptions/renewals' }
    ]
  },
  {
    title: 'Billing',
    url: '/dashboard/billing',
    icon: 'billing',
    shortcut: ['b', 'b'],
    isActive: false,
    items: [
      { title: 'Claims', url: '/dashboard/billing' },
      { title: 'New Claim', url: '/dashboard/billing/create' },
      { title: 'Payments', url: '/dashboard/billing/payments' },
      { title: 'Denials', url: '/dashboard/billing/denials' },
      { title: 'Eligibility', url: '/dashboard/billing/eligibility' },
      { title: 'Fee Schedule', url: '/dashboard/billing/fee-schedule' }
    ]
  },
  {
    title: 'Messages',
    url: '/dashboard/messages',
    icon: 'mail',
    shortcut: ['m', 'g'],
    isActive: false,
    items: [
      { title: 'Inbox', url: '/dashboard/messages' },
      { title: 'Compose', url: '/dashboard/messages/compose' },
      { title: 'Notifications', url: '/dashboard/messages/notifications' }
    ]
  },
  {
    title: 'Telehealth',
    url: '/dashboard/telehealth',
    icon: 'video',
    shortcut: ['t', 'h'],
    isActive: false,
    items: [
      { title: 'Sessions', url: '/dashboard/telehealth' },
      { title: 'Waiting Room', url: '/dashboard/telehealth/waiting-room' }
    ]
  },
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: 'chart',
    shortcut: ['r', 'r'],
    isActive: false,
    items: [
      { title: 'Overview', url: '/dashboard/reports' },
      { title: 'Clinical', url: '/dashboard/reports/clinical' },
      { title: 'Financial', url: '/dashboard/reports/financial' },
      { title: 'Operational', url: '/dashboard/reports/operational' }
    ]
  },

  // ── Admin & Account ──
  {
    title: 'Admin',
    url: '/dashboard/admin',
    icon: 'shield',
    shortcut: ['a', 'd'],
    isActive: true,
    items: [
      { title: 'Overview', url: '/dashboard/admin' },
      { title: 'Users', url: '/dashboard/admin/users' },
      { title: 'Roles', url: '/dashboard/admin/roles' },
      { title: 'Providers', url: '/dashboard/admin/providers' },
      { title: 'Settings', url: '/dashboard/admin/settings' },
      { title: 'Audit Log', url: '/dashboard/admin/audit-log' }
    ]
  },
  {
    title: 'Account',
    url: '#',
    icon: 'account',
    isActive: true,
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'profile',
        shortcut: ['m', 'm']
      },
      {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login'
      }
    ]
  }
];

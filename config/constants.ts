// config/constants.ts

export const SESSION_COOKIE_NAME = 'streetcred_session';
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,       // JS cannot read it — prevents XSS token theft
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax' as const,  // CSRF protection
  maxAge: parseInt(process.env.SESSION_MAX_AGE ?? '604800', 10),
  path: '/',
} as const;

export const WORKER_PROFESSIONS = [
  'Mechanic',
  'Electrician',
  'Plumber',
  'Tailor',
  'Barber / Hairdresser',
  'Food Vendor',
  'Carpenter',
  'Mason / Builder',
  'Painter',
  'Welder',
  'Photographer',
  'Phone Repairer',
  'AC / Appliance Technician',
  'Driver / Logistics',
  'Cleaner',
  'Laundry / Dry Cleaning',
  'Artisan / Craft Maker',
  'Market Trader',
  'Other',
] as const;

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;

export const JOB_STATUSES = {
  REQUESTED:   'requested',
  ACCEPTED:    'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  PAID:        'paid',
  CANCELLED:   'cancelled',
} as const;

export const USER_ROLES = {
  WORKER:   'worker',
  CUSTOMER: 'customer',
  ADMIN:    'admin',
} as const;

export const TRUST_SCORE_WEIGHTS = {
  completedJobs:     0.40,
  verifiedPayments:  0.30,
  averageRating:     0.20,
  disputePenalty:    0.10,
} as const;

export const MAX_TRUST_SCORE = 100;
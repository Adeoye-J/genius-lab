// Shared TypeScript types used across the app.

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth
export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'worker' | 'customer';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'worker' | 'customer' | 'admin';
  isVerified: boolean;
  isOnboarded: boolean;
}

// Onboarding
export interface WorkerOnboardingInput {
  profession: string;
  skills: string[];
  bio: string;
  city: string;
  state: string;
  address?: string;
  yearsOfExperience: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
}

export interface CustomerOnboardingInput {
  name: string;
  preferredServices: string[];
}
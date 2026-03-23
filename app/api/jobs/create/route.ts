import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/auth';
import { createJob } from '@/services/jobService';
import { handleApiError } from '@/utils/errorHandler';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('customer');
    const body = await req.json();

    const { title, description, workerId, price, location, scheduledDate } = body;

    if (!title?.trim())  throw Object.assign(new Error('Job title is required'),  { status: 400 });
    if (!workerId)       throw Object.assign(new Error('Worker ID is required'),  { status: 400 });
    if (!price || price <= 0) throw Object.assign(new Error('Price must be a positive number'), { status: 400 });

    const job = await createJob({
      title, description, workerId,
      customerId: user.id,
      price, location, scheduledDate,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: job }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/jobs/create');
  }
}
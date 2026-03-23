// app/api/workers/route.ts
// GET  — public worker directory (filterable, paginated)
// POST — create/update worker profile (authenticated worker only)

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth/auth';
import { listWorkers, updateWorkerProfile } from '@/services/workerService';
import { connectDB } from '@/lib/database/mongodb';
import WorkerProfile from '@/models/Worker';
import WorkerEarnings from '@/models/WorkerEarnings';
import TrustScore from '@/models/TrustScore';
import { handleApiError } from '@/utils/errorHandler';
import type { ApiResponse } from '@/types';

// GET /api/workers?profession=Mechanic&state=Lagos&page=1&limit=12
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const result = await listWorkers({
      profession:    searchParams.get('profession') ?? undefined,
      state:         searchParams.get('state')      ?? undefined,
      city:          searchParams.get('city')        ?? undefined,
      minTrustScore: Number(searchParams.get('minTrustScore') ?? 0),
      available:     searchParams.get('available') === 'true' ? true : undefined,
      page:          Number(searchParams.get('page')  ?? 1),
      limit:         Number(searchParams.get('limit') ?? 12),
    });

    return NextResponse.json<ApiResponse>({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, 'GET /api/workers');
  }
}

// POST /api/workers — update the authenticated worker's own profile
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('worker');
    await connectDB();

    const body = await req.json();
    const { profession, skills, bio, city, state, address, yearsOfExperience, isAvailable } = body;

    // Upsert: create if doesn't exist, update if it does
    let worker = await WorkerProfile.findOne({ userId: user.id });

    if (!worker) {
      worker = await WorkerProfile.create({
        userId: user.id,
        profession: profession ?? '',
        skills:     skills ?? [],
        bio:        bio ?? '',
        location:   { city: city ?? '', state: state ?? '', address: address ?? '' },
        yearsOfExperience: yearsOfExperience ?? 0,
        isAvailable: isAvailable ?? true,
      });

      // Seed companion records
      await Promise.all([
        WorkerEarnings.create({ workerId: worker._id }),
        TrustScore.create({ workerId: worker._id }),
      ]);
    } else {
      const updates: Record<string, unknown> = {};
      if (profession !== undefined)        updates.profession          = profession;
      if (skills !== undefined)            updates.skills              = skills;
      if (bio !== undefined)               updates.bio                 = bio;
      if (city !== undefined)              updates['location.city']    = city;
      if (state !== undefined)             updates['location.state']   = state;
      if (address !== undefined)           updates['location.address'] = address;
      if (yearsOfExperience !== undefined) updates.yearsOfExperience   = yearsOfExperience;
      if (isAvailable !== undefined)       updates.isAvailable         = isAvailable;

      worker = await WorkerProfile.findByIdAndUpdate(
        worker._id,
        { $set: updates },
        { new: true, runValidators: true }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: worker });
  } catch (error) {
    return handleApiError(error, 'POST /api/workers');
  }
}
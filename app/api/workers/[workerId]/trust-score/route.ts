import { NextRequest, NextResponse } from 'next/server';
import TrustScore from '@/models/TrustScore';
import { connectDB } from '@/lib/database/mongodb';
import { handleApiError } from '@/utils/errorHandler';

export async function GET(
  _req: NextRequest,
  { params }: { params: { workerId: string } }
) {
  try {
    await connectDB();
    const ts = await TrustScore.findOne({ workerId: params.workerId }).lean();
    if (!ts) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: ts });
  } catch (error) {
    return handleApiError(error, `GET /api/workers/${params.workerId}/trust-score`);
  }
}
// Handles profile image upload.
// Images are stored as base64 data URLs in the User.profileImage field.
// For an MVP this is the simplest approach — no S3/Cloudinary needed.
// Max image size enforced: 500KB after base64 encoding.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/database/mongodb';
import User from '@/models/User';
import { handleApiError } from '@/utils/errorHandler';
import type { ApiResponse } from '@/types';

const MAX_SIZE_BYTES = 500 * 1024; // 500KB

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const body = await req.json();
    const { imageData } = body; // base64 data URL: "data:image/jpeg;base64,..."

    if (!imageData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'imageData is required' },
        { status: 400 }
      );
    }

    // Validate it's a valid data URL with an image MIME type
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Check size — base64 string length * 0.75 ≈ actual bytes
    const approximateBytes = imageData.length * 0.75;
    if (approximateBytes > MAX_SIZE_BYTES) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Image must be under 500KB. Please compress it first.' },
        { status: 400 }
      );
    }

    await connectDB();
    await User.findByIdAndUpdate(currentUser.id, { profileImage: imageData });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Profile image updated',
      data: { profileImage: imageData },
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/user/profile/image');
  }
}
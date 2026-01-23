import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getXeroAuthUrl } from '@/lib/xero/client';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate a unique state parameter to prevent CSRF
    // Include user ID so we can verify on callback
    const state = `${user.id}:${nanoid()}`;

    // Store state in a cookie for verification on callback
    const authUrl = getXeroAuthUrl(state);

    // Redirect to Xero authorization
    const response = NextResponse.redirect(authUrl);

    // Set state cookie (expires in 10 minutes)
    response.cookies.set('xero_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Xero authorize error:', error);
    return NextResponse.json(
      { error: 'Failed to start Xero authorization' },
      { status: 500 }
    );
  }
}

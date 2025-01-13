import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { createAdminClient } from '@/utils/supabase';
import QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantId } = await request.json();
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    // Generate QR code
    const visitUrl = `${request.headers.get('origin')}/visit/${restaurantId}`;
    const qrDataUrl = await QRCode.toDataURL(visitUrl);

    // Save QR code to Supabase
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('restaurants')
      .update({ qr_code: qrDataUrl })
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save QR code' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
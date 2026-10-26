import { NextResponse } from 'next/server';
import { cachedSource } from '@/lib/sourceCache';

export const maxDuration = 10;

/** Planespotters requires a descriptive User-Agent for API access. */
const USER_AGENT = 'Osiris/1.0 (+https://github.com/osiris)';

interface AircraftPhoto {
  url: string;
  width: number;
  height: number;
  photographer: string | null;
  link: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const icao24 = (searchParams.get('icao24') || '').trim().toLowerCase();
    if (!/^[0-9a-f]{6}$/.test(icao24)) {
      return NextResponse.json({ error: 'icao24 must be a 6-character hex address' }, { status: 400 });
    }

    const cached = cachedSource<AircraftPhoto>(
      `photo:${icao24}`,
      async () => {
        const res = await fetch(`https://api.planespotters.net/pub/photos/hex/${icao24}`, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return [];
        const json = await res.json();
        const photo = json?.photos?.[0];
        const thumb = photo?.thumbnail_large || photo?.thumbnail;
        if (!thumb?.src) return [];
        return [{
          url: thumb.src,
          width: thumb.size?.width ?? 0,
          height: thumb.size?.height ?? 0,
          photographer: photo.photographer ?? null,
          link: photo.link ?? null,
        }];
      },
      24 * 60 * 60 * 1000,
    );

    const [photo] = await cached();
    return NextResponse.json(photo ?? { url: null }, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch (error) {
    console.error('[OSIRIS] Aircraft photo lookup error:', error);
    return NextResponse.json({ url: null }, { status: 200 });
  }
}

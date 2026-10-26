import { describe, it, expect, vi, beforeEach } from 'vitest';

const originalFetch = global.fetch;

describe('GET /api/aircraft-photo', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects an invalid icao24', async () => {
    const { GET } = await import('./route');
    const res = await GET(new Request('http://localhost/api/aircraft-photo?icao24=zzz'));
    expect(res.status).toBe(400);
  });

  it('returns url:null when Planespotters has no photo', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [] }),
    } as any);
    const { GET } = await import('./route');
    const res = await GET(new Request('http://localhost/api/aircraft-photo?icao24=abcdef'));
    const json = await res.json();
    expect(json.url).toBeNull();
    global.fetch = originalFetch;
  });

  it('parses a photo and sends a descriptive User-Agent', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        photos: [{
          thumbnail_large: { src: 'https://t.example.com/big.jpg', size: { width: 420, height: 280 } },
          photographer: 'Test Pilot',
          link: 'https://example.com/photo',
        }],
      }),
    } as any);
    const { GET } = await import('./route');
    const res = await GET(new Request('http://localhost/api/aircraft-photo?icao24=abcdef'));
    const json = await res.json();
    expect(json.url).toBe('https://t.example.com/big.jpg');
    expect(json.photographer).toBe('Test Pilot');
    expect((global.fetch as any).mock.calls[0][1].headers['User-Agent']).toContain('Osiris');
    global.fetch = originalFetch;
  });
});

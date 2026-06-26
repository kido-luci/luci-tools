import { describe, it, expect } from 'vitest';
import { buildWifiPayload, toSvgString, toPngDataUrl } from './qr';

describe('buildWifiPayload', () => {
  it('produces the correct WIFI payload for a WPA network', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'pw', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:Net;P:pw;;');
  });

  it('backslash-escapes special characters in the SSID', () => {
    const result = buildWifiPayload({ ssid: 'My;Net', password: 'pw', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:My\\;Net;P:pw;;');
  });

  it('omits the password field for nopass encryption', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: '', encryption: 'nopass', hidden: false });
    expect(result).toBe('WIFI:T:nopass;S:Net;;');
  });

  it('adds H:true; when hidden is true', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'pw', encryption: 'WPA', hidden: true });
    expect(result).toBe('WIFI:T:WPA;S:Net;P:pw;H:true;;');
  });
});

describe('toSvgString', () => {
  it('returns a string containing <svg', async () => {
    const result = await toSvgString('hello');
    expect(result).toContain('<svg');
  });
});

describe('toPngDataUrl', () => {
  it('returns a data URL starting with data:image/png', async () => {
    const result = await toPngDataUrl('hello');
    expect(result).toMatch(/^data:image\/png/);
  });
});

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

  // --- encryption variants ---

  it('produces the correct WIFI payload for a WEP network', () => {
    const result = buildWifiPayload({ ssid: 'MyNet', password: 'secret', encryption: 'WEP', hidden: false });
    expect(result).toBe('WIFI:T:WEP;S:MyNet;P:secret;;');
  });

  it('produces the correct WIFI payload for nopass with a non-empty password value (password is ignored)', () => {
    // The spec: nopass → no P: field regardless of what password contains
    const result = buildWifiPayload({ ssid: 'OpenNet', password: 'ignored', encryption: 'nopass', hidden: false });
    expect(result).toBe('WIFI:T:nopass;S:OpenNet;;');
  });

  it('does not add H:true; when hidden is false', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'pw', encryption: 'WPA', hidden: false });
    expect(result).not.toContain('H:true;');
  });

  it('adds H:true; between password and trailing semicolon when hidden is true for WEP', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'key', encryption: 'WEP', hidden: true });
    expect(result).toBe('WIFI:T:WEP;S:Net;P:key;H:true;;');
  });

  it('adds H:true; for nopass hidden network', () => {
    const result = buildWifiPayload({ ssid: 'HiddenOpen', password: '', encryption: 'nopass', hidden: true });
    expect(result).toBe('WIFI:T:nopass;S:HiddenOpen;H:true;;');
  });

  // --- escaping ---

  it('escapes backslash in password', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'pass\\word', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:Net;P:pass\\\\word;;');
  });

  it('escapes semicolon in password', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'pa;ss', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:Net;P:pa\\;ss;;');
  });

  it('escapes comma in password', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'pa,ss', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:Net;P:pa\\,ss;;');
  });

  it('escapes colon in password', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'pa:ss', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:Net;P:pa\\:ss;;');
  });

  it('escapes double-quote in password', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'pa"ss', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:Net;P:pa\\"ss;;');
  });

  it('escapes all special chars simultaneously in SSID and password', () => {
    // SSID: 'A\\;,:' → A\\\\\\;\\,\\:
    // password: '"B;' → \\"B\\;
    const result = buildWifiPayload({ ssid: 'A\\;,:', password: '"B;', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:A\\\\\\;\\,\\:;P:\\"B\\;;;');
  });

  it('escapes backslash in SSID', () => {
    const result = buildWifiPayload({ ssid: 'My\\Net', password: 'pw', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:My\\\\Net;P:pw;;');
  });

  it('escapes colon in SSID', () => {
    const result = buildWifiPayload({ ssid: 'Net:work', password: 'pw', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:Net\\:work;P:pw;;');
  });

  // --- edge cases ---

  it('handles empty password with WPA (empty string)', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: '', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:Net;P:;;');
  });

  it('does not escape spaces in SSID', () => {
    const result = buildWifiPayload({ ssid: 'My Network', password: 'pw', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:My Network;P:pw;;');
  });

  it('does not escape spaces in password', () => {
    const result = buildWifiPayload({ ssid: 'Net', password: 'my pass', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:Net;P:my pass;;');
  });
});

describe('toPngDataUrl', () => {
  it('returns a data URL starting with data:image/png', async () => {
    const result = await toPngDataUrl('hello');
    expect(result).toMatch(/^data:image\/png/);
  });

  it('returns different output for different inputs', async () => {
    const a = await toPngDataUrl('hello');
    const b = await toPngDataUrl('world');
    expect(a).not.toBe(b);
  });
});

describe('toSvgString', () => {
  it('returns a string containing <svg', async () => {
    const result = await toSvgString('hello');
    expect(result).toContain('<svg');
  });

  it('returns different SVG output for different inputs', async () => {
    const a = await toSvgString('hello');
    const b = await toSvgString('world');
    expect(a).not.toBe(b);
  });
});

import { describe, it, expect } from 'vitest';
import {
  buildWifiPayload,
  buildVcardPayload,
  buildEmailPayload,
  toSvgString,
  toPngDataUrl,
} from './qr';

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

describe('buildVcardPayload', () => {
  const base = { firstName: 'Ada', lastName: 'Lovelace', phone: '', email: '', org: '', url: '' };

  it('builds a minimal vCard with just a name', () => {
    const result = buildVcardPayload(base);
    expect(result).toBe(
      'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Lovelace;Ada;;;\r\nFN:Ada Lovelace\r\nEND:VCARD',
    );
  });

  it('joins lines with CRLF', () => {
    const result = buildVcardPayload(base);
    expect(result.split('\r\n')[0]).toBe('BEGIN:VCARD');
    expect(result).toContain('\r\n');
    expect(result).not.toContain('\n\n');
  });

  it('includes all optional lines in the correct order when provided', () => {
    const result = buildVcardPayload({
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+15550001',
      email: 'ada@example.com',
      org: 'Analytical Engines',
      url: 'https://example.com',
    });
    expect(result).toBe(
      'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Lovelace;Ada;;;\r\nFN:Ada Lovelace\r\n' +
        'ORG:Analytical Engines\r\nTEL;TYPE=CELL:+15550001\r\nEMAIL:ada@example.com\r\n' +
        'URL:https://example.com\r\nEND:VCARD',
    );
  });

  it('omits ORG when org is empty', () => {
    const result = buildVcardPayload({ ...base, phone: '+15550001' });
    expect(result).not.toContain('ORG:');
    expect(result).toContain('TEL;TYPE=CELL:+15550001');
  });

  it('omits TEL, EMAIL and URL when their fields are empty', () => {
    const result = buildVcardPayload({ ...base, org: 'Acme' });
    expect(result).not.toContain('TEL');
    expect(result).not.toContain('EMAIL:');
    expect(result).not.toContain('URL:');
    expect(result).toContain('ORG:Acme');
  });

  it('backslash-escapes semicolons, commas and backslashes in N and FN', () => {
    const result = buildVcardPayload({ ...base, firstName: 'A;B', lastName: 'C,D\\E' });
    expect(result).toContain('N:C\\,D\\\\E;A\\;B;;;');
    expect(result).toContain('FN:A\\;B C\\,D\\\\E');
  });

  it('escapes commas in ORG', () => {
    const result = buildVcardPayload({ ...base, org: 'Acme, Inc' });
    expect(result).toContain('ORG:Acme\\, Inc');
  });

  it('trims FN when one name part is empty', () => {
    const result = buildVcardPayload({ ...base, lastName: '' });
    expect(result).toContain('N:;Ada;;;');
    expect(result).toContain('FN:Ada');
  });
});

describe('buildEmailPayload', () => {
  it('builds a bare mailto when only the address is given', () => {
    const result = buildEmailPayload({ to: 'hi@example.com', subject: '', body: '' });
    expect(result).toBe('mailto:hi@example.com');
  });

  it('appends an encoded subject param', () => {
    const result = buildEmailPayload({ to: 'hi@example.com', subject: 'Hello there', body: '' });
    expect(result).toBe('mailto:hi@example.com?subject=Hello%20there');
  });

  it('appends an encoded body param', () => {
    const result = buildEmailPayload({ to: 'hi@example.com', subject: '', body: 'a & b' });
    expect(result).toBe('mailto:hi@example.com?body=a%20%26%20b');
  });

  it('joins subject and body with & in that order', () => {
    const result = buildEmailPayload({ to: 'hi@example.com', subject: 'Hi', body: 'Body' });
    expect(result).toBe('mailto:hi@example.com?subject=Hi&body=Body');
  });

  it('omits empty params', () => {
    const result = buildEmailPayload({ to: 'hi@example.com', subject: 'Only', body: '' });
    expect(result).toBe('mailto:hi@example.com?subject=Only');
    expect(result).not.toContain('body=');
  });

  it('percent-encodes reserved characters in the subject', () => {
    const result = buildEmailPayload({ to: 'hi@example.com', subject: 'a?b=c&d', body: '' });
    expect(result).toBe('mailto:hi@example.com?subject=a%3Fb%3Dc%26d');
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

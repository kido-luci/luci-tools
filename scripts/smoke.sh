#!/usr/bin/env bash
# Release smoke check for tools.luci-studio.com. Run it after deploying the
# router and the Pages projects:
#   - every URL in the sitemaps answers 200;
#   - unknown paths answer 404: one per engine prefix, two under tools-home, and
#     the Object.prototype names that used to crash the router;
#   - every response carries the router's security headers: a CSP (report-only
#     or enforcing) with 'unsafe-eval' under /image/ only, X-Frame-Options:
#     SAMEORIGIN and Strict-Transport-Security: max-age=31536000.
#
# Usage: scripts/smoke.sh [base-url]    (default: https://tools.luci-studio.com)
# Exits 1 if any check fails. Only sends GET requests.
set -uo pipefail

SITE=https://tools.luci-studio.com
BASE=${1:-$SITE}
BASE=${BASE%/}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
fails=0
csp_mode=none

fail() {
  echo "FAIL $*"
  fails=$((fails + 1))
}

# GET a URL and print its status code; the body and headers land in $tmp.
fetch() {
  curl -sS --compressed --max-time 20 -o "$tmp/body" -D "$tmp/headers" -w '%{http_code}' "$1" </dev/null 2>/dev/null ||
    echo 000
}

# The value of a response header from the last fetch (case-insensitive name).
header() {
  grep -i "^$1:" "$tmp/headers" | head -1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//'
}

# The <loc> URLs of the last fetched sitemap, moved onto BASE.
locs() {
  grep -o '<loc>[^<]*</loc>' "$tmp/body" | sed -e 's#</*loc>##g' -e "s#^$SITE#$BASE#"
}

check_headers() {
  local url=$1 csp xfo hsts
  csp=$(header content-security-policy)
  if [ -n "$csp" ]; then
    csp_mode=enforcing
  else
    csp=$(header content-security-policy-report-only)
    [ -n "$csp" ] && csp_mode=report-only
  fi
  if [ -z "$csp" ]; then
    fail "$url: no Content-Security-Policy(-Report-Only) header"
  else
    case "$url" in
      "$BASE"/image/*) [[ $csp == *"'unsafe-eval'"* ]] || fail "$url: CSP lacks 'unsafe-eval'" ;;
      *) [[ $csp != *"'unsafe-eval'"* ]] || fail "$url: CSP allows 'unsafe-eval' outside /image/" ;;
    esac
  fi
  xfo=$(header x-frame-options)
  [ "$xfo" = SAMEORIGIN ] || fail "$url: X-Frame-Options is '$xfo'"
  hsts=$(header strict-transport-security)
  [ "$hsts" = 'max-age=31536000' ] || fail "$url: Strict-Transport-Security is '$hsts'"
}

# 1. Every sitemap URL answers 200 with the headers.
code=$(fetch "$BASE/sitemap.xml")
if [ "$code" != 200 ]; then
  echo "FAIL $BASE/sitemap.xml: $code (want 200)"
  exit 1
fi
locs >"$tmp/sitemaps"
[ -s "$tmp/sitemaps" ] || fail "$BASE/sitemap.xml lists no sitemaps"
: >"$tmp/pages"
while read -r sitemap; do
  code=$(fetch "$sitemap")
  if [ "$code" = 200 ]; then locs >>"$tmp/pages"; else fail "$sitemap: $code (want 200)"; fi
done <"$tmp/sitemaps"

pages=0
while read -r url; do
  pages=$((pages + 1))
  code=$(fetch "$url")
  [ "$code" = 200 ] || fail "$url: $code (want 200)"
  check_headers "$url"
done <"$tmp/pages"
[ "$pages" -gt 0 ] || fail "the sitemaps list no URLs"

# 2. Unknown paths answer 404 with the headers. Engine prefixes come from the
#    sitemap index (/<prefix>/sitemap.xml).
probes="/smoke-no-such-page/ /privacy/smoke-no-such-page/ /constructor/x /__proto__/x /valueOf /toString/ /hasOwnProperty"
for prefix in $(sed -n "s#^$BASE/\([^/]*\)/sitemap\.xml\$#\1#p" "$tmp/sitemaps"); do
  probes="$probes /$prefix/smoke-no-such-page/"
done
unknown=0
for path in $probes; do
  unknown=$((unknown + 1))
  code=$(fetch "$BASE$path")
  [ "$code" = 404 ] || fail "$BASE$path: $code (want 404)"
  check_headers "$BASE$path"
done

echo "Checked $pages sitemap URLs and $unknown unknown paths on $BASE (CSP: $csp_mode)."
if [ "$fails" -gt 0 ]; then
  echo "$fails check(s) failed."
  exit 1
fi
echo "All checks passed."

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host')

  // Extract subdomain
  const subdomain = hostname?.split('.')[0]

  // Skip if it's not a tenant subdomain or it's a static asset
  if (
    !subdomain ||
    ['www', 'localhost', 'api', 'admin'].includes(subdomain) ||
    url.pathname.startsWith('/_next') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Rewrite to the tenant-specific route
  return NextResponse.rewrite(new URL(`/_tenants/${subdomain}${url.pathname}`, request.url))
}

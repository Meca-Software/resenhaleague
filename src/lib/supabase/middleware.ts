import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-browser cookies.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname;

  // Protect admin and portal routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
    if (!user) {
      // no user, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // RBAC: Check role from user metadata
    const role = user.user_metadata?.role || 'pilot';

    if (pathname.startsWith('/admin') && role === 'pilot') {
      // Pilots cannot access admin
      const url = request.nextUrl.clone()
      url.pathname = '/portal'
      return NextResponse.redirect(url)
    }

    if (role === 'steward' && pathname.startsWith('/admin') && !pathname.startsWith('/admin/stewards')) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/stewards'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged in users away from /login
  if (pathname === '/login' && user) {
    const role = user.user_metadata?.role || 'pilot';
    const url = request.nextUrl.clone()
    
    if (role === 'pilot') url.pathname = '/portal'
    else if (role === 'steward') url.pathname = '/admin/stewards'
    else url.pathname = '/admin'
    
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

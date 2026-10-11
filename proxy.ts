import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PAGES = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies, headers) => {
          for (const { name, value } of cookies) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookies) {
            response.cookies.set(name, value, options);
          }
          for (const [name, value] of Object.entries(headers)) {
            response.headers.set(name, value);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  if (data || PUBLIC_PAGES.includes(request.nextUrl.pathname)) {
    return response;
  }

  const toLogin = NextResponse.redirect(new URL('/login', request.url));
  for (const cookie of response.cookies.getAll()) toLogin.cookies.set(cookie);
  return toLogin;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\..*).*)'],
};

import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PAGES = ['/', '/login'];

export async function proxy(request: NextRequest) {
  let refreshedCookies: Parameters<SetAllCookies>[0] = [];
  let cacheHeaders: Parameters<SetAllCookies>[1] = {};
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
          refreshedCookies = cookies;
          cacheHeaders = headers;
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const response =
    data || PUBLIC_PAGES.includes(request.nextUrl.pathname)
      ? NextResponse.next({ request })
      : NextResponse.redirect(new URL('/', request.url));

  for (const { name, value, options } of refreshedCookies) {
    response.cookies.set(name, value, options);
  }
  for (const [name, value] of Object.entries(cacheHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

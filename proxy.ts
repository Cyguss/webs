import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";

  // Security response headers helper
  const addSecurityHeaders = (res: NextResponse) => {
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return res;
  };

  // Strip www prefix
  const host = hostname.replace("www.", "");

  // Subdomain multi-storefront routing (e.g., storename.vaultly.io -> /storename)
  if (host !== appDomain && host.endsWith(`.${appDomain}`)) {
    const subdomain = host.replace(`.${appDomain}`, "").toLowerCase();

    // Don't rewrite system subdomains
    if (subdomain !== "dashboard" && subdomain !== "api" && subdomain !== "admin") {
      const newUrl = url.clone();
      newUrl.pathname = `/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
      return addSecurityHeaders(NextResponse.rewrite(newUrl));
    }
  }

  // Dashboard Authentication Guard: Redirect to /login if no Better-Auth session cookie
  if (url.pathname.startsWith("/dashboard")) {
    const sessionToken =
      request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__Secure-better-auth.session_token")?.value;

    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", url.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

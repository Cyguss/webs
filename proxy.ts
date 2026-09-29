import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitPresets, getClientIp, createRateLimitResponse } from "@/lib/rate-limit";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const appDomain =
    process.env.NEXT_PUBLIC_APP_DOMAIN ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    "localhost:3000";

  // 1. Anti-DDoS & Flood Protection (Global Edge Rate Limiter)
  const clientIp = getClientIp(request);
  const globalCheck = rateLimit({
    key: `global_edge:${clientIp}`,
    ...rateLimitPresets.global,
  });

  if (!globalCheck.allowed) {
    return createRateLimitResponse(
      globalCheck,
      "DDoS / Traffic flood protection triggered. Your IP has exceeded request velocity limits."
    );
  }

  // 2. Production Security Headers Helper
  const addSecurityHeaders = (res: NextResponse) => {
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
    res.headers.set("X-XSS-Protection", "1; mode=block");
    res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    return res;
  };

  // Strip www prefix
  const host = hostname.replace("www.", "");

  // 3. Multi-storefront routing: Subdomains & Custom Domains (DNS CNAME support)
  const isLocalOrSystemHost =
    host === appDomain ||
    host === "localhost" ||
    host.startsWith("localhost:") ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".up.railway.app") ||
    host.endsWith(".railway.app");

  if (!isLocalOrSystemHost) {
    if (host.endsWith(`.${appDomain}`)) {
      // Subdomain routing (e.g., mystore.vaultly.io -> /mystore)
      const subdomain = host.replace(`.${appDomain}`, "").toLowerCase();

      // Don't rewrite system subdomains
      if (subdomain !== "dashboard" && subdomain !== "api" && subdomain !== "admin") {
        const newUrl = url.clone();
        newUrl.pathname = `/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
        return addSecurityHeaders(NextResponse.rewrite(newUrl));
      }
    } else {
      // External Custom Domain routing (e.g., store.example.com -> /store.example.com)
      // Store lookup resolves via shops.customDomain
      const isSystemPath =
        url.pathname.startsWith("/api") ||
        url.pathname.startsWith("/dashboard") ||
        url.pathname.startsWith("/admin") ||
        url.pathname.startsWith("/login") ||
        url.pathname.startsWith("/signup");

      if (!isSystemPath) {
        const newUrl = url.clone();
        newUrl.pathname = `/${host}${url.pathname === "/" ? "" : url.pathname}`;
        return addSecurityHeaders(NextResponse.rewrite(newUrl));
      }
    }
  }

  // 4. Dashboard & Admin Authentication Guards
  if (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/admin")) {
    const sessionToken =
      request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__Secure-better-auth.session_token")?.value;

    // Allow admin login page bypass if going to /admin and ticket exists or to login
    if (!sessionToken && !url.pathname.startsWith("/api/")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", url.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets with extensions (.svg, .png, .jpg, .css, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)).*)",
  ],
};

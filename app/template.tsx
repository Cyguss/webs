"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function RootTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  // Dashboard layout has its own internal main content transition; exclude it from root transform
  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div key={pathname} className="page-fly-in" style={{ width: "100%", minHeight: "100%" }}>
      {children}
    </div>
  );
}

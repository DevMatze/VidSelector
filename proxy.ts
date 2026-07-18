import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export function proxy(request: NextRequest) {
  logger.request(request.method, request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

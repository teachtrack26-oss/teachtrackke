import { NextResponse } from "next/server";

// NextAuth is intentionally disabled in this app.
// We use backend cookie auth (/api/v1/auth/*) for all login/logout flows.
// Returning 404 prevents production "Configuration" errors from misconfigured NextAuth envs.

export async function GET() {
  return NextResponse.json({ detail: "Not Found" }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ detail: "Not Found" }, { status: 404 });
}

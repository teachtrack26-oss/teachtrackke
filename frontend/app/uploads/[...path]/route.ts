import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL_RAW =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : undefined);

function getBackendUrl(): string {
  if (!BACKEND_URL_RAW) {
    throw new Error(
      "Missing BACKEND_URL (or NEXT_PUBLIC_API_URL). Set it to your FastAPI base URL, e.g. http://api.example.com"
    );
  }
  return BACKEND_URL_RAW.replace(/\/+$/, "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyUpload(request, path, "GET");
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyUpload(request, path, "HEAD");
}

async function proxyUpload(
  request: NextRequest,
  pathParts: string[],
  method: "GET" | "HEAD"
) {
  try {
    const path = pathParts.join("/");
    const baseUrl = `${getBackendUrl()}/uploads/${path}`;

    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${baseUrl}?${searchParams}` : baseUrl;

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (![["host"], ["connection"], ["content-length"]].flat().includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const response = await fetch(fullUrl, {
      method,
      headers,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const backendForError = BACKEND_URL_RAW || "<unset>";
    const errorMessage =
      error instanceof Error
        ? `Backend upload proxy failed: ${error.message}. Backend URL: ${backendForError}`
        : "Backend upload proxy failed.";

    return NextResponse.json({ detail: errorMessage }, { status: 502 });
  }
}

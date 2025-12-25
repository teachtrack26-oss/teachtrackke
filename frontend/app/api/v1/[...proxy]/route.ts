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
      "Missing BACKEND_URL (or NEXT_PUBLIC_API_URL). Set it to your FastAPI base URL, e.g. https://api.example.com"
    );
  }
  return BACKEND_URL_RAW.replace(/\/+$/, "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, "DELETE");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, "PATCH");
}

async function proxyRequest(
  request: NextRequest,
  proxyPath: string[],
  method: string
) {
  try {
    const path = proxyPath.join("/");
    const url = `${getBackendUrl()}/api/v1/${path}`;

    // Get search params from original request
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    // Forward headers (excluding host and connection headers)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (
        ![
          "host",
          "connection",
          "content-length",
          // Avoid double-decompression issues when Node fetch auto-decodes gzip/br
          // but the proxy forwards the original Content-Encoding header.
          "accept-encoding",
        ].includes(key.toLowerCase())
      ) {
        headers.set(key, value);
      }
    });

    // Explicitly forward cookies from the incoming request
    const cookies = request.cookies.getAll();
    if (cookies.length > 0) {
      const cookieString = cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
      headers.set("cookie", cookieString);
    }

    // Forward the original request body stream without reading it to avoid
    // corrupting binary payloads (e.g., file uploads). Reading as text breaks
    // multipart/form-data and other binary formats.
    const body = ["POST", "PUT", "PATCH"].includes(method)
      ? (request.body as ReadableStream | null)
      : null;

    console.log(`[API Proxy] ${method} ${fullUrl}`);

    // Make request to backend; pass through body stream. The `duplex` hint is
    // required in some Node runtimes when streaming request bodies.
    const response = await fetch(fullUrl, {
      method,
      headers,
      // @ts-expect-error - duplex is needed for streamed bodies in Node fetch
      duplex: body ? "half" : undefined,
      body: body || undefined,
    });

    console.log(`[API Proxy] ${response.status} ${response.statusText}`);

    // Forward response as a stream without converting to text to preserve
    // binary content (PDFs, images, etc.). Also forward all headers.
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Skip set-cookie here - we'll handle it specially below
      const lower = key.toLowerCase();
      if (
        lower !== "set-cookie" &&
        // Let Next/Vercel compute these correctly for the (possibly decoded) body.
        lower !== "content-encoding" &&
        lower !== "content-length"
      ) {
        responseHeaders.set(key, value);
      }
    });

    // Handle set-cookie headers specially - they need getSetCookie() to get all values
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    const nextResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

    // Append each set-cookie header individually (append, not set, to preserve multiple cookies)
    for (const cookie of setCookieHeaders) {
      nextResponse.headers.append("set-cookie", cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error("[API Proxy] Error:", error);

    // Provide more helpful error messages
    const backendForError = BACKEND_URL_RAW || "<unset>";
    const errorMessage =
      error instanceof Error
        ? `Backend connection failed: ${error.message}. Backend URL: ${backendForError}`
        : "Backend connection failed. Make sure the backend server is running.";

    return NextResponse.json({ detail: errorMessage }, { status: 502 });
  }
}

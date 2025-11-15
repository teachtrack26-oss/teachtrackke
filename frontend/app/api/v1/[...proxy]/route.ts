import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    const url = `${BACKEND_URL}/api/v1/${path}`;

    // Get search params from original request
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    // Forward headers (excluding host and connection headers)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (
        !["host", "connection", "content-length"].includes(key.toLowerCase())
      ) {
        headers.set(key, value);
      }
    });

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
      responseHeaders.set(key, value);
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[API Proxy] Error:", error);

    // Provide more helpful error messages
    const errorMessage =
      error instanceof Error
        ? `Backend connection failed: ${error.message}. Make sure the backend server is running on ${BACKEND_URL}`
        : "Backend connection failed. Make sure the backend server is running.";

    return NextResponse.json({ detail: errorMessage }, { status: 502 });
  }
}

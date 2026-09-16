import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const targetPath = resolvedParams.path.join('/');
  try {
    const res = await fetch(`http://backend:8080/api/${targetPath}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend responded with ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to proxy to backend: ${String(e)}` },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const MOCK_API_URL = "https://6a02c2ba0d92f63dd2540420.mockapi.io/address";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    const payload = {
      latitude,
      longitude,
    };

    const response = await fetch(MOCK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error saving location:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save location" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(MOCK_API_URL);
    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_PATH = path.join(DATA_DIR, "personal-events.json");

export type PersonalEvent = {
  id: string;
  date: string;
  title: string;
  time?: string;
};

/** Per admin: { [adminId]: PersonalEvent[] } */
type Store = Record<string, PersonalEvent[]>;

function corsHeaders(origin: string | null) {
  const allow = origin ?? "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function readStore(): Store {
  try {
    if (existsSync(DATA_PATH)) {
      const raw = readFileSync(DATA_PATH, "utf-8");
      const data = JSON.parse(raw) as Store;
      return typeof data === "object" && data !== null ? data : {};
    }
  } catch {
    // ignore
  }
  return {};
}

function writeStore(store: Store) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("admin");

  if (!adminId) {
    return NextResponse.json(
      { error: "admin is required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const store = readStore();
  const events = Array.isArray(store[adminId]) ? store[adminId] : [];
  return NextResponse.json({ adminId, events }, {
    headers: corsHeaders(origin),
  });
}

export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  try {
    const body = await request.json();
    const adminId = body?.adminId;
    const events = body?.events;

    if (typeof adminId !== "string" || !adminId.trim()) {
      return NextResponse.json(
        { error: "adminId is required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: "events must be an array" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }
    const validated: PersonalEvent[] = events.filter(
      (e: unknown) =>
        e &&
        typeof e === "object" &&
        typeof (e as PersonalEvent).id === "string" &&
        typeof (e as PersonalEvent).date === "string" &&
        typeof (e as PersonalEvent).title === "string"
    );

    const store = readStore();
    store[adminId.trim()] = validated;
    writeStore(store);

    return NextResponse.json({ ok: true, adminId: adminId.trim(), events: validated }, {
      headers: corsHeaders(origin),
    });
  } catch (e) {
    console.error("PUT personal-events:", e);
    return NextResponse.json(
      { error: "Failed to save events" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

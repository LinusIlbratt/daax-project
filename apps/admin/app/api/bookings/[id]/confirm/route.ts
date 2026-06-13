import { NextResponse } from "next/server";
import { confirmBookingWithEmail } from "@/lib/bookings/confirm-booking";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { userHasAdminRole } from "@/lib/supabase/user-roles";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id: bookingId } = await context.params;

  if (!bookingId || typeof bookingId !== "string") {
    return NextResponse.json({ error: "Booking id is required" }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("bookings/confirm: auth", authError.message, authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await userHasAdminRole(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await confirmBookingWithEmail(supabase, bookingId);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      ok: true,
      bookingId: result.bookingId,
      emailSent: result.emailSent,
      emailSkippedReason: result.emailSkippedReason,
      emailError: result.emailError,
    });
  } catch (e) {
    console.error("bookings/confirm:POST", e);
    return NextResponse.json(
      { error: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}

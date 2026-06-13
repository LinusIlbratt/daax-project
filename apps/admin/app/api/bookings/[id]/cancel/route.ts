import { NextResponse } from "next/server";
import { cancelBookingWithStripe } from "@/lib/bookings/cancel-booking";
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
      console.error("bookings/cancel: auth", authError.message, authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await userHasAdminRole(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await cancelBookingWithStripe(supabase, bookingId);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      ok: true,
      bookingId: result.bookingId,
      paymentStatus: result.paymentStatus,
    });
  } catch (e) {
    console.error("bookings/cancel:POST", e);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

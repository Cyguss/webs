import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, tickets, ticketMessages, orders } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { rateLimit, rateLimitPresets, getClientIp, createRateLimitResponse } from "@/lib/rate-limit";
import { isUserActiveAdmin } from "@/lib/admin-gate";
import crypto from "crypto";

/**
 * Validates whether the caller has verified cryptographic or session rights to a ticket.
 * Zero Client Trust: Raw email strings alone NEVER grant authorization.
 */
async function verifyTicketAccess(
  ticket: any,
  providedSecret?: string | null,
  orderSecret?: string | null,
  session?: any
): Promise<boolean> {
  // 1. Authenticated user: Shop owner or Active Platform Admin
  if (session?.user?.id) {
    if (session.user.role === "superadmin" || (session.user.role === "admin" && session.user.adminPermissionsActive !== false)) {
      return true;
    }

    const userShop = await db.query.shops.findFirst({
      where: and(eq(shops.id, ticket.shopId), eq(shops.userId, session.user.id)),
    });
    if (userShop) return true;

    // Authenticated user whose verified account email strictly matches the ticket buyerEmail
    if (
      session.user.email &&
      session.user.email.toLowerCase().trim() === ticket.buyerEmail.toLowerCase().trim()
    ) {
      return true;
    }
  }

  // 2. Cryptographic Ticket Bearer Secret Check (SHA-256 constant-time comparison)
  if (providedSecret && ticket.accessSecretHash) {
    try {
      const computedHash = crypto.createHash("sha256").update(providedSecret.trim()).digest("hex");
      const hashBuf = Buffer.from(computedHash, "hex");
      const storedBuf = Buffer.from(ticket.accessSecretHash, "hex");
      if (hashBuf.length === storedBuf.length && crypto.timingSafeEqual(hashBuf, storedBuf)) {
        return true;
      }
    } catch {}
  }

  // 3. Cryptographic Linked Order Bearer Secret Check (if ticket was created against an order)
  const candidateOrderSecret = orderSecret || providedSecret;
  if (ticket.orderId && candidateOrderSecret) {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, ticket.orderId),
      });
      if (order) {
        const { verifyOrderSecret } = await import("@/lib/order-auth");
        const isOrderValid = verifyOrderSecret({
          orderId: order.id,
          buyerEmail: order.buyerEmail,
          providedSecret: candidateOrderSecret,
          storedSecretHash: order.accessSecretHash,
        });
        if (isOrderValid) return true;
      }
    } catch {}
  }

  return false;
}

// GET /api/tickets?ticketId=xxx or GET /api/tickets (for dashboard seller)
export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");
    const secret = searchParams.get("secret") || searchParams.get("ticketSecret");
    const orderSecret = searchParams.get("orderSecret");

    const session = await auth.api.getSession({
      headers: headersList,
    });

    // Case 1: Specific ticket detail request
    if (ticketId) {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, ticketId),
      });

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      // Zero-Trust Authorization Guard:
      // Requires cryptographic bearer secret, linked order secret, or verified authenticated session.
      // Unauthenticated email strings alone return 403 Forbidden.
      const isAuthorized = await verifyTicketAccess(ticket, secret, orderSecret, session);

      if (!isAuthorized) {
        return NextResponse.json(
          { error: "Access denied. Valid ticket access token or merchant session required." },
          { status: 403 }
        );
      }

      const messages = await db.query.ticketMessages.findMany({
        where: eq(ticketMessages.ticketId, ticketId),
        orderBy: [desc(ticketMessages.createdAt)],
      });

      return NextResponse.json({ success: true, ticket, messages });
    }

    // Case 2: Authenticated seller listing tickets for their shop
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { getActiveMerchantShop } = await import("@/lib/tenant");
    const shopId = searchParams.get("shopId");
    const userShop = await getActiveMerchantShop(session.user.id, shopId);

    if (!userShop) {
      return NextResponse.json({ tickets: [] });
    }

    const shopTickets = await db.query.tickets.findMany({
      where: eq(tickets.shopId, userShop.id),
      orderBy: [desc(tickets.createdAt)],
    });

    // Fetch latest message for each ticket
    const ticketListWithDetails = await Promise.all(
      shopTickets.map(async (t: any) => {
        const messages = await db.query.ticketMessages.findMany({
          where: eq(ticketMessages.ticketId, t.id),
          orderBy: [desc(ticketMessages.createdAt)],
          limit: 1,
        });
        return {
          ...t,
          lastMessage: messages[0]?.message || "",
        };
      })
    );

    return NextResponse.json({ success: true, tickets: ticketListWithDetails });
  } catch (err: any) {
    console.error("Error in GET /api/tickets:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST /api/tickets - Create ticket (buyer) or Post reply (buyer or seller)
export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    // Rate Limiting: Prevent spam ticket flooding and bot abuse
    const rateCheck = rateLimit({
      key: `ticket_post:${clientIp}`,
      ...rateLimitPresets.ticket,
    });
    if (!rateCheck.allowed) {
      return createRateLimitResponse(
        rateCheck,
        "Too many support requests. Please wait a moment before sending another message."
      );
    }

    const body = await req.json();
    const {
      action,
      ticketId,
      shopId,
      orderId,
      buyerEmail,
      subject,
      message,
      senderType,
      secret,
      ticketSecret,
      orderSecret,
    } = body;

    const session = await auth.api.getSession({
      headers: headersList,
    });

    // Case 1: Post reply to existing ticket
    if (action === "reply" && ticketId) {
      if (!message || !message.trim()) {
        return NextResponse.json({ error: "Message is required" }, { status: 400 });
      }

      const existingTicket = await db.query.tickets.findFirst({
        where: eq(tickets.id, ticketId),
      });

      if (!existingTicket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      // Authorization guard on reply
      if (senderType === "seller") {
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Seller authentication required." }, { status: 401 });
        }
        const { user: userTable } = await import("@/lib/db/schema");
        const currentDbUser = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) });
        const isActiveStaff = isUserActiveAdmin(currentDbUser);

        const userShop = await db.query.shops.findFirst({
          where: and(eq(shops.id, existingTicket.shopId), eq(shops.userId, session.user.id)),
        });
        if (!userShop && !isActiveStaff) {
          return NextResponse.json({ error: "Forbidden: You do not own this store." }, { status: 403 });
        }
      } else {
        // Buyer reply: Zero-Trust verification
        const providedSecret = secret || ticketSecret;
        const isAuthorized = await verifyTicketAccess(existingTicket, providedSecret, orderSecret, session);

        if (!isAuthorized) {
          return NextResponse.json(
            { error: "Access denied. Valid ticket access token or verified account session required to reply." },
            { status: 403 }
          );
        }
      }

      const msgId = crypto.randomUUID();
      await db.insert(ticketMessages).values({
        id: msgId,
        ticketId,
        senderType: senderType || "seller",
        message: message.trim(),
      });

      // Update ticket updated_at and status
      const newStatus = senderType === "seller" ? "answered" : "open";
      await db
        .update(tickets)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(tickets.id, ticketId));

      return NextResponse.json({ success: true, messageId: msgId });
    }

    // Case 2: Create new ticket
    let finalShopId = shopId;
    if (!finalShopId && orderId) {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      finalShopId = order.shopId;
    }

    if (!finalShopId || !buyerEmail || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields (shopId, buyerEmail, subject, message)" },
        { status: 400 }
      );
    }

    // Cryptographically secure ticket ID (CSPRNG, 16 hex chars)
    const newTicketId = "TICK-" + crypto.randomBytes(8).toString("hex").toUpperCase();
    const newMsgId = crypto.randomUUID();

    // Generate high-entropy 256-bit bearer secret for buyer ticket access
    const bearerSecret = crypto.randomBytes(32).toString("hex");
    const accessSecretHash = crypto.createHash("sha256").update(bearerSecret).digest("hex");

    await db.insert(tickets).values({
      id: newTicketId,
      shopId: finalShopId,
      orderId: orderId || null,
      buyerEmail: buyerEmail.trim().toLowerCase(),
      subject: subject.trim(),
      status: "open",
      priority: "normal",
      accessSecretHash,
    });

    await db.insert(ticketMessages).values({
      id: newMsgId,
      ticketId: newTicketId,
      senderType: "buyer",
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      ticketId: newTicketId,
      secret: bearerSecret,
    });
  } catch (err: any) {
    console.error("Error creating ticket:", err);
    return NextResponse.json({ error: err.message || "Failed to process ticket request" }, { status: 500 });
  }
}

// PATCH /api/tickets - Seller update status or priority (Protected with shop ownership verification)
export async function PATCH(req: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId, status, priority } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });
    }

    const existingTicket = await db.query.tickets.findFirst({
      where: eq(tickets.id, ticketId),
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { user: userTable } = await import("@/lib/db/schema");
    const currentDbUser = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) });
    const isActiveStaff = isUserActiveAdmin(currentDbUser);

    // Verify authenticated user owns the shop the ticket was submitted to, or is active admin
    const userShop = await db.query.shops.findFirst({
      where: and(eq(shops.id, existingTicket.shopId), eq(shops.userId, session.user.id)),
    });

    if (!userShop && !isActiveStaff) {
      return NextResponse.json({ error: "Access denied. You do not own this ticket." }, { status: 403 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    await db.update(tickets).set(updateData).where(eq(tickets.id, ticketId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update ticket" }, { status: 500 });
  }
}

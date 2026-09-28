import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, tickets, ticketMessages, orders } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { rateLimit, rateLimitPresets, getClientIp, createRateLimitResponse } from "@/lib/rate-limit";

// GET /api/tickets?ticketId=xxx or GET /api/tickets (for dashboard seller)
export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");
    const buyerEmail = searchParams.get("buyerEmail")?.trim().toLowerCase();

    const session = await auth.api.getSession({
      headers: headersList,
    });

    // If specific ticket request
    if (ticketId) {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, ticketId),
      });

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      // Authorization Guard:
      // Allow if:
      // 1. Authenticated user is the merchant who owns the shop
      // 2. Or buyerEmail matches ticket buyerEmail
      let isAuthorized = false;

      if (session?.user?.id) {
        const userShop = await db.query.shops.findFirst({
          where: and(eq(shops.id, ticket.shopId), eq(shops.userId, session.user.id)),
        });
        if (userShop) isAuthorized = true;
      }

      if (!isAuthorized && buyerEmail && buyerEmail === ticket.buyerEmail.toLowerCase()) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { error: "Access denied. Buyer email or store owner authentication required." },
          { status: 403 }
        );
      }

      const messages = await db.query.ticketMessages.findMany({
        where: eq(ticketMessages.ticketId, ticketId),
        orderBy: [desc(ticketMessages.createdAt)],
      });

      return NextResponse.json({ success: true, ticket, messages });
    }

    // Authenticated seller listing tickets for their shop
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userShop = await db.query.shops.findFirst({
      where: eq(shops.userId, session.user.id),
    });

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
    const { action, ticketId, shopId, orderId, buyerEmail, subject, message, senderType } = body;

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

      const session = await auth.api.getSession({
        headers: headersList,
      });

      // Authorization guard on reply
      if (senderType === "seller") {
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Seller authentication required." }, { status: 401 });
        }
        const userShop = await db.query.shops.findFirst({
          where: and(eq(shops.id, existingTicket.shopId), eq(shops.userId, session.user.id)),
        });
        if (!userShop) {
          return NextResponse.json({ error: "Forbidden: You do not own this store." }, { status: 403 });
        }
      } else {
        // Buyer reply: Verify email matches ticket
        if (!buyerEmail || buyerEmail.trim().toLowerCase() !== existingTicket.buyerEmail.toLowerCase()) {
          return NextResponse.json({ error: "Buyer email mismatch." }, { status: 403 });
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
      return NextResponse.json({ error: "Missing required fields (shopId, buyerEmail, subject, message)" }, { status: 400 });
    }

    const newTicketId = "TICK-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newMsgId = crypto.randomUUID();

    await db.insert(tickets).values({
      id: newTicketId,
      shopId: finalShopId,
      orderId: orderId || null,
      buyerEmail: buyerEmail.trim().toLowerCase(),
      subject: subject.trim(),
      status: "open",
      priority: "normal",
    });

    await db.insert(ticketMessages).values({
      id: newMsgId,
      ticketId: newTicketId,
      senderType: "buyer",
      message: message.trim(),
    });

    return NextResponse.json({ success: true, ticketId: newTicketId });
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

    // Verify authenticated user owns the shop the ticket was submitted to
    const userShop = await db.query.shops.findFirst({
      where: and(eq(shops.id, existingTicket.shopId), eq(shops.userId, session.user.id)),
    });

    if (!userShop) {
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

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerBalances, payoutRequests, balanceTransactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import PayoutClientModal from "./payout-client-modal";
import SettleButtonClient from "./settle-button-client";
import { Wallet, ArrowDownRight, Clock, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default async function EarningsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  // Get seller balance
  let balanceRecord = await db.query.sellerBalances.findFirst({
    where: eq(sellerBalances.userId, session.user.id),
  });

  if (!balanceRecord) {
    // Initialize balance
    const newBalId = crypto.randomUUID();
    await db
      .insert(sellerBalances)
      .values({
        id: newBalId,
        userId: session.user.id,
        availableBalance: "0.00",
        pendingBalance: "0.00",
        totalEarned: "0.00",
        totalWithdrawn: "0.00",
      });
    const [fetchedBal] = await db
      .select()
      .from(sellerBalances)
      .where(eq(sellerBalances.id, newBalId))
      .limit(1);
    balanceRecord = fetchedBal;
  }

  // Fetch payout requests
  const userPayouts = await db
    .select()
    .from(payoutRequests)
    .where(eq(payoutRequests.userId, session.user.id))
    .orderBy(desc(payoutRequests.createdAt));

  // Fetch ledger transactions
  const userTxs = await db
    .select()
    .from(balanceTransactions)
    .where(eq(balanceTransactions.userId, session.user.id))
    .orderBy(desc(balanceTransactions.createdAt));

  const available = parseFloat(balanceRecord?.availableBalance || "0");
  const pending = parseFloat(balanceRecord?.pendingBalance || "0");
  const totalEarned = parseFloat(balanceRecord?.totalEarned || "0");
  const totalWithdrawn = parseFloat(balanceRecord?.totalWithdrawn || "0");

  return (
    <div className="page-fly-in" style={{ maxWidth: 1240, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
            Earnings & Wallet Payouts
          </h1>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginTop: 4 }}>
            Manage your store revenue balance and request instant crypto withdrawals.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <SettleButtonClient pendingAmount={pending} />
          <PayoutClientModal availableBalance={available} />
        </div>
      </div>

      {/* Balance Grid */}
      <div className="stat-grid" style={{ marginBottom: 36 }}>
        <div className="card" style={{ background: "linear-gradient(135deg, var(--color-primary-subtle), var(--card-bg))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-muted-foreground)", fontSize: 13, fontWeight: 600 }}>
            <Wallet size={16} color="var(--color-primary-light)" /> Available Balance
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", marginTop: 12 }}>
            ${available.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4 }}>
            Ready for instant payout request
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-muted-foreground)", fontSize: 13, fontWeight: 600 }}>
            <Clock size={16} color="var(--color-warning)" /> Pending Balance
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", marginTop: 12 }}>
            ${pending.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4 }}>
            In 7-day chargeback hold window
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-muted-foreground)", fontSize: 13, fontWeight: 600 }}>
            <ShieldCheck size={16} color="var(--color-success)" /> Lifetime Earned
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", marginTop: 12 }}>
            ${totalEarned.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4 }}>
            Gross revenue processed
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-muted-foreground)", fontSize: 13, fontWeight: 600 }}>
            <ArrowDownRight size={16} color="var(--color-primary)" /> Total Withdrawn
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-foreground)", marginTop: 12 }}>
            ${totalWithdrawn.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4 }}>
            Paid out to your crypto wallet
          </div>
        </div>
      </div>

      {/* Payout History Section */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--color-foreground)" }}>
          Payout Requests
        </h2>

        {userPayouts.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--color-muted-foreground)", fontSize: 14 }}>
            No payout requests made yet. When you request a withdrawal, its status will be tracked here.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Requested</th>
                  <th>Method</th>
                  <th>Destination</th>
                  <th>Fee (5%)</th>
                  <th>Net Sent</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {userPayouts.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>${parseFloat(p.amountRequested).toFixed(2)}</td>
                    <td style={{ textTransform: "uppercase", fontSize: 12, fontWeight: 600 }}>{p.method}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{p.destinationAddress}</td>
                    <td style={{ color: "var(--color-muted-foreground)" }}>${parseFloat(p.feeAmount).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: "var(--color-success)" }}>${parseFloat(p.amountSent).toFixed(2)}</td>
                    <td>
                      {p.status === "completed" ? (
                        <span className="badge badge-success"><span className="badge-dot" /> Completed</span>
                      ) : p.status === "pending" ? (
                        <span className="badge badge-warning"><span className="badge-dot" /> Pending</span>
                      ) : (
                        <span className="badge badge-danger"><span className="badge-dot" /> {p.status}</span>
                      )}
                    </td>
                    <td style={{ color: "var(--color-muted-foreground)", fontSize: 13 }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ledger Section */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--color-foreground)" }}>
          Transaction Ledger
        </h2>

        {userTxs.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--color-muted-foreground)", fontSize: 14 }}>
            No balance transactions recorded yet.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Platform Fee</th>
                  <th>Net Impact</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {userTxs.map((tx: any) => {
                  const net = parseFloat(tx.netAmount);
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span className={`badge ${tx.type === "sale" ? "badge-success" : tx.type === "payout" ? "badge-primary" : "badge-secondary"}`}>
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ color: "var(--color-foreground)" }}>{tx.description || "-"}</td>
                      <td style={{ fontWeight: 600 }}>${parseFloat(tx.amount).toFixed(2)}</td>
                      <td style={{ color: "var(--color-muted-foreground)" }}>${parseFloat(tx.feeAmount).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: net >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}
                      </td>
                      <td style={{ color: "var(--color-muted-foreground)", fontSize: 13 }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

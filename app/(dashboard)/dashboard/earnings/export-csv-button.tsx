"use client";

import { Download } from "lucide-react";

interface TransactionItem {
  id: string;
  type: string;
  description: string | null;
  amount: string;
  feeAmount: string;
  netAmount: string;
  createdAt: Date | string;
}

export default function ExportCsvButton({ transactions }: { transactions: TransactionItem[] }) {
  const handleExport = () => {
    if (!transactions || transactions.length === 0) return;

    const headers = ["ID", "Type", "Description", "Gross Amount (USD)", "Fees (Platform + Processing) (USD)", "Net Amount (USD)", "Date"];
    const rows = transactions.map((t) => [
      `"${t.id}"`,
      `"${t.type}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      parseFloat(t.amount).toFixed(2),
      parseFloat(t.feeAmount).toFixed(2),
      parseFloat(t.netAmount).toFixed(2),
      `"${new Date(t.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vaultly_statement_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!transactions || transactions.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      type="button"
      className="btn btn-secondary"
      style={{
        fontSize: 12,
        padding: "6px 12px",
        gap: 6,
        display: "inline-flex",
        alignItems: "center",
      }}
      title="Download Ledger Statement as CSV"
    >
      <Download size={14} /> Export CSV
    </button>
  );
}

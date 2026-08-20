import { supabase } from "./supabase";

export type EftPaymentDetail = {
  payment: {
    id: string;
    purpose: "store_order" | "growth_subscription" | "nexdocs_subscription";
    reference: string;
    amount: number;
    currency: "ZAR";
    status: "awaiting_payment" | "proof_submitted" | "approved" | "rejected" | "expired" | "cancelled";
    expiresAt: string;
    submittedAt: string | null;
    reviewerNote: string | null;
  };
  instructions: {
    accountHolder: string;
    bankName: string;
    accountType: string;
    accountNumber: string;
    branchCode: string;
    exactAmount: number;
    currency: "ZAR";
    reference: string;
    instruction: string;
  };
};

function message(error: unknown, data: unknown, fallback: string) {
  const remote = data as { error?: unknown } | null;
  if (typeof remote?.error === "string" && remote.error) return remote.error;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function startNexDocsEftPayment(clientRequestId: string): Promise<EftPaymentDetail> {
  const { data, error } = await supabase.functions.invoke("eft-payments", {
    body: { action: "start_nexdocs_subscription", clientRequestId },
  });
  if (error || !data) throw new Error(message(error, data, "NexDocs EFT payment is currently unavailable."));
  return data as EftPaymentDetail;
}

export async function listNexDocsEftPayments(): Promise<EftPaymentDetail[]> {
  const { data, error } = await supabase.functions.invoke("eft-payments", {
    body: { action: "list_my_payments" },
  });
  if (error || !data) throw new Error(message(error, data, "Your payment history could not be loaded."));
  return ((data as { payments?: EftPaymentDetail[] }).payments ?? []).filter(
    (entry) => entry.payment.purpose === "nexdocs_subscription",
  );
}

export async function submitNexDocsEftProof(input: {
  paymentId: string;
  proof: File;
  payerNote: string;
}): Promise<{ payment: EftPaymentDetail["payment"]; message: string }> {
  const body = new FormData();
  body.set("paymentId", input.paymentId);
  body.set("proof", input.proof);
  body.set("payerNote", input.payerNote);
  const { data, error } = await supabase.functions.invoke("eft-payments", { body });
  if (error || !data) throw new Error(message(error, data, "Your proof of payment could not be submitted."));
  return data as { payment: EftPaymentDetail["payment"]; message: string };
}

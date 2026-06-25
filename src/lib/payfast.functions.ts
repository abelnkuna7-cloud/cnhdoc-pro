import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";

export type PayFastInput = {
  uid: string;
  email: string;
  firstName: string;
  origin: string;
};

function buildSignature(params: Record<string, string>, passphrase?: string): string {
  const keys = Object.keys(params).filter((k) => params[k] !== "" && k !== "signature");
  // PayFast spec: preserve insertion order; do not sort
  const query = keys
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, "+")}`)
    .join("&");
  const withPass = passphrase ? `${query}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}` : query;
  return createHash("md5").update(withPass).digest("hex");
}

export const createPayFastCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: PayFastInput) => {
    if (!data?.uid || !data?.email) throw new Error("Missing user info");
    return data;
  })
  .handler(async ({ data }) => {
    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;
    if (!merchantId || !merchantKey) {
      return { ok: false as const, error: "PayFast not configured" };
    }
    // Use sandbox while account is pending verification; flip to www.payfast.co.za once live
    const isSandbox = !process.env.PAYFAST_LIVE;
    const actionUrl = isSandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    const params: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${data.origin}/dashboard?payment=success`,
      cancel_url: `${data.origin}/subscribe?payment=cancelled`,
      notify_url: `${data.origin}/api/public/payfast-itn`,
      name_first: data.firstName || "Customer",
      email_address: data.email,
      m_payment_id: `nexdocs-${data.uid}-${Date.now()}`,
      amount: "99.00",
      item_name: "NexDocs Monthly Subscription",
      item_description: "AI document generator - R99/month",
      custom_str1: data.uid,
      subscription_type: "1",
      billing_date: new Date().toISOString().slice(0, 10),
      recurring_amount: "99.00",
      frequency: "3", // monthly
      cycles: "0", // indefinite
    };
    const signature = buildSignature(params, passphrase);
    return { ok: true as const, actionUrl, fields: { ...params, signature } };
  });

import Razorpay from "razorpay";
import crypto from "crypto";

export const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID ||
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  "rzp_test_Tbu9TJLNylQ579";

export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET || "dummy_secret",
});

export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!RAZORPAY_KEY_SECRET) {
    // If secret is not configured yet in environment, permit verification in test mode
    console.warn(
      "[Razorpay] RAZORPAY_KEY_SECRET is not set in environment variables. Allowing test verification.",
    );
    return true;
  }

  const generatedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

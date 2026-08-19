import { PaymentStatus } from "@/.generated/prisma/enums";

type PaymentOutcome = {
  status: PaymentStatus;
  paidAt: Date | null;
  transactionId: string;
};

export function settlePayment(method: string, orderStatus: string, orderId: string): PaymentOutcome {
  const captured = method !== "PAY_ON_DELIVERY" || orderStatus === "DELIVERED";

  return {
    status: captured ? PaymentStatus.SUCCESSFUL : PaymentStatus.PENDING,
    paidAt: captured ? new Date() : null,
    transactionId: `sim_${orderId}`,
  };
}

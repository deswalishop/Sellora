import { formatRs } from "@/lib/format";

/** Normalize a PK mobile to wa.me format (92…). */
export function toWaNumber(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("92")) return d;
  if (d.startsWith("0")) return "92" + d.slice(1);
  return d;
}

/** Prefilled WhatsApp templates per order event (D2: wa.me links, no API). */
export function waTemplate(
  kind: "confirmed" | "shipped" | "delivered" | "payment" | "custom",
  vars: { customerName: string; orderNumber: string; storeName: string; total: string }
): string {
  const { customerName, orderNumber, storeName, total } = vars;
  const first = customerName.split(" ")[0];
  switch (kind) {
    case "confirmed":
      return `Assalam-o-Alaikum ${first}! Your order ${orderNumber} from ${storeName} is confirmed and being packed. Total: ${total}. We'll update you when it ships. Thank you for shopping with us!`;
    case "shipped":
      return `Good news ${first}! Your order ${orderNumber} from ${storeName} has been shipped and is on its way. Total: ${total} (pay on delivery). Track it here: ask us anytime on WhatsApp.`;
    case "delivered":
      return `Assalam-o-Alaikum ${first}! Your order ${orderNumber} from ${storeName} has been delivered. Hope you love it! Please reply with a photo/review — it means a lot to our small business.`;
    case "payment":
      return `Assalam-o-Alaikum ${first}! This is ${storeName} regarding your order ${orderNumber} (${total}). Please share your payment screenshot here so we can dispatch your order quickly. Thank you!`;
    default:
      return `Assalam-o-Alaikum ${first}! This is ${storeName} regarding your order ${orderNumber}.`;
  }
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(text)}`;
}

export { formatRs };

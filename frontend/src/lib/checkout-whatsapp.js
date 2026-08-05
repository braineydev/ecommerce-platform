function buildCheckoutWhatsAppMessage({ cart = [], formData = {}, total = 0 }) {
  const items = cart.length
    ? cart.map(item => `- ${item.name} × ${item.quantity}`).join("\n")
    : "- No items selected";

  return [
    "Hello, I would like to place an order.",
    "",
    "Order Items:",
    items,
    "",
    `Customer Name: ${formData.fullName || "Not provided"}`,
    "",
    `Delivery Address: ${formData.address || "Not provided"}`,
    "",
    `WhatsApp Number: ${formData.phoneNumber || "Not provided"}`,
    "",
    `Additional Notes: ${formData.notes || "None"}`,
    "",
    `Order Total: Ksh. ${Number(total || 0).toLocaleString()}`,
    "",
    "Kindly confirm my order and the delivery arrangements. Thank you.",
  ].join("\n");
}

export default buildCheckoutWhatsAppMessage;
export { buildCheckoutWhatsAppMessage };

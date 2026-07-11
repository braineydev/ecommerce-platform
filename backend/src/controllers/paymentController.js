const supabase = require("../config/supabase");

// Customer action: submit M-Pesa code
exports.submitPayment = async (req, res) => {
  const userId = req.user.id;
  const { order_id, mpesa_reference } = req.body;

  if (!order_id || !mpesa_reference) {
    return res
      .status(400)
      .json({ error: "Order ID and M-Pesa reference are required" });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", order_id)
    .eq("profile_id", userId)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: "Order not found or unauthorized" });
  }

  if (order.status !== "pending") {
    return res.status(400).json({ error: "Order is no longer pending" });
  }

  const { data, error } = await supabase
    .from("payments")
    .insert([
      {
        order_id,
        mpesa_reference: mpesa_reference.toUpperCase(),
        status: "pending",
      },
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({
    message: "Payment reference submitted successfully!",
    payment: data,
  });
};

// Admin action: verify payment
exports.verifyPayment = async (req, res) => {
  const adminId = req.user.id;
  const { payment_id } = req.body;

  if (!payment_id) {
    return res.status(400).json({ error: "Payment ID is required" });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", adminId)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .update({ status: "verified", verified_by: adminId })
    .eq("id", payment_id)
    .select()
    .single();

  if (paymentError)
    return res.status(500).json({ error: paymentError.message });

  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: "processing" })
    .eq("id", payment.order_id);

  if (orderError) return res.status(500).json({ error: orderError.message });

  res.status(200).json({
    message: "Payment verified! Order is now processing.",
    payment,
  });
};

const supabase = require("../config/supabase");

const normalizeCustomer = (customer, email) => ({
  ...customer,
  email:
    email ||
    customer.email ||
    customer.email_address ||
    customer.user_email ||
    "-",
});

const getCustomerEmailMap = async () => {
  const emails = new Map();
  let page = 1;

  // Auth owns email addresses; profiles holds only application profile data.
  // Fetch every page so the customer list remains accurate as it grows.
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    for (const user of data.users || []) emails.set(user.id, user.email || "");
    if (!data.nextPage) break;
    page = data.nextPage;
  }
  return emails;
};

const getAllCustomers = async (req, res) => {
  try {
    const { data: customers, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const emails = await getCustomerEmailMap();
    res.status(200).json({
      customers: (customers || []).map(customer =>
        normalizeCustomer(customer, emails.get(customer.id)),
      ),
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  const { customer_id } = req.params;
  const { full_name, phone, role } = req.body;
  const validRoles = ["customer", "admin"];
  const normalizedFullName =
    typeof full_name === "string" ? full_name.trim() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : null;

  if (role && !validRoles.includes(role))
    return res.status(400).json({ error: "Invalid role provided" });
  if (!normalizedFullName || normalizedFullName.length > 100)
    return res
      .status(400)
      .json({
        error: "A customer name between 1 and 100 characters is required",
      });
  if (normalizedPhone !== null && normalizedPhone.length > 30)
    return res
      .status(400)
      .json({ error: "Phone number must be at most 30 characters" });
  if (customer_id === req.user?.id && role && role !== "admin")
    return res
      .status(400)
      .json({ error: "You cannot remove your own administrator access." });

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: normalizedFullName,
        phone: normalizedPhone || null,
        ...(role ? { role } : {}),
      })
      .eq("id", customer_id)
      .select("id, full_name, phone, role, created_at");

    if (error) throw error;
    const customer = Array.isArray(data) ? data[0] : data;
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const { data: authData, error: authError } =
      await supabase.auth.admin.getUserById(customer.id);
    if (authError) throw authError;
    res.status(200).json({
      message: "Customer updated successfully",
      customer: normalizeCustomer(customer, authData.user?.email),
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  const { customer_id } = req.params;
  if (customer_id === req.user?.id)
    return res
      .status(400)
      .json({ error: "You cannot delete your own administrator account." });

  try {
    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", customer_id)
      .single();
    if (customerError || !customer)
      return res.status(404).json({ error: "Customer not found" });
    if (customer.role === "admin")
      return res
        .status(403)
        .json({ error: "Administrator accounts cannot be deleted here." });

    const { error } = await supabase.auth.admin.deleteUser(customer_id);
    if (error) throw error;
    res.status(200).json({ message: "Customer account deleted", customer_id });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res
      .status(500)
      .json({ error: error.message || "Unable to delete customer" });
  }
};

module.exports = { getAllCustomers, updateCustomer, deleteCustomer };

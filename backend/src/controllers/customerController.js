const supabase = require("../config/supabase");

const getAllCustomers = async (req, res) => {
  try {
    const { data: customers, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const normalizedCustomers = (customers || []).map(customer => ({
      ...customer,
      email:
        customer.email || customer.email_address || customer.user_email || "—",
    }));

    res.status(200).json({ customers: normalizedCustomers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  const { customer_id } = req.params;
  const { full_name, phone, role } = req.body;

  const validRoles = ["customer", "admin"];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role provided" });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name, phone, role })
      .eq("id", customer_id)
      .select("id, full_name, phone, role, created_at");

    if (error) throw error;
    const customer = Array.isArray(data) ? data[0] : data;
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    res
      .status(200)
      .json({ message: "Customer updated successfully", customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  const { customer_id } = req.params;

  if (customer_id === req.user?.id) {
    return res.status(400).json({ error: "You cannot delete your own administrator account." });
  }

  try {
    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", customer_id)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    if (customer.role === "admin") {
      return res.status(403).json({ error: "Administrator accounts cannot be deleted here." });
    }

    const { error } = await supabase.auth.admin.deleteUser(customer_id);
    if (error) throw error;

    res.status(200).json({ message: "Customer account deleted", customer_id });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: error.message || "Unable to delete customer" });
  }
};

module.exports = { getAllCustomers, updateCustomer, deleteCustomer };

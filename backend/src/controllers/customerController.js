const supabase = require("../config/supabase");

const getAllCustomers = async (req, res) => {
  try {
    const { data: customers, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) {
      throw error;
    }

    res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllCustomers };

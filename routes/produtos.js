const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

router.get("/produtos", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  res.json(data);
});

router.get("/produtos/:slug", async (req, res) => {
  const { slug } = req.params;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    return res.status(404).json({ erro: "Produto não encontrado." });
  }

  res.json(data);
});

module.exports = router;
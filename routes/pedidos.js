const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

router.post("/pedido", async (req, res) => {
  try {
    const { nome, produto, endereco } = req.body;

    if (!nome || !produto) {
      return res.status(400).json({ erro: "Dados incompletos." });
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          full_name: nome,
          email: "sem-email@temporario.com",
          street: endereco || "",
          status: "pending",
          subtotal: 0,
          shipping_fee: 0,
          discount: 0,
          total: 0
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ erro: error.message });
    }

    res.status(201).json({
      mensagem: "Pedido criado com sucesso!",
      pedido: data[0]
    });
  } catch {
    res.status(500).json({ erro: "Erro ao criar pedido." });
  }
});

router.get("/pedidos", async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  res.json(data);
});

module.exports = router;
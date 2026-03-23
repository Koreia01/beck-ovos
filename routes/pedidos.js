const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

router.post("/checkout", async (req, res) => {
  try {
    const {
      userId,
      nomeCompleto,
      email,
      telefone,
      cpf,
      cep,
      rua,
      numero,
      complemento,
      shippingFee,
      discount,
      itens
    } = req.body;

    if (
      !nomeCompleto ||
      !email ||
      !telefone ||
      !cpf ||
      !cep ||
      !rua ||
      !numero ||
      !itens ||
      !Array.isArray(itens) ||
      itens.length === 0
    ) {
      return res.status(400).json({ erro: "Dados do checkout incompletos." });
    }

    const productIds = itens.map((item) => item.productId);

    const { data: produtosDb, error: produtosError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (produtosError) {
      return res.status(400).json({ erro: produtosError.message });
    }

    let subtotal = 0;
    const itensPedido = [];

    for (const item of itens) {
      const produto = produtosDb.find((p) => p.id === item.productId);

      if (!produto) {
        return res.status(400).json({ erro: `Produto não encontrado: ${item.productId}` });
      }

      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(produto.price);
      const lineTotal = quantity * unitPrice;

      subtotal += lineTotal;

      itensPedido.push({
        product_id: produto.id,
        product_name: produto.name,
        unit_price: unitPrice,
        quantity,
        line_total: lineTotal
      });
    }

    const frete = Number(shippingFee || 0);
    const desconto = Number(discount || 0);
    const total = subtotal + frete - desconto;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId || null,
          full_name: nomeCompleto,
          email,
          cpf,
          phone: telefone,
          cep,
          street: rua,
          number: numero,
          complement: complemento || "",
          status: "awaiting_payment",
          subtotal,
          shipping_fee: frete,
          discount: desconto,
          total
        }
      ])
      .select()
      .single();

    if (orderError) {
      return res.status(400).json({ erro: orderError.message });
    }

    const itensComOrderId = itensPedido.map((item) => ({
      ...item,
      order_id: orderData.id
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itensComOrderId);

    if (itemsError) {
      return res.status(400).json({ erro: itemsError.message });
    }

    return res.status(201).json({
      mensagem: "Pedido criado com sucesso!",
      pedido: orderData
    });
  } catch (error) {
    return res.status(500).json({ erro: "Erro interno ao criar checkout." });
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
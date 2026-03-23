const express = require("express");
const axios = require("axios");
const supabase = require("../lib/supabase");

const router = express.Router();

router.post("/criar-pix", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ erro: "orderId é obrigatório." });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      return res.status(400).json({ erro: itemsError.message });
    }

    const identifier = `pedido_${Date.now()}`;

    const products = orderItems.map((item) => ({
      id: item.product_id || item.id,
      name: item.product_name,
      quantity: item.quantity,
      price: Number(item.unit_price),
      physical: true
    }));

    const body = {
      identifier,
      amount: Number(order.total),
      shippingFee: Number(order.shipping_fee || 0),
      extraFee: 0,
      discount: Number(order.discount || 0),
      client: {
        name: order.full_name,
        email: order.email,
        phone: order.phone,
        document: order.cpf
      },
      products,
      metadata: {
        origem: "site ovos de pascoa",
        orderId: order.id
      },
      callbackUrl: `${process.env.BASE_URL}/api/callback/sigilo-pay`
    };

    console.log("ORDER ITEMS:", orderItems);
    console.log("BODY ENVIADO PARA SIGILO:", body);


    const response = await axios.post(
      "https://app.sigilopay.com.br/api/v1/gateway/pix/receive",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "x-public-key": process.env.SIGILO_PAY_PUBLIC_KEY,
          "x-secret-key": process.env.SIGILO_PAY_SECRET_KEY
        }
      }
    );

    const data = response.data;

    const { data: paymentSaved, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          order_id: order.id,
          provider: "sigilo_pay",
          provider_transaction_id: data.transactionId,
          identifier,
          status: data.status,
          amount: Number(order.total),
          fee: data.fee || 0,
          pix_code: data.pix?.code || null,
          pix_qr_base64: data.pix?.base64 || null,
          pix_qr_image_url: data.pix?.image || null,
          raw_response: data
        }
      ])
      .select()
      .single();

    if (paymentError) {
      return res.status(400).json({
        erro: "Erro ao salvar pagamento.",
        detalhes: paymentError.message
      });
    }

    return res.status(201).json({
      mensagem: "Pagamento Pix criado com sucesso!",
      pagamento: paymentSaved
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      erro: "Não foi possível criar o pagamento Pix.",
      detalhes: error.response?.data || error.message
    });
  }
});

router.post("/callback/sigilo-pay", async (req, res) => {
  try {
    const payload = req.body;
    const transactionId = payload.transactionId;
    const status = payload.status;

    const { data: pagamento } = await supabase
      .from("payments")
      .select("*")
      .eq("provider_transaction_id", transactionId)
      .single();

    if (pagamento) {
      await supabase
        .from("payments")
        .update({
          status,
          raw_response: payload
        })
        .eq("id", pagamento.id);

      let novoStatusPedido = "awaiting_payment";

      if (status === "OK" || status === "PAID" || status === "APPROVED") {
        novoStatusPedido = "paid";
      } else if (status === "CANCELED" || status === "FAILED" || status === "REJECTED") {
        novoStatusPedido = "canceled";
      }

      await supabase
        .from("orders")
        .update({
          status: novoStatusPedido
        })
        .eq("id", pagamento.order_id);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao processar callback." });
  }
});

router.get("/pagamentos", async (req, res) => {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  res.json(data);
});

module.exports = router;
const express = require("express");
const axios = require("axios");
const supabase = require("../lib/supabase");

const router = express.Router();

router.post("/criar-pix", async (req, res) => {
  try {
    const {
      nomeCompleto,
      email,
      telefone,
      cpf,
      cep,
      rua,
      numero,
      complemento,
      produtos,
      amount,
      shippingFee,
      extraFee,
      discount
    } = req.body;

    if (
      !nomeCompleto ||
      !email ||
      !telefone ||
      !cpf ||
      !cep ||
      !rua ||
      !numero ||
      !produtos ||
      !amount
    ) {
      return res.status(400).json({
        erro: "Preencha todos os campos obrigatórios."
      });
    }

    const identifier = `pedido_${Date.now()}`;

    const body = {
      identifier,
      amount: Number(amount),
      shippingFee: Number(shippingFee || 0),
      extraFee: Number(extraFee || 0),
      discount: Number(discount || 0),
      client: {
        name: nomeCompleto,
        email,
        phone: telefone,
        document: cpf
      },
      products: produtos,
      metadata: {
        origem: "site ovos de pascoa",
        identifier
      },
      callbackUrl: `${process.env.BASE_URL}/api/callback/sigilo-pay`
    };

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
          order_id: null,
          provider: "sigilo_pay",
          provider_transaction_id: data.transactionId,
          identifier,
          status: data.status,
          amount: Number(amount),
          fee: data.fee || 0,
          pix_code: data.pix?.code || null,
          pix_qr_base64: data.pix?.base64 || null,
          pix_qr_image_url: data.pix?.image || null,
          raw_response: data
        }
      ])
      .select();

    if (paymentError) {
      return res.status(400).json({
        erro: "Erro ao salvar pagamento.",
        detalhes: paymentError.message
      });
    }

    return res.status(201).json({
      mensagem: "Pagamento Pix criado com sucesso!",
      pagamento: paymentSaved[0]
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
    }

    return res.status(200).json({ ok: true });
  } catch {
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
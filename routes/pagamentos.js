const express = require("express");
const axios = require("axios");
const router = express.Router();

let pagamentos = [];

// Criar pagamento Pix real na Sigilo Pay
router.post("/criar-pix", async (req, res) => {
  console.log("Recebeu requisição para criar pagamento Pix:", req.body);

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

    const novoPagamento = {
      id: pagamentos.length + 1,
      identifier,
      nomeCompleto,
      email,
      telefone,
      cpf,
      endereco: {
        cep,
        rua,
        numero,
        complemento: complemento || ""
      },
      produtos,
      amount: Number(amount),
      shippingFee: Number(shippingFee || 0),
      extraFee: Number(extraFee || 0),
      discount: Number(discount || 0),
      transactionId: data.transactionId,
      status: data.status,
      fee: data.fee || 0,
      order: data.order || null,
      pix: data.pix || null,
      details: data.details || null,
      criadoEm: new Date()
    };

    pagamentos.push(novoPagamento);

    return res.status(201).json({
      mensagem: "Pagamento Pix criado com sucesso!",
      pagamento: novoPagamento
    });
  } catch (error) {
    console.error(
      "Erro ao criar pagamento Pix:",
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 500).json({
      erro: "Não foi possível criar o pagamento Pix.",
      detalhes: error.response?.data || error.message
    });
  }
});

// Callback da Sigilo Pay
router.post("/callback/sigilo-pay", (req, res) => {
  try {
    const payload = req.body;

    const transactionId = payload.transactionId;
    const status = payload.status;

    const pagamento = pagamentos.find(
      (item) => item.transactionId === transactionId
    );

    if (pagamento) {
      pagamento.status = status;
      pagamento.callbackRecebidoEm = new Date();
      pagamento.callbackPayload = payload;
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro no callback:", error.message);

    return res.status(500).json({
      erro: "Erro ao processar callback."
    });
  }
});

// Listar pagamentos
router.get("/pagamentos", (req, res) => {
  res.json(pagamentos);
});

module.exports = router;
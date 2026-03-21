const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pedidosRoutes = require("./routes/pedidos");
const authRoutes = require("./routes/auth");

app.use("/api", pedidosRoutes);
app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send("Backend rodando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
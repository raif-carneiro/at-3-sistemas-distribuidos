const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const protobuf = require("protobufjs");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");

var VoteArray = [];
let Data;
let Item;

protobuf.load("data.proto", (err, root) => {
  if (err) {
    throw err;
  }
  Data = root.lookupType("default.Data");
  Item = root.lookupType("default.Item");
});

// Configuração do Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Exemplo",
      version: "1.0.0",
      description: "Documentação da API de exemplo usando Swagger",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],
  },
  apis: ["./server.js"], // Caminho para seus arquivos de documentação
};

const specs = swaggerJsdoc(options);

// Middleware para servir a documentação Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(cors());

app.use(bodyParser.json());

app.use(express.json());

//Rota Proto buffer
app.get("/moedas", async (req, res) => {
  const response = await getAssets();
  const items = [];
  response.data.forEach((item) =>
    items.push(
      Item.create({
        id: item.id,
        name: item.name,
        priceUsd: item.priceUsd,
        link: item.explorer,
      })
    )
  );
  const itemList = Data.create({ items });
  const buffer = Data.encode(itemList).finish();
  console.log(Data.decode(buffer));
  // Envia o buffer codificado como resposta
  res.set("Content-Type", "application/x-protobuf");
  res.send(buffer);
});

//remover voto
app.delete("/vote", (req, res) => {
  const { id } = req.body;
  VoteArray = removeItemById(VoteArray, id);
  res.json({ message: " Voto removido" });
});

app.get("/vote", (req, res) => {
  res.json(VoteArray);
});

app.post("/vote", (req, res) => {
  const { name, currency } = req.body;
  VoteArray.push({
    id: name,
    name: name,
    currency: currency,
  });

  res.json({
    id: name,
    name: name,
    currency: currency,
    message: "Voto cadastrado com sucesso",
  });
});

app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});

async function getAssets() {
  const data = await fetch("https://api.coincap.io/v2/assets");
  const response = await data.json();
  return response;
}

function removeItemById(array, idToRemove) {
  return array.filter((item) => item.id !== idToRemove);
}

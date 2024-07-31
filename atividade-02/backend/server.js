const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const xml2js = require("xml2js");
const protobuf = require("protobufjs");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");

var VoteArray = [];
let Data;
let Item;

// Configuração do proto buffer
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
  //Consulta Api externa
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
  // Envia o buffer codificado como resposta
  res.set("Content-Type", "application/x-protobuf");
  res.send(buffer);
});

//remover voto
app.delete("/vote", (req, res) => {
  const type_out = req.body.type_out || "json";
  const { id } = req.body;

  VoteArray = removeItemById(VoteArray, id);

  const responseObject = { message: "Voto removido" };

  if (type_out === "xml") {
    // Convert  to XML format
    const builder = new xml2js.Builder({
      rootName: "response",
      headless: true,
    });
    const xml = builder.buildObject(responseObject);

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } else {
    // Default to JSON format
    res.json(responseObject);
  }
});

app.get("/vote", (req, res) => {
  const type_out = req.body.type_out || "json";
  if (type_out === "xml") {
    // Convert VoteArray to XML format
    const builder = new xml2js.Builder({ rootName: "votes", headless: true });
    const xml = builder.buildObject({ vote: VoteArray });

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } else {
    // Default to JSON format
    res.json(VoteArray);
  }
});

app.post("/vote", (req, res) => {
  const type_out = req.body.type_out || "json";
  const { name, currency } = req.body;

  // Add new vote to the array
  VoteArray.push({
    id: name,
    name: name,
    currency: currency,
  });

  // Response object
  const responseObject = {
    id: name,
    name: name,
    currency: currency,
    message: "Voto cadastrado com sucesso",
  };

  if (type_out === "xml") {
    // Convert responseObject to XML format
    const builder = new xml2js.Builder({
      rootName: "response",
      headless: true,
    });
    const xml = builder.buildObject(responseObject);

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } else {
    // Default to JSON format
    res.json(responseObject);
  }
});

app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});

//Consulta Api externa
async function getAssets() {
  const data = await fetch("https://api.coincap.io/v2/assets");
  const response = await data.json();
  return response;
}

function removeItemById(array, idToRemove) {
  return array.filter((item) => item.id !== idToRemove);
}

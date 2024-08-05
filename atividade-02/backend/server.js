const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const xml2js = require("xml2js");
const protobuf = require("protobufjs");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const YAML = require("yamljs");
const fs = require("fs");

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
        url: "http://localhost:5000",
        description: "Servidor local",
      },
    ],
    components: {
      schemas: {
        Vote: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            currency: { type: "string" },
          },
        },
        ResponseMessage: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        ProtobufItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            priceUsd: { type: "string" },
            link: { type: "string" },
          },
        },
        ProtobufData: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/ProtobufItem" },
            },
          },
        },
      },
    },
  },
  apis: ["./server.js"], // Caminho para seus arquivos de documentação
};

const specs = swaggerJsdoc(options);

// Save the YAML specification
const yamlSpec = YAML.stringify(specs, 10);
fs.writeFileSync("./swagger.yaml", yamlSpec);

// Middleware para servir a documentação Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Serve the YAML file
app.get("/swagger.yaml", (req, res) => {
  res.sendFile(__dirname + "/swagger.yaml");
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

/**
 * @swagger
 * /moedas:
 *   get:
 *     summary: Retrieve a list of assets in protobuf format
 *     responses:
 *       200:
 *         description: A protobuf encoded list of assets
 *         content:
 *           application/x-protobuf:
 *             schema:
 *               $ref: '#/components/schemas/ProtobufData'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 */
app.get("/moedas", async (req, res) => {
  try {
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
    res.set("Content-Type", "application/x-protobuf");
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /vote:
 *   delete:
 *     summary: Remove a vote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               type_out:
 *                 type: string
 *                 enum: [json, xml]
 *                 default: json
 *     responses:
 *       200:
 *         description: Vote removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 *           application/xml:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 *           application/xml:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 *           application/xml:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 */
app.delete("/vote", (req, res) => {
  try {
    const type_out = req.body.type_out || "json";
    const { id } = req.body;

    if (!id) {
      const responseObject = { message: "ID is required" };
      if (type_out === "xml") {
        const builder = new xml2js.Builder({
          rootName: "response",
          headless: true,
        });
        const xml = builder.buildObject(responseObject);
        res.header("Content-Type", "application/xml");
        res.status(400).send(xml);
      } else {
        res.status(400).json(responseObject);
      }
      return;
    }

    VoteArray = removeItemById(VoteArray, id);
    const responseObject = { message: "Voto removido" };

    if (type_out === "xml") {
      const builder = new xml2js.Builder({
        rootName: "response",
        headless: true,
      });
      const xml = builder.buildObject(responseObject);
      res.header("Content-Type", "application/xml");
      res.send(xml);
    } else {
      res.json(responseObject);
    }
  } catch (error) {
    const responseObject = { message: "Internal server error" };
    if (req.body.type_out === "xml") {
      const builder = new xml2js.Builder({
        rootName: "response",
        headless: true,
      });
      const xml = builder.buildObject(responseObject);
      res.header("Content-Type", "application/xml");
      res.status(500).send(xml);
    } else {
      res.status(500).json(responseObject);
    }
  }
});

/**
 * @swagger
 * /vote:
 *   get:
 *     summary: Retrieve the list of votes
 *     responses:
 *       200:
 *         description: A list of votes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vote'
 *           application/xml:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vote'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 *           application/xml:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 */
app.get("/vote", (req, res) => {
  try {
    const type_out = req.query.type_out || "json";
    if (type_out === "xml") {
      const builder = new xml2js.Builder({ rootName: "votes", headless: true });
      const xml = builder.buildObject({ vote: VoteArray });
      res.header("Content-Type", "application/xml");
      res.send(xml);
    } else {
      res.json(VoteArray);
    }
  } catch (error) {
    const responseObject = { message: "Internal server error" };
    if (req.query.type_out === "xml") {
      const builder = new xml2js.Builder({
        rootName: "response",
        headless: true,
      });
      const xml = builder.buildObject(responseObject);
      res.header("Content-Type", "application/xml");
      res.status(500).send(xml);
    } else {
      res.status(500).json(responseObject);
    }
  }
});

/**
 * @swagger
 * /vote:
 *   post:
 *     summary: Add a new vote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               currency:
 *                 type: string
 *               type_out:
 *                 type: string
 *                 enum: [json, xml]
 *                 default: json
 *     responses:
 *       200:
 *         description: Vote added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vote'
 *           application/xml:
 *             schema:
 *               $ref: '#/components/schemas/Vote'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 *           application/xml:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 *           application/xml:
 *             schema:
 *               $ref: '#/components/schemas/ResponseMessage'
 */
app.post("/vote", (req, res) => {
  try {
    const type_out = req.body.type_out || "json";
    const { name, currency } = req.body;

    if (!name || !currency) {
      const responseObject = { message: "Name and currency are required" };
      if (type_out === "xml") {
        const builder = new xml2js.Builder({
          rootName: "response",
          headless: true,
        });
        const xml = builder.buildObject(responseObject);
        res.header("Content-Type", "application/xml");
        res.status(400).send(xml);
      } else {
        res.status(400).json(responseObject);
      }
      return;
    }

    VoteArray.push({ id: name, name, currency });
    const responseObject = {
      id: name,
      name,
      currency,
      message: "Voto cadastrado com sucesso",
    };

    if (type_out === "xml") {
      const builder = new xml2js.Builder({
        rootName: "response",
        headless: true,
      });
      const xml = builder.buildObject(responseObject);
      res.header("Content-Type", "application/xml");
      res.send(xml);
    } else {
      res.json(responseObject);
    }
  } catch (error) {
    const responseObject = { message: "Internal server error" };
    if (req.body.type_out === "xml") {
      const builder = new xml2js.Builder({
        rootName: "response",
        headless: true,
      });
      const xml = builder.buildObject(responseObject);
      res.header("Content-Type", "application/xml");
      res.status(500).send(xml);
    } else {
      res.status(500).json(responseObject);
    }
  }
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

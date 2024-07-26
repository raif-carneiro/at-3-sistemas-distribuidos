const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  const response = await getOperations();
  console.log(response);
  res.render("pages/index", { response });
});

app.post("/execute-operation", async (req, res) => {
  const { operation, param1, param2 } = req.body;
  const result = await runOperation(operation, param1, param2);
  res.render("pages/result", { result });
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

async function getOperations() {
  const data = await fetch("https://calculadora-fxpc.onrender.com/operations");
  const response = await data.json();
  return response;
}

async function runOperation(operation, param1, param2) {
  const data = await fetch(
    `https://calculadora-fxpc.onrender.com/operation/${operation.toLowerCase()}/${param1}/${param2}`,
    {
      method: "POST",
    }
  );
  const response = await data.json();
  return response;
}

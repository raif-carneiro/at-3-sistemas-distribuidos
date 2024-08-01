import React, { useState, useEffect } from "react";
import axios from "axios";
import { load } from "protobufjs";

import "./App.css";

let Data;
let Item;

// Configuração do proto buffer
load("data.proto", (err, root) => {
  if (err) {
    throw err;
  }
  Data = root.lookupType("mypackage.Data");
  Item = root.lookupType("mypackage.Item");
});

function App() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProtobufData = async () => {
      try {
        // Load the protobuf definition
        // const root = await protobuf.load(PROTO_URL);
        //const Data = root.lookupType("default.Data");

        // Fetch binary data from the backend
        const response = await fetch("http://localhost:5000/moedas"); // Adjust the API endpoint as needed

        const buffer = await response.arrayBuffer();

        const message = Data.decode(new Uint8Array(buffer));
        console.log(message);
        setItems(message);
        //const object = Data.toObject(message, {
        //  longs: String,
        //    enums: String,
        //    bytes: String,
        //  });

        //console.log(object.items);
        //setItems(object.items);

        // Decode the protobuf data
        // const itemList = Data.decode(new Uint8Array(buffer));
        // Convert the decoded protobuf data to a more usable format
        // const itemsArray = itemList.items.map((item) => ({
        //   id: item.id,
        //   name: item.name,
        //   priceUsd: item.priceUsd,
        //   link: item.link,
        // }));
        // setOptions(myMessage);
      } catch (error) {
        console.error(
          "There was an error fetching or decoding the data!",
          error
        );
      }
    };

    fetchProtobufData();
  }, []);

  return (
    <>
      <div>
        <h1>Items List</h1>
        <ul>
          {items.items.map((item) => (
            <li key={item.id}>
              <strong>Name:</strong> {item.name}
              <br />
              <strong>Price:</strong> {item.priceUsd}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;

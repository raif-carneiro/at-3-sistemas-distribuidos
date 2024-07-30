import React, { useState, useEffect } from "react";
import axios from "axios";
import * as protobuf from "protobufjs";
import { Data } from "./data.proto";
import "./App.css";

function App() {
  const [options, setOptions] = useState([]);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    const fetchProtobufData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/moedas", {
          responseType: "arraybuffer",
        });
        const buffer = response.data;
        console.log(buffer);

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

  const handleVote = (id) => {
    axios
      .post("http://localhost:5000/vote", { id })
      .then(() => {
        // setOptions((prevOptions) =>
        //   prevOptions.map((option) =>
        //     option.id === id ? { ...option, votes: option.votes + 1 } : option
        //   )
        // );
      })
      .catch((error) => {
        console.error("There was an error voting!", error);
      });
  };

  return (
    <>
      <h1>Voting System</h1>
      <div>
        <h2>Add New Option</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          // onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Currency"
          value={currency}
          // onChange={(e) => setCurrency(e.target.value)}
        />
        <button onClick={handleVote(1)}>Add Option</button>
      </div>
    </>
    // <div className="App">
    //   <h1>Items List</h1>
    //   <div>
    //     {items.length > 0 ? (
    //       items.map((item) => (
    //         <div key={item.id} style={{ marginBottom: "10px" }}>
    //           <p>ID: {item.id}</p>
    //           <p>Name: {item.name}</p>
    //           <p>Price (USD): {item.priceUsd}</p>
    //           <p>
    //             Link:{" "}
    //             <a href={item.link} target="_blank" rel="noopener noreferrer">
    //               {item.link}
    //             </a>
    //           </p>
    //         </div>
    //       ))
    //     ) : (
    //       <p>Loading...</p>
    //     )}
    //   </div>
    // </div>
  );
}

export default App;

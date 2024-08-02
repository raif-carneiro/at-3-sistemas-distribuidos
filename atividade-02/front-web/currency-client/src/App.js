import React, { useState, useEffect } from "react";
import { load } from "protobufjs";

import "./App.css";

let Data;

// Configuração do proto buffer
load("data.proto", (err, root) => {
  if (err) {
    throw err;
  }
  Data = root.lookupType("mypackage.Data");
});

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [votes, setVotes] = useState([]);
  const [voteName, setVoteName] = useState("");
  const [voteCurrency, setVoteCurrency] = useState("");

  useEffect(() => {
    const fetchProtobufData = async () => {
      try {
        // Fetch binary data from the backend
        const response = await fetch("http://localhost:5000/moedas"); // Adjust the API endpoint as needed

        const buffer = await response.arrayBuffer();

        const message = Data.decode(new Uint8Array(buffer));

        setItems(message.items);
      } catch (error) {
        console.error(
          "There was an error fetching or decoding the data!",
          error
        );
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProtobufData();
  }, []);

  const handleSelectChange = (event) => {
    const selectedId = event.target.value;
    const selectedItem = items.find((item) => item.id === selectedId);
    setSelectedOption(selectedItem);
  };

  const fetchVotes = () => {
    fetch("http://localhost:5000/vote")
      .then((response) => response.json())
      .then((data) => setVotes(data))
      .catch((error) => console.error("Error fetching votes:", error));
  };

  const handleAddVote = () => {
    fetch("http://localhost:5000/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: voteName, currency: voteCurrency }),
    })
      .then(() => {
        fetchVotes(); // Refresh votes
        setVoteName("");
        setVoteCurrency("");
      })
      .catch((error) => console.error("Error adding vote:", error));
  };

  const handleRemoveVote = (id) => {
    fetch("http://localhost:5000/vote", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })
      .then(() => {
        fetchVotes(); // Refresh votes
      })
      .catch((error) => console.error("Error removing vote:", error));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <div>
        <h1>Catálogo de Criptomoedas</h1>

        <select onChange={handleSelectChange}>
          <option value="">--Selecione uma opção --</option>
          {items.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        {selectedOption && (
          <div>
            <h3>Detalhes:</h3>
            <p>
              <strong>Nome:</strong> {selectedOption.name}
            </p>
            <p>
              <strong>Valor em Dólares:</strong> {selectedOption.priceUsd}
            </p>
            <p>
              <strong>Saiba mais em:</strong> {selectedOption.link}
            </p>
          </div>
        )}

        <h2>Vote na sua moeda favorita</h2>
        <input
          type="text"
          value={voteName}
          onChange={(e) => setVoteName(e.target.value)}
          placeholder="seu nome"
        />
        <input
          type="text"
          value={voteCurrency}
          onChange={(e) => setVoteCurrency(e.target.value)}
          placeholder="Criptomoeda"
        />
        <button onClick={handleAddVote}>Votar</button>
        <h2>Votos registrados </h2>
        <ul>
          {votes.map((vote) => (
            <li key={vote.id}>
              {vote.name} prefere {vote.currency}
              <button onClick={() => handleRemoveVote(vote.id)}>
                Remover Voto
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;

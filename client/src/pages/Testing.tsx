import React, { useEffect, useState } from "react";
import axios from "axios";

type Factor = {
  factor_id: number;
  factor_name: string;
};

type Anxiety = {
  anx_id: number;
  anx_name: string;
  factors: Factor[]
};

const Testing: React.FC = () => {
  const [anxieties, setAnxieties] = useState<Anxiety[]>([]);

useEffect(() => {
  axios.get("/api/testing").then((response) => {
    setAnxieties(response.data);
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
}, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Anxiety Sources & Factors</h1>
      {anxieties.length > 0 ? ( 
      <ul>
        {anxieties.map((anx) => (
          <li key={anx.anx_id} className="mb-4">
            <h2 className="text-xl font-semibold">{anx.anx_name}</h2>
            {anx.factors.length > 0 ? (
            <ul className="ml-4 list-disc">
              {anx.factors.map((factor) => (
                <li key={factor.factor_id}>{factor.factor_name}</li>
              ))}
            </ul>
            ) : (
              <p>No factors found for this anxiety source.</p>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <p>Loading or no data available...</p>
    )}
    </div>
    );
  };

export default Testing;
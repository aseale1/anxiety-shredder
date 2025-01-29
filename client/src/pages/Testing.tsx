import React, { useEffect, useState } from "react";
import axios from "axios";

type Factor = {
  factor_id: number;
  factor_name: string;
};

type Anxiety = {
  anx_id: number;
  anx_name: string;
  factor: Factor[]
};

const Testing: React.FC = () => {
  const [anxieties, setAnxieties] = useState<Anxiety[]>([]);

useEffect(() => {
  setAnxieties
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
        anxieties.map((anx) => (
          <div key={'anx-${anx.anx_id}-${index}'} className="mb-4">
            <h2 className="text-xl font-semibold">{anx.anx_name}</h2>
            <ul>
              {(anx.factor || []).map((factor) => (
                <li key={'factor-${factor.factor_id}-${index}'}>{factor.factor_name}</li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>Loading or no data available...</p>
      )}
    </div>
  );
};

export default Testing;
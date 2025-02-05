import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';


const AddAnxiety: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [anxieties, setAnxieties] = useState<{ anx_id: number; anx_name: string }[]>([]);
    const [selectedAnxieties, setSelectedAnxieties] = useState([]);
    const [factors, setFactors] = useState<{ factor_id: number; factor_name: string }[]>([]);
    const [selectedFactors, setSelectedFactors] = useState<number[]>([]);

useEffect(() => {
    axios.get("/api/anxieties").then((response) => 
        setAnxieties(response.data));
}, []);

const handleAnxietyChange = (anx_id: any) => {
        setSelectedAnxieties(anx_id);
        axios.get(`/api/anxieties/${anx_id}/factors`).then((response) => 
            setFactors(response.data));
        };

const handleFactorChange = (factor_id: number) => {
    setSelectedFactors((prev) => {
        const newSelection = new Set(prev);
        newSelection.has(factor_id) ? newSelection.delete(factor_id) : newSelection.add(factor_id);
        return Array.from(newSelection);
    });
};
    
const handleSubmit = async () => {
    if (!currentUser) {
        console.error("User is not authenticated");
        return;
    }

    await axios.post("/api/user-anxiety", {
        firebase_uid: currentUser.uid,
        anx_id: selectedAnxieties,
    });
    for (let factor_id of selectedFactors) {
        await axios.post("/api/user-factor", {
            firebase_uid: currentUser.uid,
            factor_id,
        });
    }
    navigate("/home");
};

return (
    <div className="p-4 h-screen w-screen bg-amber-50">
        <h1 className="text-6xl text-black font-blaka mb-4">Add Anxieties</h1>
        {anxieties.map((anx) => (
            <button key={anx.anx_id} onClick={() => handleAnxietyChange(anx.anx_id)} className="border p-2 m-2">
                {anx.anx_name}
            </button>
        ))}
        {selectedAnxieties && (
            <div>
                <h2 className="text-xl text-black font-semibold mb-2">Select Factors:</h2>
                {factors.map((factor) => (
                    <label key={factor.factor_id} className="block text-black font-lato">
                        <input
                            type="checkbox"
                            checked={selectedFactors.includes(factor.factor_id)} 
                            onChange={() => handleFactorChange(factor.factor_id)}
                        />
                        {factor.factor_name}
                    </label>
                ))}
            </div>
        )}
        <button onClick={handleSubmit} className="w-full p-2 mb-4 bg-[#7f85a1] text-black font-lato">Submit</button>
        <div>
            
          <button onClick={() => navigate("/home")} className="w-full p-2 bg-[#7f85a1] text-black font-lato">Home</button>
        </div>
    </div>
);
};

export default AddAnxiety;

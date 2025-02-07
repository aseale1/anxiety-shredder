import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const AddAnxiety: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [anxieties, setAnxieties] = useState<{ anx_id: number; anx_name: string }[]>([]);
    const [selectedAnxieties, setSelectedAnxieties] = useState<number | null>(null);
    const [factors, setFactors] = useState<{ factor_id: number; factor_name: string }[]>([]);
    const [selectedFactors, setSelectedFactors] = useState<number[]>([]);

    useEffect(() => {
        const fetchUntrackedAnxieties = async () => {
            try {
                if (currentUser) {
                    const url = `/api/${currentUser.uid}/anxieties/untracked-anxieties`;
                    console.log(`Fetching untracked anxieties for user: ${currentUser.uid}`);
                    console.log(`Request URL: ${url}`);
                    const response = await axios.get(url);
                    console.log(`Response status: ${response.status}`);
                    setAnxieties(response.data);
                } else {
                    console.error("currentUser is null or undefined");
                }
            } catch (error) {
                console.error("Error fetching untracked anxieties:", error);
            }
        };
        fetchUntrackedAnxieties();
    }, [currentUser]);

    const handleAnxietyChange = (anx_id: number) => {
        setSelectedAnxieties(anx_id);
        axios.get(`/api/anxieties/${anx_id}/factors`).then((response) => 
            setFactors(response.data)).catch((error) => {
                console.error("Error fetching factors:", error);
            });
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

        try {
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
        } catch (error) {
            console.error("Error submitting data:", error);
        }
    };

    return (
        <div className="p-4 h-screen w-screen bg-amber-50">
            <h1 className="text-6xl text-black font-blaka mb-4">Add Anxieties</h1>

            {/* Display untracked anxieties */}
            <h2 className="text-xl text-black font-semibold mb-2">Select Anxieties:</h2>
            {anxieties.map((anxiety) => (
                <label key={anxiety.anx_id} className="block text-black font-lato">
                    <input
                        type="radio"
                        name="anxieties"
                        value={anxiety.anx_id}
                        onChange={() => handleAnxietyChange(anxiety.anx_id)}
                    />
                    {anxiety.anx_name}
                </label>
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

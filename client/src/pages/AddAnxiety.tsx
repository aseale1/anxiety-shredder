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
    const [conditions, setConditions] = useState<{ factor_id: number; conditions: { condition_id: number; condition_name: string; rating: number }[] }[]>([]);
    const [rankings, setRankings] = useState<{ condition_id: number; rating: number }[]>([]);  
    const [selectedFactorName, setSelectedFactorName] = useState<string | null>(null);

    useEffect(() => {
        console.log("useEffect Component Mounted - Fetching untracked anxieties");
        console.log("Conditions before rendering:", conditions);

        const fetchUntrackedAnxieties = async () => {
            try {
                if (currentUser) {
                    const url = `/api/user/${currentUser.uid}/anxieties/untracked-anxieties`;
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

    const handleAnxietySelect = (anxiety: any) => {
        setSelectedAnxieties(anxiety);
        axios.get(`/api/anxieties/${anxiety}/factors`).then((response) => {
            console.log(`Fetched factors for anxiety ${anxiety} (${anxiety.anxiety_name}):`, response.data);
            setFactors(response.data);
        }).catch((error) => {
            console.error("Error fetching factors:", error);
        });
    }

    // Function to handle factor selection and fetch conditions
    const handleFactorSelect = (factor: any, anxiety: any) => {
        setSelectedFactors(factor);
    setSelectedFactorName(factor.factor_name);
    axios.get(`/api/factors/${factor.factor_id}/conditions`).then((response) => {
        console.log(`Fetched conditions for factor ${factor.factor_id} (${factor.factor_name}):`, response.data);
        setConditions(response.data);
    }).catch((error) => {
        console.error("Error fetching conditions:", error);
    });
}

    const handleRankingChange = (factor_id: number, rating: number) => {
        console.log(`Rating for factor ${factor_id} changed to ${rating}`);
        setRankings((prevRankings) => {
            const newRankings = [...prevRankings];
            const existingRanking = newRankings.find((r) => r.condition_id === factor_id);
            if (existingRanking) {
                existingRanking.rating = rating;
            } else {
                newRankings.push({ condition_id: factor_id, rating });
            }
            return newRankings;
        });
    }

    const handleSubmit = async () => {
        if (!currentUser) {
            console.error("User is not authenticated");
            return;
        }
        if (!selectedAnxieties || selectedFactors.length === 0) {
            console.error("Anxiety and factors must be selected");
            return;
        }
        try {
            // Add anxiety to user
            await axios.post(`/api/user-anxiety`, { firebase_uid: currentUser.uid, anx_id: selectedAnxieties });
            // Add factors to user
            await axios.post(`/api/user-factor`, { firebase_uid: currentUser.uid, factor_id: selectedFactors });
            // Add conditions to user
            await axios.post(`/api/${currentUser.uid}/user-condition`, { firebase_uid: currentUser.uid, conditions: rankings });
        } catch (error) {
            console.error("Error adding anxiety, factors, and conditions:", error);
        }
    }


    return (
        <div className="p-4 h-screen w-screen bg-amber-50">
            <h1 className="text-6xl text-black text-center font-blaka mb-4">Add an Anxiety Source</h1>

            {/* Display untracked anxieties */}
            <h2 className="text-xl text-black font-semibold mb-2">What is making you feel anxious?</h2>
            {anxieties.map((anxiety) => (
                <label key={anxiety.anx_id} className="block text-black font-lato">
                    <input
                        type="radio"
                        name="anxieties"
                        value={anxiety.anx_id}
                        onChange={() => handleAnxietySelect(anxiety.anx_id)}
                    />
                    {anxiety.anx_name}
                </label>
            ))}

            {/* Display factors for selected anxiety */}
            {selectedAnxieties && (
                <div>
                    <h2 className="flex text-xl text-black font-semibold mb-2">What about {anxieties.find((a) => a.anx_id === selectedAnxieties)?.anx_name} causes anxiety?</h2>
                    {factors.map((factor) => (
                        <label key={factor.factor_id} className="block text-black font-lato">
                            <input
                                type="checkbox"
                                //checked={selectedFactors.includes(factor.factor_id)} 
                                onChange={() => handleFactorSelect(factor, selectedAnxieties)}
                            />
                            {factor.factor_name}
                        </label>
                    ))}
                </div>
            )}

            {/* Display conditions for selected factors with a dropdown for ranking */}
            {selectedFactorName && (
                <div>
                    <h2 className="text-xl text-black font-semibold mb-2">When it comes to "{selectedFactorName}," how anxious do these conditions make you feel?</h2>
                    {conditions.find((c) => c.factor_id === selectedFactors[0])?.conditions?.map((condition) => (
                        <div key={condition.condition_id}>
                            <label className="block text-black font-lato">
                                {condition.condition_name}
                            </label>
                            <select
                                value={rankings.find((r) => r.condition_id === condition.condition_id)?.rating || 0}
                                onChange={(e) => handleRankingChange(condition.condition_id, parseInt(e.target.value))}
                            >
                                <option value={0}>Not anxious at all</option>
                                <option value={1}>A little anxious (my heart beats a little faster)</option>
                                <option value={2}>Very anxious (I feel uneasy and maybe nauseous)</option>
                                <option value={3}>Extremely anxious (I want to avoid the situation)</option>
                            </select>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} className="p-2 mt-4 bg-black text-white font-lato">Submit</button>
            {/* Return Home */}
            <button onClick={() => navigate("/home")} className="p-2 mt-4 ml-4 bg-black text-white font-lato">Return to Home</button>

        </div>

    );
};

export default AddAnxiety;

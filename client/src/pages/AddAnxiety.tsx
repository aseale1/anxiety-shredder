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
    const [conditions, setConditions] = useState<{ condition_id: number; condition_name: string; rating: number }[]>([]);
    const [selectedFactorName, setSelectedFactorName] = useState<string | null>(null);

    useEffect(() => {
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

    const fetchConditions = async (factor_id: number) => {
        try {
            const response = await axios.get(`/api/factors/${factor_id}/conditions`);
            console.log(`Fetched conditions for factor ${factor_id}:`, response.data);
            setConditions(response.data);
        } catch (error) {
            console.error("Error fetching conditions:", error);
        }
    };

    const handleAnxietyChange = (anx_id: number) => {
        setSelectedAnxieties(anx_id);
        axios.get(`/api/anxieties/${anx_id}/factors`).then((response) => {
            console.log(`Fetched factors for anxiety ${anx_id}:`, response.data);
            setFactors(response.data);
        }).catch((error) => {
            console.error("Error fetching factors:", error);
        });
    };

    const handleFactorChange = (factor_id: number, factor_name: string) => {
        setSelectedFactors((prev) => {
            const newSelection = new Set(prev);
            newSelection.has(factor_id) ? newSelection.delete(factor_id) : newSelection.add(factor_id);
            return Array.from(newSelection);
        });
        setSelectedFactorName(factor_name);
        fetchConditions(factor_id);
    };

    const handleSubmit = async () => {
        if (!currentUser) {
            console.error("User is not authenticated");
            return;
        }

        try {
            {/* Add anxiety to user */}
            const addAnxietyResponse = await axios.post("/api/user-anxiety", {
                firebase_uid: currentUser.uid,
                anx_id: selectedAnxieties,
            });

            {/* Add factor to user */}
            for (const factor_id of selectedFactors) {
                const addFactorResponse = await axios.post("/api/user-factor", {
                    firebase_uid: currentUser.uid,
                    factor_id,
                });
            }

            {/* Add conditions to user */}
            const condition_ratings = conditions.map((condition) => ({
                condition_id: condition.condition_id,
                rating: condition.rating,
            }));
            const addConditionsResponse = await axios.post(`/api/user/${currentUser.uid}/condition-ratings`, {
                condition_ratings,
            });
        } catch (error) {
            console.error("Error adding anxiety source:", error);
        }
        {/* Redirect to home */}
        navigate("/home");
    };

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
                        onChange={() => handleAnxietyChange(anxiety.anx_id)}
                    />
                    {anxiety.anx_name}
                </label>
            ))}

            {/* Display factors for selected anxiety */}
            {selectedAnxieties && (
                <div>
                    <h2 className="flex text-xl text-black font-semibold mb-2">What about it causes anxiety?</h2>
                    {factors.map((factor) => (
                        <label key={factor.factor_id} className="block text-black font-lato">
                            <input
                                type="checkbox"
                                checked={selectedFactors.includes(factor.factor_id)} 
                                onChange={() => handleFactorChange(factor.factor_id, factor.factor_name)}
                            />
                            {factor.factor_name}
                        </label>
                    ))}
                </div>
            )}

            {/* Display conditions for selected factors with a labeled rating slider*/}
            {conditions.length > 0 && (
                <div>
                    <h2 className="text-xl text-black font-semibold mb-2">When it comes to {selectedFactorName}, how anxious do these conditions make you feel?</h2>
                    <p className="text-l text-black italic mb-2">0: not anxious, 4: extremely anxious</p>

                    {conditions.map((condition) => (
                        <div key={condition.condition_id} className="bg-amber-50 flex flex-col items-center mb-4">
                            <label className="block text-black font-lato mb-2">{condition.condition_name}</label>
                            <div className="w-full">
                                <div className="flex justify-between text-black px-2 mb-1">
                                    {[0, 1, 2, 3, 4].map((value) => (
                                        <span key={value}>{value}</span>
                                    ))}
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="4"
                                    value={condition.rating}
                                    onChange={(e) => {
                                        const newRating = parseInt(e.target.value);
                                        setConditions((prev) => prev.map((c) => {
                                            if (c.condition_id === condition.condition_id) {
                                                return { ...c, rating: newRating };
                                            }
                                            return c;
                                        }));
                                    }}
                                    className="bg-amber-50 w-full"
                                />
                                <span className="block text-center mt-1">{condition.rating}</span>
                            </div>
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

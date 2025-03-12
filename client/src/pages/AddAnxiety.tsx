import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const AddAnxiety: React.FC = () => {

    interface Condition {
        condition_id: number;
        factor_id: number;
        condition_name: string;
        user_con_rating: { firebase_uid: string; con_id: number; rating: number }[];
    }

    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [anxieties, setAnxieties] = useState<{ anx_id: number; anx_name: string }[]>([]);
    const [selectedAnxieties, setSelectedAnxieties] = useState<number | null>(null);
    const [factors, setFactors] = useState<{ factor_id: number; factor_name: string }[]>([]);
    const [selectedFactors, setSelectedFactors] = useState<{ factor_id: number; factor_name: string }[]>([]);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [rankings, setRankings] = useState<{ condition_id: number; rating: number }[]>([]);  
    const [selectedFactorName, setSelectedFactorName] = useState<string | null>(null);

    useEffect(() => {
        console.log("Conditions before rendering:", conditions);
        const fetchUntrackedAnxieties = async () => {
            try {
                if (currentUser) {
                    console.log(`Fetching untracked anxieties for user: ${currentUser.uid}`);
                    const response = await axios.get(`/api/user/${currentUser.uid}/anxieties/untracked-anxieties`);
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
    const handleFactorSelect = (factor: any) => {
        // Check if this factor is already selected
        const isAlreadySelected = selectedFactors.some(f => f.factor_id === factor.factor_id);
        
        if (isAlreadySelected) {
        // Remove factor if already selected
        setSelectedFactors(selectedFactors.filter(f => f.factor_id !== factor.factor_id));
        // Remove conditions for this factor
        setConditions(conditions.filter(c => c.factor_id !== factor.factor_id));
        // Remove rankings for conditions of this factor
        setRankings(rankings.filter(r => {
            const conditionBelongsToFactor = conditions.some(
            c => c.condition_id === r.condition_id && c.factor_id === factor.factor_id
            );
            return !conditionBelongsToFactor;
        }));
        
        // Update selected factor name
        const newFactorNames = selectedFactors
            .filter(f => f.factor_id !== factor.factor_id)
            .map(f => f.factor_name)
            .join(", ");
        setSelectedFactorName(newFactorNames || null);
        } else {
        // Add factor if not already selected
        setSelectedFactors([...selectedFactors, factor]);
        
        // Update selected factor name
        const newFactorName = selectedFactorName 
            ? `${selectedFactorName}, ${factor.factor_name}` 
            : factor.factor_name;
        setSelectedFactorName(newFactorName);
        
        if (!currentUser) {
            console.error("User is not authenticated");
            return;
        }
        
        axios.get(`/api/factors/${factor.factor_id}/conditions`).then((response) => {
            console.log(`Fetched conditions for factor ${factor.factor_id} (${factor.factor_name}):`, response.data);
            
            // Log the first condition to check its structure
            if (response.data.length > 0) {
            console.log("First condition object:", response.data[0]);
            console.log("condition_id present?", response.data[0].condition_id !== undefined);
            }
            
            // Make sure each condition has the necessary fields, including factor_id
            const conditionsWithFactorId = response.data.map((condition: any) => {
            // Log individual condition to check structure
            console.log("Processing condition:", condition);
            
            return {
                ...condition,
                factor_id: factor.factor_id,
                // Ensure condition_id is present
                condition_id: condition.condition_id || condition.con_id || null
            };
            });
            
            setConditions((prevConditions) => [...prevConditions, ...conditionsWithFactorId]);
            console.log("Conditions after processing:", conditionsWithFactorId);
        }).catch((error) => {
            console.error("Error fetching conditions:", error);
        });
        }
    }
    
    const handleRankingChange = (condition_id: number | null, factor_id: number, condition_name: string, rating: number) => {
        console.log('condition_id when handleRankingChange:', condition_id);
        console.log(`Rating for condition ${condition_name} changed to ${rating}`);
        
        if (condition_id === null || condition_id === undefined) {
        console.error("condition_id is null or undefined for condition:", condition_name);
        return;
        }
        
        setRankings((prevRankings) => {
        const newRankings = [...prevRankings];
        const existingRankingIndex = newRankings.findIndex((r) => r.condition_id === condition_id);
        if (existingRankingIndex !== -1) {
            newRankings[existingRankingIndex].rating = rating;
        } else {
            newRankings.push({ condition_id, rating });
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
            for (const factor of selectedFactors) {
                try {
                    await axios.post(`/api/user-factor`, { firebase_uid: currentUser.uid, factor_id: factor.factor_id });
                } catch (error) {
                    console.error(`Error adding factor ${factor.factor_id}:`, error);
                }
            }
    
            // Add conditions to user
            try {
                await axios.post(`/api/${currentUser.uid}/user-condition`, { firebase_uid: currentUser.uid, conditions: rankings });
            } catch (error) {
                console.error(`Error adding conditions:`, error);
            }
        } catch (error) {
            console.error(`Error submitting form:`, error);
        }
    }


    return (
        <div className="min-h-screen w-screen bg-amber-50 p-4 text-center">
            <h1 className="text-6xl text-black text-center font-fast mb-4">Add an Anxiety Source</h1>

            {/* Display untracked anxieties */}
            <h2 className="text-2xl text-black font-afacad font-semibold">What is making you feel anxious?</h2>
            {anxieties.map((anxiety) => (
                <label key={anxiety.anx_id} className="block text-black text-lg font-afacad">
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
                    <h2 className="text-2xl text-black font-semibold font-afacad mt-4">What about {anxieties.find((a) => a.anx_id === selectedAnxieties)?.anx_name} causes anxiety?</h2>
                    {factors.map((factor) => (
                        <label key={factor.factor_id} className="block text-black text-lg font-afacad">
                            <input
                                type="checkbox"
                                onChange={() => handleFactorSelect(factor)}
                            />
                            {factor.factor_name}
                        </label>
                    ))}
                </div>
            )}

            {/* Display conditions for selected factors */}
            {selectedFactorName && conditions && conditions.length > 0 && (
            <div>
            <h2 className="text-2xl text-black font-afacad font-semibold mb-2 mt-4">When it comes to these factors, how anxious do these conditions make you feel?</h2>
            <p className="italic text-black text-lg font-afacad mb-2">0-not anxious at all, 1-somewhat anxious, 2-very anxious, 3-extremely anxious</p>
            {conditions.map((condition, index) => (
            <div key={`${condition.condition_id}-${index}`} className="mb-4">
                <label
                className="block text-black font-afacad"
                >
                {condition.condition_name}
                </label>
                {[0, 1, 2, 3].map((rating) => (
                <label key={rating} className="inline-block mr-4 text-black font-afacad text-lg">
                    <input
                    type="radio"
                    name={`rating-${condition.condition_id}`}
                    checked={rankings.find((r) => r.condition_id === condition.condition_id)?.rating === rating}
                    onChange={() => handleRankingChange(
                        condition.condition_id, 
                        condition.factor_id, 
                        condition.condition_name, 
                        rating
                    )}
                    />
                    {rating}
                </label>
                ))}
            </div>
            ))}
        </div>
        )}

            {/* Submit */}
            <button onClick={handleSubmit} className="p-2 mt-4 bg-black text-white font-afacad">Submit</button>
            {/* Return Home */}
            <button onClick={() => navigate("/home")} className="p-2 mt-4 ml-4 bg-black text-white font-afacad">Return to Home</button>

        </div>

    );
};

export default AddAnxiety;

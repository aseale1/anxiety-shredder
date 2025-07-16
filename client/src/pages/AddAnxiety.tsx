import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const AddAnxiety: React.FC = () => {
    interface Condition {
        condition_id: number;
        factor_id: number;
        condition_name: string;
        con_desc: string;
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
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({0: 0, 1: 0, 2: 0, 3: 0});
    const [factorCounts, setFactorCounts] = useState<Record<number, Set<number>>>({0: new Set(), 1: new Set(), 2: new Set(), 3: new Set()});
    const [canSubmit, setCanSubmit] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        const fetchUntrackedAnxieties = async () => {
            try {
                console.log(`Fetching untracked anxieties for user: ${currentUser.uid}`);
                const response = await axios.get(`/api/user/${currentUser.uid}/anxieties/untracked-anxieties`);
                setAnxieties(response.data);
            } catch (error) {
                console.error("Error fetching untracked anxieties:", error);
            }
        };
        fetchUntrackedAnxieties();
    }, [currentUser]);

    const handleAnxietySelect = (anxiety: any) => {
        setSelectedAnxieties(anxiety);
        axios.get(`/api/anxieties/${anxiety}/factors`).then((response) => {
            console.log(`Fetched factors for anxiety ${anxiety}:`, response.data);
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
        validateSelections();
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
        
        let oldRating: number | null = null;
        if (existingRankingIndex !== -1) {
            oldRating = newRankings[existingRankingIndex].rating;
            newRankings[existingRankingIndex].rating = rating;
        } else {
            newRankings.push({ condition_id, rating });
        }
        
        // Update rating counts for validation
        setRatingCounts(prev => {
            const newCounts = {...prev};
            
            // If changing an existing rating, decrement the old count
            if (oldRating !== null) {
                newCounts[oldRating] = Math.max(0, (newCounts[oldRating] || 0) - 1);
            }
            
            // Increment the new rating count
            newCounts[rating] = (newCounts[rating] || 0) + 1;
            return newCounts;
        });
        
        // Update factor counts for each rating
        setFactorCounts(prev => {
            const newFactorCounts = {...prev};
            
            // If changing an existing rating, remove this factor from old rating's set
            if (oldRating !== null) {
                newFactorCounts[oldRating] = new Set([...newFactorCounts[oldRating]].filter(fid => fid !== factor_id));
            }
            
            // Add this factor to the new rating's set
            newFactorCounts[rating] = newFactorCounts[rating] || new Set();
            newFactorCounts[rating].add(factor_id);
            
            return newFactorCounts;
        });
        
        return newRankings;
    });
    
    validateSelections();
    }

    const validateSelections = () => {
        const errors: string[] = [];
        if (!selectedAnxieties) {
            errors.push("Please select an anxiety.");
        }

        if (selectedFactors.length < 3 ) {
            errors.push("Please select at least 3 factors.");
        }

        const hasRating1 = ratingCounts[1] >= 3;
        const hasRating2 = ratingCounts[2] >= 3;
        const hasRating3 = ratingCounts[3] >= 1;

        if (!hasRating1) {
            errors.push("Please rate at least 3 conditions as '1-somewhat anxious'");
        }
        
        if (!hasRating2) {
            errors.push("Please rate at least 3 conditions as '2-very anxious'");
        }
        
        if (!hasRating3) {
            errors.push("Please rate at least 1 condition as '3-extremely anxious'");
        }

        const ratedFactors = new Set([
            ...factorCounts[1],
            ...factorCounts[2],
            ...factorCounts[3]
        ]);

        if (ratedFactors.size < 3) {
            errors.push("Please rate conditions from at least 3 different factors.");
        }
        setValidationErrors(errors);
        setCanSubmit(errors.length === 0);
    };

    const handleDragStart = (e: React.DragEvent, condition: any) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(condition));
    };

    const handleDrop = (e: React.DragEvent, rating: number) => {
    e.preventDefault();
    const conditionData = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    handleRankingChange(
        conditionData.condition_id,
        conditionData.factor_id,
        conditionData.condition_name,
        rating
    );
    };

    const handleSubmit = async () => {
        if (!canSubmit) {
            console.error("Form validation failed. Please fix the errors before submitting.");
            return;
        }
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
        navigate('/home');
    };

    return (
        <div className="min-h-screen w-screen bg-mountain bg-center flex justify-center items-center">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative w-full max-w-4xl bg-amber-50 rounded-lg p-8 m-4">
        <h1 className="text-6xl text-black text-center font-fast mb-4 pt-8">What's making you feel anxious?</h1>
        <div className="border-b-2 border-black mb-6"></div>

            {/* Display untracked anxieties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {anxieties.map((anxiety) => (
                    <button 
                        key={anxiety.anx_id}
                        className={`py-3 px-6 rounded-full font-afacad text-black text-lg text-center ${selectedAnxieties === anxiety.anx_id 
                            ? "bg-[#7f85a1] border-2 border-black" 
                            : "bg-[#7f85a1]"}`}
                        onClick={() => handleAnxietySelect(anxiety.anx_id)}
                    >
                        {anxiety.anx_name}
                    </button>
                ))}
            </div>

            {/* Display factors for selected anxiety */}
            {selectedAnxieties && (
                <div>
                    <h2 className="text-2xl text-black text-center font-semibold font-afacad mt-4">What about {anxieties.find((a) => a.anx_id === selectedAnxieties)?.anx_name} causes anxiety?</h2>
                    {factors.map((factor) => (
                        <label key={factor.factor_id} className="block text-black text-xl font-afacad pl-40">
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
            <h2 className="text-2xl text-black font-afacad text-center font-semibold mb-2 mt-4">
            When it comes to these factors, how anxious do these conditions make you feel?
            </h2>
            <p className="italic text-black text-center text-lg font-afacad mb-4">
            drag and drop to sort conditions into the categories that best describe how anxious they make you feel
            </p>

            {/* Unassigned Conditions */}
        {conditions.filter(condition => !rankings.find(r => r.condition_id === condition.condition_id)).length > 0 && (
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-4">
            <h3 className="text-center font-afacad font-bold mb-2 text-xl text-black">Unassigned Conditions</h3>
            <div className="flex flex-wrap gap-2">
                {conditions
                .filter(condition => !rankings.find(r => r.condition_id === condition.condition_id))
                .map((condition, index) => (
                    <div
                    key={`${condition.condition_id}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, condition)}
                    className="bg-gray-400 text-white rounded-full px-4 py-2 cursor-move font-medium hover:bg-gray-500 transition-colors"
                    >
                    {condition.con_desc || condition.condition_name}
                    </div>
                ))}
            </div>
            </div>
            )}
            
            <div className="grid grid-cols-4 gap-4 mb-6">
            {/* Rating Column 0 - No Problem */}
            <div className="bg-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-300 px-4 py-3">
                    <h3 className="text-center font-bold mb-1 text-xl text-black">no problem!</h3>
                </div>
                <div
                className="min-h-[400px] p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 0)}
                >
                {conditions
                    .filter(condition => rankings.find(r => r.condition_id === condition.condition_id)?.rating === 0)
                    .map((condition, index) => (
                    <div
                        key={`${condition.condition_id}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, condition)}
                        className="bg-gray-400 text-white rounded-full px-4 py-2 mb-2 cursor-move text-center font-medium hover:bg-gray-500 transition-colors"
                    >
                        {condition.con_desc || condition.condition_name}
                    </div>
                    ))}
                </div>
                <div className="self-end">
                <div className="bg-gray-300 px-4 py-3 text-center">
                    <p className="italic text-sm text-black font-medium">this doesn't really bother me at all</p>
                </div>
                </div>
            </div>
            
        
            {/* Rating Column 1 - A Little Anxious */}
            <div className="bg-green-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-green-500 px-4 py-3">
                <h3 className="text-center font-bold text-xl text-white mb-1">a little anxious</h3>
                </div>
                <div
                className="min-h-[400px] p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 1)}
                >
                {conditions
                    .filter(condition => rankings.find(r => r.condition_id === condition.condition_id)?.rating === 1)
                    .map((condition, index) => (
                    <div
                        key={`${condition.condition_id}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, condition)}
                        className="bg-gray-400 text-white rounded-full px-4 py-2 mb-2 cursor-move text-center font-medium hover:bg-gray-500 transition-colors"
                    >
                        {condition.con_desc || condition.condition_name}
                    </div>
                    ))}
                </div>
                <div className="self-end">
                <div className="bg-green-500 px-4 py-3 text-center">
                    <p className="italic text-sm text-white font-medium">this makes my heart beat faster</p>
                </div>
                </div>
            </div>

            {/* Rating Column 2 - Very Anxious */}
            <div className="bg-blue-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-blue-500 px-4 py-3">
                <h3 className="text-center font-bold text-xl text-white mb-1">very anxious</h3>
                </div>
                <div
                    className="min-h-[400px] p-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, 2)}
                >
                {conditions
                    .filter(condition => rankings.find(r => r.condition_id === condition.condition_id)?.rating === 2)
                    .map((condition, index) => (
                    <div
                        key={`${condition.condition_id}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, condition)}
                        className="bg-gray-400 text-white rounded-full px-4 py-2 mb-2 cursor-move text-center font-medium hover:bg-gray-500 transition-colors"
                    >
                        {condition.con_desc || condition.condition_name}
                    </div>
                    ))}
                </div>
                <div className="self-end">
                <div className="bg-blue-500 px-4 py-3 text-center">
                    <p className="italic text-sm text-white font-medium">this makes me feel uneasy and maybe nauseous</p>
                </div>
                </div>
            </div>

            {/* Rating Column 3 - Extremely Anxious */}
            <div className="bg-gray-500 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-700 px-4 py-3">
                <h3 className="text-center font-bold text-xl text-white mb-1">extremely anxious</h3>
                </div>
                <div
                className="min-h-[400px] p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 3)}
                >
                {conditions
                    .filter(condition => rankings.find(r => r.condition_id === condition.condition_id)?.rating === 3)
                    .map((condition, index) => (
                    <div
                        key={`${condition.condition_id}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, condition)}
                        className="bg-gray-400 text-white rounded-full px-4 py-2 mb-2 cursor-move text-center font-medium hover:bg-gray-500 transition-colors"
                    >
                        {condition.con_desc || condition.condition_name}
                    </div>
                    ))}
                </div>
                <div className="self-end">
                 <div className="flex bg-gray-700 px-4 py-3 text-center">
                    <p className="italic text-sm text-white font-medium">this makes me want to avoid the situation</p>
                </div>
                </div>
            </div>
            </div>

            {validationErrors.length > 0 && (
            <div className="text-red-500 text-center mb-4">
                {validationErrors.map((error, index) => (
                <p key={index}>{error}</p>
                ))}
            </div>
            )}
        </div>
        )}
        
            {/* Return Home */}
            <button onClick={() => navigate("/home")} className="absolute top-0 left-0 mt-2 mb-2 p-2 ml-4 font-afacad text-lg bg-black text-white">Return to Home</button>

            {/* Custom Anxiety */}
            <div className="flex justify-center mt-4">
            <button onClick={() => navigate("/custom-anxiety")}  className="font-afacad text-lg bg-black text-white">Create A Custom Anxiety Source</button>
            </div>
            
            {/* Submit */}
            <div className="flex justify-center mt-4">
            <button onClick={handleSubmit} className="font-afacad text-lg bg-black text-white">Submit</button>
            </div>
            
        </div>
        </div>

    );
};

export default AddAnxiety;
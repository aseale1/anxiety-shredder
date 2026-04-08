import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { mockAnxietySources, mockFactors, mockConditions } from "../mocks/mockAPIs";

const AddAnxiety: React.FC = () => {
    interface Condition {
        con_id: number;
        factor_id: number;
        condition_name: string;
        con_desc?: string;
        user_con_rating: { firebase_uid: string; con_id: number; rating: number }[];
    }

    const navigate = useNavigate();
    const location = useLocation();
    const demoUser = { uid: 'demo-user' };
    const [anxieties, setAnxieties] = useState<{ anx_id: number; anx_name: string }[]>([]);
    const [selectedAnxieties, setSelectedAnxieties] = useState<number | null>(null);
    const [factors, setFactors] = useState<{ factor_id: number; factor_name: string }[]>([]);
    const [selectedFactors, setSelectedFactors] = useState<{ factor_id: number; factor_name: string }[]>([]);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [rankings, setRankings] = useState<{ con_id: number; rating: number }[]>([]);  
    const [selectedFactorName, setSelectedFactorName] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({0: 0, 1: 0, 2: 0, 3: 0});
    const [factorCounts, setFactorCounts] = useState<Record<number, Set<number>>>({0: new Set(), 1: new Set(), 2: new Set(), 3: new Set()});
    const [canSubmit, setCanSubmit] = useState(false);
    const [customAnxietyData, setCustomAnxietyData] = useState<any>(null);
    const [isCustomAnxiety, setIsCustomAnxiety] = useState(false);

    useEffect(() => {
        const fetchMockAnxieties = async () => {
            try {
                const mockAnxData = await mockAnxietySources();
                setAnxieties(mockAnxData.map(anx => ({ anx_id: anx.anx_id, anx_name: anx.anx_name })));
            } catch (error) {
                console.error("Error fetching anxieties:", error);
            }
        };
        fetchMockAnxieties();

        if (location.state?.customAnxietyId) {
            const customData = sessionStorage.getItem('current-custom-anxiety');
            if (customData) {
                const parsedData = JSON.parse(customData);
                //setAnxieties(prev => [...prev, { anx_id: parsedData.anxiety.anx_id, anx_name: parsedData.anxiety.anx_name }]);
                
                 const customAnxiety = {
                    anx_id: parsedData.anxiety.anx_id,
                    anx_name: parsedData.anxiety.anx_name
                };
                
                setAnxieties(prev => [...prev, customAnxiety]);
                setSelectedAnxieties(parsedData.anxiety.anx_id);
                setFactors(parsedData.factors);
                setSelectedFactors(parsedData.factors);
                setCustomAnxietyData(parsedData);
                setIsCustomAnxiety(true);

                const formattedConditions = parsedData.conditions.map((condition: any) => ({
                    con_id: condition.con_id,
                    factor_id: condition.factor_id,
                    condition_name: condition.condition_name,
                    con_desc: condition.con_desc,
                    user_con_rating:  []
                }));
                setConditions(formattedConditions);

                const factorNames = parsedData.factors.map((f: any) => f.factor_name).join(", ");
                setSelectedFactorName(factorNames);

                sessionStorage.removeItem('current-custom-anxiety');
            }
        }
    }, [location.state]);

    const handleAnxietySelect = async (anxiety: any) => {
        setSelectedAnxieties(anxiety);
        setSelectedFactors([]);
        setConditions([]);
        setRankings([]);
        setSelectedFactorName(null);
        setIsCustomAnxiety(false);
        setCustomAnxietyData(null);

        try {
            const currentAnxiety = anxieties.find((anx: any) => anx.anx_id === anxiety);
            if (currentAnxiety && currentAnxiety.anx_id >=100) {
                // If it's a custom anxiety, data should be loaded from useEffect
                return;
            }
            const customData = sessionStorage.getItem('custom-anxiety');
            if (customData) {
                const customAnxieties = JSON.parse(customData);
                const customAnxiety = customAnxieties.find((custom: any) => custom.anxiety.anx_id === anxiety);
                if (customAnxiety) {
                    setFactors(customAnxiety.factors);
                    setSelectedFactors(customAnxiety.factors);
                    setIsCustomAnxiety(true);
                    setCustomAnxietyData(customAnxiety);
               
                    const formattedConditions = customAnxiety.conditions.map((condition: any) => ({
                        con_id: condition.con_id,
                        factor_id: condition.factor_id,
                        condition_name: condition.condition_name,
                        con_desc: condition.con_desc,
                        user_con_rating: []
                    }));
                    setConditions(formattedConditions);
                    
                    const factorNames = customAnxiety.factors.map((f: any) => f.factor_name).join(", ");
                    setSelectedFactorName(factorNames);
                    return;
                }
            }

            // Not custom - fetch from mock data        
            const mockFactorsData = await mockFactors();
            const filteredFactors = mockFactorsData.filter(factor => factor.anx_id === anxiety);
            setFactors(filteredFactors);
        } catch (error) {
            console.error("Error fetching factors:", error);
        }
    }

    // Function to handle factor selection and fetch conditions
    const handleFactorSelect = (factor: any) => {
        const isAlreadySelected = selectedFactors.some(f => f.factor_id === factor.factor_id);
        
        if (isAlreadySelected) {
            setSelectedFactors(selectedFactors.filter(f => f.factor_id !== factor.factor_id));
            setConditions(conditions.filter(c => c.factor_id !== factor.factor_id));
            setRankings(rankings.filter(r => {
                const conditionBelongsToFactor = conditions.some(
                c => c.con_id === r.con_id && c.factor_id === factor.factor_id
                );
                return !conditionBelongsToFactor;
            }));
            
            const newFactorNames = selectedFactors
                .filter(f => f.factor_id !== factor.factor_id)
                .map(f => f.factor_name)
                .join(", ");
            setSelectedFactorName(newFactorNames || null);
            } else {
            setSelectedFactors([...selectedFactors, factor]);
            
            const newFactorName = selectedFactorName 
                ? `${selectedFactorName}, ${factor.factor_name}` 
                : factor.factor_name;
            setSelectedFactorName(newFactorName);
            
            if (!demoUser) {
                console.error("User authentication error");
                return;
        }

        const fetchConditions = async () => {
            try {
                if (isCustomAnxiety && customAnxietyData) {
                    const customConditions = customAnxietyData.conditions.filter(
                        (condition: any) => condition.factor_id === factor.factor_id);
                    const conditionsWithFactorId = customConditions.map((condition: any) => ({
                        con_id: condition.con_id,
                        factor_id: factor.factor_id,
                        condition_name: condition.condition_name,
                        con_desc: condition.con_desc || condition.condition_name,
                        user_con_rating: []
                    }));
                    setConditions((prevConditions) => [...prevConditions, ...conditionsWithFactorId]);
                    return;
                }
                const mockConditionsData = await mockConditions();
                const filteredConditions = mockConditionsData.filter(
                    condition => condition.factor_id === factor.factor_id);
                console.log(`Filtered conditions for factor ${factor.factor_name}:`, filteredConditions);
                
                const conditionsWithFactorId = filteredConditions.map((condition: any) => ({
                    ...condition,
                    factor_id: factor.factor_id,
                    condition_id: condition.con_id,
                }));
                setConditions((prevConditions) => [...prevConditions, ...conditionsWithFactorId]);
                console.log("Updated conditions:", conditionsWithFactorId);
            } catch (error) {
                console.error("Error fetching conditions:", error);
            }
        };
        fetchConditions();
    }
    setTimeout(() => validateSelections(), 0);
};
    
    const handleRankingChange = (condition_id: number | null, factor_id: number, condition_name: string, rating: number) => {
        console.log('condition_id when handleRankingChange:', condition_id);
        console.log(`Rating for condition ${condition_name} changed to ${rating}`);
        
        if (condition_id === null || condition_id === undefined) {
            console.error("condition_id is null or undefined for condition:", condition_name);
            return;
        }
        
        setRankings((prevRankings) => {
        const newRankings = [...prevRankings];
        const existingRankingIndex = newRankings.findIndex((r) => r.con_id === condition_id);
        
        let oldRating: number | null = null;
        if (existingRankingIndex !== -1) {
            oldRating = newRankings[existingRankingIndex].rating;
            newRankings[existingRankingIndex].rating = rating;
        } else {
            newRankings.push({ con_id: condition_id, rating });
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
        const hasRating3 = ratingCounts[3] >= 3;

        if (!hasRating1) {
            errors.push("Please rate at least 3 conditions as '1-somewhat anxious'");
        }
        
        if (!hasRating2) {
            errors.push("Please rate at least 3 conditions as '2-very anxious'");
        }
        
        if (!hasRating3) {
            errors.push("Please rate at least 3 conditions as '3-extremely anxious'");
        }

        const ratedFactors = new Set([
            ...factorCounts[1],
            ...factorCounts[2],
            ...factorCounts[3]
        ]);

        if (ratedFactors.size < 3) {
            errors.push("Please rate conditions from at least 3 different factors.");
        }

        const ratedConditions = new Set(rankings.map(r => r.con_id));
        const allAssignedConditions = conditions.every(c => ratedConditions.has(c.con_id));

        setValidationErrors(errors);
        setCanSubmit(errors.length === 0 && allAssignedConditions);
    };

    const handleDragStart = (e: React.DragEvent, condition: any) => {
    if (!condition || !condition.con_id) {
        console.error("Invalid condition data:", condition);
        return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(condition));
    };

    const handleDrop = (e: React.DragEvent, rating: number) => {
    e.preventDefault();
    const conditionData = JSON.parse(e.dataTransfer.getData('text/plain'));

    if (!conditionData || !conditionData.con_id) {
    console.error("Invalid condition data:", conditionData);
    return;
  }
    
    handleRankingChange(
        conditionData.con_id,
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

        const mountainData = {
            anxiety_id: selectedAnxieties,
            factors: selectedFactors.map(f => ({ 
                factor_id: f.factor_id,
                factor_name: f.factor_name
            })),
            conditions: conditions.map(c => ({
                con_id: c.con_id,
                factor_id: c.factor_id,
                condition_name: c.condition_name,
                con_desc: c.con_desc,
                rating: rankings.find(r => r.con_id === c.con_id)?.rating || 0
            })),
            ratings: rankings,
            isCustom: isCustomAnxiety
        };
        sessionStorage.setItem('demo-anxiety', JSON.stringify(mountainData));
        navigate(`/generate-mountain/${selectedAnxieties}`);
    };

    return (
        <div className="min-h-screen w-screen bg-mountain bg-cover bg-center bg-fixed flex justify-center items-start relative p-8">
        <div className="absolute min-h-full inset-0 bg-black bg-cover opacity-50"></div>
        <div className="relative w-full max-w-6xl bg-amber-50 rounded-lg p-8 m-4">
        <h1 className="text-black text-center mb-4 pt-8">
            What's making you feel anxious?
            </h1>
        <div className="border-b-2 border-black mb-6"></div>

            {/* Display untracked anxieties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {anxieties.map((anxiety) => (
                    <button 
                        key={anxiety.anx_id}
                        className={`btn-primary text-black py-3 px-6 ${selectedAnxieties === anxiety.anx_id 
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
                <div className="mb-8">
                    <h3 className="text-black text-center mt-4 mb-6">What about {anxieties.find((a) => a.anx_id === selectedAnxieties)?.anx_name} causes anxiety?</h3>
                    <div className="space-y-3 max-w-2xl mx-auto">
                    {factors.map((factor) => (
                        <label key={factor.factor_id} className="flex items-center p-4 bg-slate-400 rounded-lg cursor-pointer hover:bg-slate-500 transition-colors">
                            <input
                                type="checkbox"
                                checked={selectedFactors.some((f) => f.factor_id === factor.factor_id)}
                                onChange={() => handleFactorSelect(factor)}
                                className="w-6 h-6 mr-4 accent-slate-600"
                            />
                            <span className="text-white font-medium text-xl">{factor.factor_name}</span>
                        </label>
                    ))}
                </div>
                </div>
            )}

            {/* Display conditions for selected factors */}
            {selectedFactorName && conditions && conditions.length > 0 && (
        <div>
            <h3 className="text-black text-center mb-2 mt-4">
            When it comes to those factors, how anxious do the following conditions make you feel?
            </h3>
            <p className="italic text-black text-center mb-4">
            drag and drop to sort conditions into the categories that best describe how anxious they make you feel
            </p>

            {/* Unassigned Conditions */}
            {conditions.filter(condition => !rankings.find(r => r.con_id === condition.con_id)).length > 0 && (
            <div className="border-2 border-gray-500 min-h-[100px] p-4 mb-4">
            <h3 className="text-center mb-2 text-black">Unassigned Conditions</h3>
            <div className="flex flex-wrap gap-2">
                {conditions
                .filter(condition => !rankings.find(r => r.con_id === condition.con_id))
                .map((condition, index) => (
                    <div
                    key={`${condition.con_id}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, condition)}
                    className="bg-gray-400 text-white rounded-full px-4 py-2 mb-2 cursor-move text-center font-medium hover:bg-gray-500 transition-colors"
                    >
                    {condition.con_desc || condition.condition_name}
                    </div>
                ))}
            </div>
            </div>
            )}
            
            <div className="grid grid-cols-4 gap-2 mb-6">
            {/* Rating Column 0 - No Problem */}
            <div className="bg-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-300 px-4 py-3">
                    <h3 className="text-center font-bold mb-1 text-2xl text-black">no problem!</h3>
                </div>
                <div
                className="min-h-[400px] p-4 flex-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 0)}
                >
                {conditions
                    .filter(condition => rankings.find(r => r.con_id === condition.con_id)?.rating === 0)
                    .map((condition, index) => (
                    <div
                        key={`${condition.con_id}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, condition)}
                        className="bg-gray-400 text-white rounded-full px-4 py-2 mb-2 cursor-move text-center font-medium hover:bg-gray-500 transition-colors"
                    >
                        {condition.con_desc || condition.condition_name}
                    </div>
                    ))}
                </div>
                <div className="bg-gray-300 px-4 py-3 text-center">
                    <p className="italic text-md text-black">this doesn't really bother me at all</p>
                </div>
            </div>

            {/* Rating Column 1 - A Little Anxious */}
            <div className="bg-green-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-green-500 px-4 py-3">
                <h3 className="text-center font-bold text-2xl text-white mb-1">a little anxious</h3>
                </div>
                <div
                className="min-h-[400px] p-4 flex-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 1)}
                >
                {conditions
                    .filter(condition => rankings.find(r => r.con_id === condition.con_id)?.rating === 1)
                    .map((condition, index) => (
                    <div
                        key={`${condition.con_id}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, condition)}
                        className="bg-gray-400 text-white rounded-full px-4 py-2 mb-2 cursor-move text-center font-medium hover:bg-gray-500 transition-colors"
                    >
                        {condition.con_desc || condition.condition_name}
                    </div>
                    ))}
                </div>
                <div className="bg-green-500 px-4 py-3 text-center">
                    <p className="italic text-md text-white">this makes my heart beat faster</p>
                </div>
            </div>

            {/* Rating Column 2 - Very Anxious */}
            <div className="bg-blue-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-blue-500 px-4 py-3">
                <h3 className="text-center font-bold text-2xl text-white mb-1">very anxious</h3>
                </div>
                <div
                    className="min-h-[400px] p-4 flex-1"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, 2)}
                >
                {conditions
                    .filter(condition => rankings.find(r => r.con_id === condition.con_id)?.rating === 2)
                    .map((condition, index) => (
                    <div
                        key={`${condition.con_id}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, condition)}
                        className="bg-gray-400 text-white rounded-full px-4 py-2 mb-2 cursor-move text-center font-medium hover:bg-gray-500 transition-colors"
                    >
                        {condition.con_desc || condition.condition_name}
                    </div>
                    ))}
                </div>
                <div className="bg-blue-500 px-4 py-3 text-center">
                    <p className="italic text-md text-white">this makes me feel uneasy and maybe nauseous</p>
                </div>
            </div>

            {/* Rating Column 3 - Extremely Anxious */}
            <div className="bg-gray-500 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-700 px-4 py-3">
                <h3 className="text-center font-bold text-2xl text-white mb-1">extremely anxious</h3>
                </div>
                <div
                className="min-h-[400px] p-4 flex-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 3)}
                >
                {conditions
                    .filter(condition => rankings.find(r => r.con_id === condition.con_id)?.rating === 3)
                    .map((condition, index) => (
                    <div
                        key={`${condition.con_id}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, condition)}
                        className="bg-gray-400 text-white rounded-full px-4 py-2 mb-2 cursor-move text-center font-medium hover:bg-gray-500 transition-colors"
                    >
                        {condition.con_desc || condition.condition_name}
                    </div>
                    ))}
                </div>
                 <div className="flex bg-gray-700 px-4 py-3 text-center">
                    <p className="italic text-md text-white">this makes me want to avoid the situation</p>
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

            {/* Custom Anxiety */}
            <div className="flex justify-center mt-4">
            <button 
            onClick={() => navigate("/custom-anxiety")}  
            className="btn-navigate">Create Custom Anxiety Source</button>
            </div>
            
            {/* Generate Mountain */}
            <div className="flex justify-center mt-4">
            <button 
                className="btn-secondary"
                onClick={handleSubmit}
                disabled={!canSubmit}
                >
                    Generate Mountain
                </button>
            </div>
        </div>
        </div>

    );
};

export default AddAnxiety;
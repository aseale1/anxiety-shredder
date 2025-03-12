import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { CHALLENGE_LEVELS, CHALLENGE_COLORS, CHALLENGE_SHAPES } from "../constants/challengeStyles";


const ViewProgress: React.FC = () => {
    interface Anxiety {
        anx_name: string;
    }
    interface Condition {
        condition_id: number;
        factor_id: number;
        condition_name: string;
        user_con_rating: { firebase_uid: string; con_id: number; rating: number }[];
    }

    const { anx_id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [anxiety, setAnxiety] = useState<Anxiety | null>(null);
    const [factors, setFactors] = useState<any[]>([]);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [challenge, setChallenge] = useState<string | null>(null);
    const [detailsVisible, setDetailsVisible] = useState<boolean>(false);
    const [challengeDescription, setChallengeDescription] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnxietyAndFactors = async () => {
            try {
                if (currentUser){
                    const anxResponse = await axios.get(`/api/anxieties/${anx_id}`);
                    setAnxiety(anxResponse.data);

                    const factorResponse = await axios.get(`/api/${currentUser?.uid}/anxieties/${anx_id}/factors`);
                    const factorsData = factorResponse.data;
                    setFactors(factorsData);

                    const conditionsData = await Promise.all(
                        factorsData.map(async (factor: any) => {
                            const conditionResponse = await axios.get(`/api/${currentUser?.uid}/factors/${factor.factor_id}/conditions`);
                            return conditionResponse.data;
                        })
                    );
    
                    // Flatten the array of conditions arrays
                    console.log("Conditions data (flattened):", conditionsData.flat());
                    setConditions(conditionsData.flat());
                }
                
            } catch (error) {
                console.error("Error fetching anxiety and factors:", error);
            }
        };
        fetchAnxietyAndFactors();
    }, [anx_id, currentUser]);

    const handleDeleteAnxiety = async () => {
        try {
            const confirmDelete = window.confirm("Are you sure you want to remove this anxiety?");
            if (confirmDelete) {
                await axios.delete(`/api/${currentUser?.uid}/anxieties/${anx_id}/delete-anx`);
                navigate("/home");
            }
        } catch (error) {
            console.error("Error deleting anxiety:", error);
        }
    };

    const handleDeleteFactor = async (factor_id: number) => {
        try {
            const confirmDelete = window.confirm("Are you sure you want to remove this factor?");
            if (confirmDelete) {
                await axios.delete(`/api/${currentUser?.uid}/factors/${factor_id}/delete-factor`);
                setFactors(factors.filter(factor => factor.factor_id !== factor_id));
            }
        } catch (error) {
            console.error("Error deleting factor:", error);
        }
    };

    const handleGenerateChallenge = async (chall_level: string) => {
        console.log('Generating challenge with params:', {
            firebase_uid: currentUser?.uid,
            anx_id: anx_id,
            chall_level,
        });
        try {
            const response = await axios.post(`/api/generate-challenge`, {
                firebase_uid: currentUser?.uid,
                anx_id: anx_id,
                chall_level
            });
            console.log('Generated challenge response:', response.data); 
            setChallengeDescription(`To complete a ${chall_level.toUpperCase()} challenge, try these conditions: ${response.data.description}`);
            setError(null);
        } catch (error: any) {
            console.error('Error generating challenge:', error);
        if (error.response && error.response.status === 500) {
                console.log('Error response:', error.response.data.error);
                setError(error.response.data.error);
            } else {
                setError("Error generating challenge. Please try again.");
            }
            setChallengeDescription(null);
    }
};

    return (
        <div className="h-screen w-screen bg-amber-50">
            {/* Display Anxiety Name */}
            {anxiety && ( <h1 className="text-6xl text-center text-black font-blaka">{anxiety.anx_name}</h1> )}
    
            {/* Edit Mode Button */}
            <button className="absolute top-0 right-0 mt-2 p-2 bg-red-400 text-white" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancel" : "Edit"}
            </button>
    
            {/* Delete Anxiety Button */}
            {editMode && (
                <button className="mt-2 p-2 font-lato bg-red-600 text-white" onClick={handleDeleteAnxiety}>
                    Remove Anxiety
                </button>
            )}

            {/* View Details Button */}
            <button className="mt-2 p-2 font-lato bg-[#7f85a1] text-white" onClick={() => setDetailsVisible(!detailsVisible)}>
                {detailsVisible ? "Hide Details" : "View Details"}
            </button>
    
            {/* Display Factors & Their Conditions */}
            {detailsVisible && factors.map((factor) => (
                <div key={factor.factor_id} className="flex flex-col mt-4">
                    <h2 className="text-xl text-black font-semibold">{factor.factor_name}</h2>
                    {conditions
                        .filter((condition) => condition.factor_id === factor.factor_id)
                        .map((condition) => (
                            <div key={condition.condition_id} className="flex items-center">
                               <span className="text-lg text-black font-lato">
                                    - {condition.condition_name}: {condition.user_con_rating.length > 0 ? condition.user_con_rating[0].rating : "No rating"}
                                </span>

                                {editMode && (
                                    <button className="ml-2 p-2 font-lato bg-red-450 text-white" onClick={() => handleDeleteFactor(factor.factor_id)}>
                                        Remove Factor
                                    </button>
                                )}
                            </div>
                        ))}
                </div>
            ))}

            {/* Challenge Buttons */}
            <div className="mt-4 flex flex-wrap gap-4">
            {(CHALLENGE_LEVELS as (keyof typeof CHALLENGE_COLORS)[]).map((level) => {
                    if (level === "Black" || level === "DoubleBlack") {
                        return (
                            <button 
                                key={level} 
                                className={`${CHALLENGE_COLORS[level]} ${CHALLENGE_SHAPES[level]}`}
                                onClick={() => handleGenerateChallenge(level)}
                            >
                                {/* Counter-rotate the text so it appears straight */}
                                <span className="-rotate-45">{level}</span>
                            </button>
                        );
                    }
                    
                    // Regular handling for other shapes
                    return (
                        <button 
                            key={level} 
                            className={`${CHALLENGE_COLORS[level]} ${CHALLENGE_SHAPES[level]}`}
                            onClick={() => handleGenerateChallenge(level)}
                        >
                            {level}
                        </button>
                    );
                })}
            </div>

            {/* Challenge Description */}
            {challengeDescription && (
                <p className="mt-4 text-lg text-black">{challengeDescription}</p>
            )}

            {/* Error Message */}
            {error && (
                <p className="mt-4 text-lg text-red-600">{error}</p>
            )}
            {/* Return Home */}
            <button onClick={() => navigate("/home")} className="mt-2 p-2 font-lato bg-[#7f85a1] text-white">Return to Home</button>

        </div>
    );    
};

export default ViewProgress;

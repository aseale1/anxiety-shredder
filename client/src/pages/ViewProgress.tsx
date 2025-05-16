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
    interface Challenge {
        chall_id: number;
        firebase_uid: string;
        anx_id: number;
        chall_level: string;
        completed: boolean;
        description: string;
    }

    const { anx_id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [anxiety, setAnxiety] = useState<Anxiety | null>(null);
    const [factors, setFactors] = useState<any[]>([]);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [currentChallLevel, setCurrentChallLevel] = useState<string | null>(null);
    //const [challenge, setChallenge] = useState<string | null>(null);
    const [detailsVisible, setDetailsVisible] = useState<boolean>(false);
    const [challengeDescription, setChallengeDescription] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewingChallenges, setViewingChallenges] = useState<boolean>(false);
    const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
    const [currentChallengeData, setCurrentChallengeData] = useState<Challenge | null>(null);

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


    const fetchActiveChallenges = async () => {
        try {
            if (currentUser) {
                const response = await axios.get(`/api/${currentUser.uid}/user-challenges`, {
                    params: {
                        firebase_uid: currentUser.uid,
                        anx_id: anx_id,
                    }
                });
                const activeChallenges = response.data.filter((challenge: Challenge) => !challenge.completed);
                setActiveChallenges(activeChallenges);
            }
        } catch (error) {
            console.error("Error fetching active challenges:", error);
            setError("Error fetching active challenges. Please try again.");
        }
    };


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
            setCurrentChallengeData(response.data);
            const conditions = response.data.description.split(', ');
            const formattedConditions: string = conditions.map((condition: string) => `\n• ${condition}`).join('');
            
            setChallengeDescription(`To complete a ${chall_level.toUpperCase()} challenge, try these conditions:${formattedConditions}`);
            setCurrentChallLevel(chall_level);
            setError(null);
            setViewingChallenges(false);
        } catch (error: any) {
            console.error('Error generating challenge:', error);
        if (error.response && error.response.status === 500) {
                console.log('Error response:', error.response.data.error);
                setError(error.response.data.error);
            } else {
                setError("Error generating challenge. Please try again.");
            }
            setChallengeDescription(null);
            setCurrentChallLevel(null);
            setCurrentChallengeData(null);
    }
};

    const handleTrackChallenge = () => {
        if (currentChallengeData) {
            alert("You are now tracking this challenge!");

            setChallengeDescription(null);
            setCurrentChallLevel(null);
            setCurrentChallengeData(null);
    }
};

    const handleMarkCompleted = async (chall_id: number) => {
        try {
            await axios.put(`api/complete-challenge`, {
                firebase_uid: currentUser?.uid,
                chall_id: chall_id,
            });
            setActiveChallenges(activeChallenges.filter(challenge => challenge.chall_id !== chall_id));
        } catch (error) {
            console.error("Error marking challenge as completed:", error);
            setError("Error marking challenge as completed.");
        }
    };
    const handleDeleteChallenge = async (chall_id: number) => {
        try {
            const confirmDelete = window.confirm("Are you sure you want to delete this challenge?");
            if (confirmDelete) {
                await axios.delete(`/api/delete-challenge`, {
                    data: {
                        firebase_uid: currentUser?.uid,
                        chall_id: chall_id
                    }
                });
                // Remove from the UI list without refetching
                setActiveChallenges(activeChallenges.filter(challenge => challenge.chall_id !== chall_id));
            }
        } catch (error) {
            console.error("Error deleting challenge:", error);
            setError("Failed to delete challenge. Please try again.");
        }
    };

    const handleViewChallenges = async () => {
        setViewingChallenges(true);
        setChallengeDescription(null);
        setCurrentChallLevel(null);
        setCurrentChallengeData(null);
        await fetchActiveChallenges();
    };

    const handleRegenerateChallenge = async () => {
        if (currentChallLevel && currentChallengeData) {
            // Delete the current challenge since we're regenerating
            try {
                await axios.delete(`/api/delete-challenge`, {
                    data: {
                        firebase_uid: currentUser?.uid,
                        chall_id: currentChallengeData.chall_id
                    }
                });
                // Generate a new one
                await handleGenerateChallenge(currentChallLevel);
            } catch (error) {
                console.error("Error during regeneration:", error);
                setError("Failed to regenerate challenge. Please try again.");
            }
        }
    };

    return (
        <div className="h-screen w-screen bg-amber-50">
            {/* Display Anxiety Name */}
            {anxiety && ( <h1 className="pt-16 text-6xl text-center text-black font-fast">{anxiety.anx_name}</h1> )}
    
            {/* Edit Mode Button */}
            <button className="absolute top-0 right-0 mt-2 p-2 mr-4 font-afacad text-lg  bg-red-400 text-white" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancel" : "Edit"}
            </button>
    
            {/* Delete Anxiety Button */}
            {editMode && (
                <button className="mt-2 p-2 font-afacad bg-red-600 text-white" onClick={handleDeleteAnxiety}>
                    Remove Anxiety
                </button>
            )}
            <div className="flex justify-center mt-5">
                
            {/* View Details Button */}
            <button className="p-2 font-afacad bg-[#7f85a1] text-white text-center" onClick={() => setDetailsVisible(!detailsVisible)}>
                {detailsVisible ? "Hide Details" : "View Anxiety  Details"}
            </button>
            </div>

            {/* View Active Challenges Button */}
            <div className="flex justify-center mt-5">
                <button className="p-2 font-afacad bg-[#7f85a1] text-white text-center" onClick={handleViewChallenges}>
                    View Active Challenges
                </button>
            </div>

            {/* Generate Mountain Button */}
            <div className="flex justify-center mt-5">
                <button className="p-2 font-afacad bg-[#7f85a1] text-white text-center" onClick={() => window.open("/generate-mountain/" + anx_id, "_blank", "noopener,noreferrer")}>
                    Generate Mountain
                </button>
            </div>
    
            {/* Display Factors & Their Conditions */}
            {detailsVisible && factors.map((factor) => (
                <div key={factor.factor_id} className="flex flex-col mt-4 ml-5">
                    <h2 className="text-xl text-black font-semibold">{factor.factor_name}</h2>
                    {conditions
                        .filter((condition) => condition.factor_id === factor.factor_id)
                        .map((condition) => (
                            <div key={condition.condition_id} className="flex items-center">
                               <span className="text-lg text-black font-afacad">
                                    - {condition.condition_name}: {condition.user_con_rating.length > 0 ? condition.user_con_rating[0].rating : "No rating"}
                                </span>

                                {editMode && (
                                    <button className="ml-2 p-2 font-afacad bg-red-450 text-white" onClick={() => handleDeleteFactor(factor.factor_id)}>
                                        Remove Factor
                                    </button>
                                )}
                            </div>
                        ))}
                </div>
            ))}

            {/* Display Active Challenges */}
            {viewingChallenges && (
                <div className="flex flex-col mt-4 ml-5">
                    <h2 className="text-xl text-black font-semibold">Active Challenges</h2>
                    {activeChallenges.length === 0 ? (
                        <p className="text-center text-lg text-black">No active challenges. Generate one to get started!</p>
                    ) : (
                        <ul className="space-y-4">
                            {activeChallenges.map((challenge) => (
                                <li key={challenge.chall_id} className="bg-white p-4 rounded-lg shadow">
                                    <div className="flex flex-col">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-black text-lg">
                                                Difficulty Level: {challenge.chall_level.toUpperCase()}
                                            </span>
                                            <div className="flex gap-">
                                                <button 
                                                    className="p-2 font-afacad bg-green-500 text-white rounded"
                                                    onClick={() => handleMarkCompleted(challenge.chall_id)}
                                                >
                                                    Completed
                                                </button>
                                                <button 
                                                    className="p-2 font-afacad bg-red-500 text-white rounded"
                                                    onClick={() => handleDeleteChallenge(challenge.chall_id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-black whitespace-pre-line">
                                            {challenge.description.split(', ').map(condition => `\n• ${condition}`).join('')}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="flex justify-center mt-6">
                        <button 
                            className="p-2 font-afacad bg-[#7f85a1] text-white text-center"
                            onClick={() => setViewingChallenges(false)}>Hide Active Challenges</button>
                    </div>
                </div>
            )}

            {/* Challenge Generator Section */}
            {!viewingChallenges && (
                <>
            {/* Challenge Buttons */}
            <p className="text-center mt-10 text-black text-lg italic font-afacad">click a button to generate a challenge</p>

            <div className="mt-4 flex flex-wrap justify-center gap-4">
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
                        <div className="mt-6 flex flex-col items-center">
                            <p className="text-lg text-center text-black whitespace-pre-line">{challengeDescription}</p>
                            
                            {/* Challenge Action Buttons */}
                            <div className="flex justify-center gap-4 mt-4">
                                
                                {/*
                                <button 
                                    className="p-2 font-afacad bg-blue-500 text-white rounded"
                                    onClick={handleRegenerateChallenge}
                                >
                                    Regenerate
                                </button>
                                */}

                                <button 
                                    className="p-2 font-afacad bg-[#7f85a1] text-white rounded"
                                    onClick={handleTrackChallenge}
                                >
                                    Track Challenge
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <p className="mt-4 text-lg text-center text-red-600">{error}</p>
                    )}
                </>
            )}

            {/* Return Home */}
            <button 
                onClick={() => navigate("/home")} 
                className="absolute top-0 left-0 mt-2 p-2 ml-4 font-afacad text-lg bg-[#7f85a1] text-white"
            >
                Return to Home
            </button>
        </div>
    );    
};


export default ViewProgress;

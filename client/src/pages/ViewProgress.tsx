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
        con_desc: string;
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

    interface ChallengePreview {
        firebase_uid: string;
        anx_id: number;
        chall_level: string;
        description: string;
        selectedConditions: {
            con_id: number;
            condition_name: string;
            factor_id: number;
        }[];
        preview: boolean;
    }

    interface Reminder {
        reminder_id: number;
        firebase_uid: string;
        chall_id: number;
        frequency: string | null; // 'daily', 'weekly', 'bi-weekly' or null
        last_sent: Date | null;
        reminder_enabled: boolean;
        created_at: Date;
        updated_at: Date;
    }

    const { anx_id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [anxiety, setAnxiety] = useState<Anxiety | null>(null);
    const [factors, setFactors] = useState<any[]>([]);
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [currentChallLevel, setCurrentChallLevel] = useState<string | null>(null);
    const [detailsVisible, setDetailsVisible] = useState<boolean>(false);
    const [challengeDescription, setChallengeDescription] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewingChallenges, setViewingChallenges] = useState<boolean>(false);
    const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
    const [currentChallengePreview, setCurrentChallengePreview] = useState<ChallengePreview | null>(null);
    const [challengeReminders, setChallengeReminders] = useState<{[key: number]: Reminder}>({});
    const [reminderDropdowns, setReminderDropdowns] = useState<{[key: number]: boolean}>({});

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

                const reminders: {[key: number]: Reminder} = {};
                for (const challenge of activeChallenges) {
                    try {
                        const reminderResponse = await axios.get(`/api/challenge/${challenge.chall_id}/reminder`, {
                            params: { firebase_uid: currentUser.uid,}
                        });
                        if (reminderResponse.data) {
                            reminders[challenge.chall_id] = reminderResponse.data;
                        }
                    } catch (error) {
                        console.error(`Error fetching reminder for challenge ${challenge.chall_id}:`, error);
                    }
                    }
                setChallengeReminders(reminders);

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
                chall_level,
                save: false // Don't save the challenge unless the user decides to track it
            });
            console.log('Generated challenge response:', response.data); 
            setCurrentChallengePreview(response.data);
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
            setCurrentChallengePreview(null);
    }
};

    const handleTrackChallenge = async () => {
        if (currentChallengePreview) {
            try {
                const response = await axios.post(`/api/save-challenge`, {
                    firebase_uid: currentUser?.uid,
                    anx_id: anx_id,
                    chall_level: currentChallengePreview.chall_level,
                    description: currentChallengePreview.description,
                    selectedConditions: currentChallengePreview.selectedConditions
                });
                
                console.log('Challenge saved response:', response.data);
                alert("Challenge has been tracked successfully!");
                
                // Reset the preview state
                setChallengeDescription(null);
                setCurrentChallLevel(null);
                setCurrentChallengePreview(null);
            } catch (error) {
                console.error('Error saving challenge:', error);
                setError("Error tracking challenge. Please try again.");
            }
        }
    };

    const handleCompleteChallenge = async (chall_id: number) => {
        try {
            const confirmComplete = window.confirm("Are you sure you want to mark this challenge as completed?");
            if (confirmComplete) {
                await axios.put(`/api/complete-challenge`, {
                    chall_id: chall_id,
                });

                setActiveChallenges(activeChallenges.filter(challenge => challenge.chall_id !== chall_id));

                const updatedReminders = { ...challengeReminders };
                delete updatedReminders[chall_id];
                setChallengeReminders(updatedReminders);
                alert("Challenge marked as completed!");
            }
        } catch (error) {
            console.error("Error completing challenge:", error);
            setError("Failed to mark challenge as completed. Please try again.");
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

    const handleReminderToggle = async (chall_id: number) => {
        setReminderDropdowns(prev => ({
            ...prev,
            [chall_id]: !prev[chall_id]
        }));
    };

    const handleSetReminder = async (chall_id: number, frequency: string) => {
        try {
            const response = await axios.post(`/api/create-update-reminder`, {
                firebase_uid: currentUser?.uid,
                chall_id: chall_id,
                reminder_enabled: true,
                frequency: frequency
            });

            setChallengeReminders(prev => ({
                ...prev,
                [chall_id]: response.data
            }));
            setReminderDropdowns(prev => ({
                ...prev,
                [chall_id]: false // Close the dropdown after setting the reminder
            }));
            alert(`Reminder set successfully for ${frequency}!`);
        } catch (error) {
            console.error("Error setting reminder:", error);
            setError("Failed to set reminder. Please try again.");
        }
    };

    const handleDisableReminder = async (chall_id: number) => {
        try {
            await axios.post(`/api/create-update-reminder`, {
                firebase_uid: currentUser?.uid,
                chall_id: chall_id,
                reminder_enabled: false,
                frequency: null // Disable the reminder
            });

            const updatedReminders = { ...challengeReminders };
            if (updatedReminders[chall_id]) {
                updatedReminders[chall_id].reminder_enabled = false;
                updatedReminders[chall_id].frequency = null;
            }
            setChallengeReminders(updatedReminders);

            alert("Reminder disabled successfully!");
        } catch (error) {
            console.error("Error disabling reminder:", error);
            setError("Failed to disable reminder. Please try again.");
        }
    };

    const handleSendTestReminder = async (chall_id: number) => {
        try {
            await axios.post(`/api/send-test-reminder`, {
                firebase_uid: currentUser?.uid,
                chall_id: chall_id
            });

            setReminderDropdowns(prev => ({
                ...prev,
                [chall_id]: false // Close the dropdown after sending the test reminder
            }));
            alert("Test reminder sent successfully!");
        } catch (error) {
            console.error("Error sending test reminder:", error);
            setError("Failed to send test reminder. Please try again.");
        }
    };
    const handleViewChallenges = async () => {
        if (viewingChallenges) {
            setViewingChallenges(false);
        } else {
        setViewingChallenges(true);
        setChallengeDescription(null);
        setCurrentChallLevel(null);
        setCurrentChallengePreview(null);
        await fetchActiveChallenges();
        }
    };

    return (
        <div className="min-h-screen w-screen bg-amber-50">
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
                    {viewingChallenges ? "Hide Active Challenges" : "View Active Challenges"}
                </button>
            </div>

            {/* Generate Mountain Button */}
            <div className="flex justify-center mt-5">
                <button className="p-2 font-afacad bg-[#7f85a1] text-white text-center" 
                onClick={() => {
                    if (currentUser?.uid) {
                    sessionStorage.setItem("firebase_uid", currentUser?.uid);
                    console.log("Setting sessionStorage firebase_uid:", currentUser.uid);
                    window.open(`/generate-mountain/${anx_id}`, "_blank", "noopener,noreferrer");
                } else {
                    console.error("No current user found.");
                }}}>
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
                                            {challengeReminders[challenge.chall_id]?.reminder_enabled && (
                                                <span className="text-sm font-afacad text-gray-600 italic"> 
                                                    Reminder frequency: {challengeReminders[challenge.chall_id]?.frequency}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-">
                                                <button 
                                                    className="p-2 font-afacad bg-green-500 text-white rounded"
                                                    onClick={() => handleCompleteChallenge(challenge.chall_id)}
                                                >
                                                    Completed
                                                </button>
                                                <div className="relative">
                                                    <button 
                                                        className="p-2 font-afacad bg-[#7f85a1] text-white rounded"
                                                        onClick={() => handleReminderToggle(challenge.chall_id)}
                                                    >
                                                        {challengeReminders[challenge.chall_id]?.reminder_enabled
                                                            ? `Reminder: ${challengeReminders[challenge.chall_id]?.frequency}`
                                                            : `Remind Me`}
                                                    </button>

                                                    {reminderDropdowns[challenge.chall_id] && (
                                                        <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-10">
                                                            <div className="py-1">
                                                                <button
                                                                    className="block px-4 py-2 text-sm text-white hover:bg-gray-500"
                                                                    onClick={() => handleSetReminder(challenge.chall_id, "daily")}
                                                                >
                                                                    Daily
                                                                </button>
                                                                <button
                                                                    className="block px-4 py-2 text-sm text-white hover:bg-gray-500"
                                                                    onClick={() => handleSetReminder(challenge.chall_id, "bi-weekly")}
                                                                >   
                                                                    Bi-Weekly
                                                                </button>
                                                                <button
                                                                    className="block px-4 py-2 text-sm text-white hover:bg-gray-500"
                                                                    onClick={() => handleSetReminder(challenge.chall_id, "weekly")}
                                                                >
                                                                    Weekly
                                                                </button>
                                                                <button
                                                                    className="block px-4 py-2 text-sm text-white hover:bg-gray-500"
                                                                    onClick={() => handleSendTestReminder(challenge.chall_id)}
                                                                >
                                                                    Send Test Reminder
                                                                </button>
                                                                {challengeReminders[challenge.chall_id]?.reminder_enabled && (
                                                                    <button
                                                                        className="block px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                                                                        onClick={() => handleDisableReminder(challenge.chall_id)}
                                                                    >
                                                                        Cancel Reminder
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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
                </div>
            )}

            {/* Challenge Generator Section */}
            {!viewingChallenges && !detailsVisible && (
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
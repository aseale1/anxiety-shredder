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
    const handleFactorSelect = (factor: any, anxiety: any) => {
        setSelectedFactors((prevFactors) => [...prevFactors, factor]);
        setSelectedFactorName((prevFactorName) => `${prevFactorName}, ${factor.factor_name}`);
        if (!currentUser) {
          console.error("User is not authenticated");
          return;
        }
        axios.get(`/api/factors/${factor.factor_id}/conditions`).then((response) => {
          console.log(`Fetched conditions for factor ${factor.factor_id} (${factor.factor_name}):`, response.data);
          setConditions((prevConditions) => [...prevConditions, ...response.data]);
          console.log("Conditions after fetching:", response.data);
        }).catch((error) => {
          console.error("Error fetching conditions:", error);
        });
      }

      const handleRankingChange = (factor_id: number, condition_name: string, condition_id: number, rating: number) => {
        console.log(`Rating for condition ${condition_name} changed to ${rating}`);
        setRankings((prevRankings) => {
          const newRankings = [...prevRankings];
          const existingRanking = newRankings.find((r) => r.condition_id === condition_id);
          if (existingRanking) {
            existingRanking.rating = rating;
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
            await axios.post(`/api/user-factor`, { firebase_uid: currentUser.uid, factor_id: factor.factor_id });
            }
            // Add conditions to user
            await axios.post(`/api/${currentUser.uid}/user-condition`, { firebase_uid: currentUser.uid, conditions: rankings });
        } catch (error) {
            console.error("Error adding anxiety, factors, and conditions:", error);
        }
    }


    return (
        <div className="min-h-screen w-screen bg-amber-50 p-4">
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
                                onChange={() => handleFactorSelect(factor, selectedAnxieties)}
                            />
                            {factor.factor_name}
                        </label>
                    ))}
                </div>
            )}

            {/* Display conditions for selected factors with a dropdown for ranking */}
            {selectedFactorName && conditions && conditions.length > 0 && (
            <div>
            <h2 className="text-xl text-black font-semibold mb-2">When it comes to these factors, how anxious do these conditions make you feel?</h2>
            <p className="italic text-black mb-2">0-not anxious at all, 1-somewhat anxious, 2-very anxious, 3-extremely anxious</p>
            {conditions.map((condition) => (
            <div key={condition.condition_id} className="mb-4">
                <label
                className="block text-black font-lato"
                >
                {condition.condition_name}
                </label>
                {[0, 1, 2, 3].map((rating) => (
                <label key={rating} className="inline-block mr-4 text-black">
                    <input
                    type="checkbox"
                    checked={rankings.find((r) => r.condition_id === condition.condition_id)?.rating === rating}
                    onChange={() => handleRankingChange(condition.factor_id, condition.condition_name, condition.condition_id, rating)}
                    />
                    {rating}
                </label>
                ))}
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

import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useParams,useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

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

    return (
        <div className="h-screen w-screen bg-amber-50">
            {/* Display Anxiety Name */}
            {anxiety && ( <h1 className="text-6xl text-center text-black font-blaka">{anxiety.anx_name}</h1> )}
    
            {/* Edit Mode Button */}
            <button className="absolute top-0 right-0 mt-2 p-2 bg-red-500 text-white" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancel" : "Edit"}
            </button>
    
            {/* Delete Anxiety Button */}
            {editMode && (
                <button className="mt-2 p-2 font-lato bg-red-600 text-white" onClick={handleDeleteAnxiety}>
                    Remove Anxiety
                </button>
            )}
    
            {/* Display Factors & Their Conditions */}
            {factors.map((factor) => (
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
                                    <button className="ml-2 p-2 font-lato bg-red-600 text-white" onClick={() => handleDeleteFactor(factor.factor_id)}>
                                        Remove Factor
                                    </button>
                                )}
                            </div>
                        ))}
                </div>
                        ))
                    }
        </div>
    );    

};
export default ViewProgress;

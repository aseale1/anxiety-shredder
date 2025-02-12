import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useParams,useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const ViewProgress: React.FC = () => {
    interface Anxiety {
        anx_name: string;
    }
    const { anx_id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [anxiety, setAnxiety] = useState<Anxiety | null>(null);
    const [factors, setFactors] = useState<{ factor_id: number; factor_name: string }[]>([]);
    const [editMode, setEditMode] = useState<boolean>(false);

    useEffect (() => {
        const fetchAnxietyAndFactors = async () => {
            try {
                // Fetch anxiety object
                console.log(`Fetching anxiety ${anxiety?.anx_name} with ID: ${anx_id}`);
                const anxResponse = await axios.get(`/api/anxieties/${anx_id}`);
                setAnxiety(anxResponse.data);

                // Fetch user's factors for the selected anxiety
                const factorResponse = await axios.get(`/api/user/${currentUser?.uid}/anxieties/${anx_id}/factors`);
                setFactors(Array.isArray(factorResponse.data) ? factorResponse.data : []);
                console.log(`Fetched factors for anxiety ${anxiety?.anx_name}:`, factorResponse.data);
            } catch (error) {  
                console.error("Error fetching factors for anxiety:", error);
            }
        };
        fetchAnxietyAndFactors();
    }, [anx_id, currentUser]);

    const handleDeleteAnxiety = async () => {
        try {
            const confirmDelete = window.confirm("Are you sure you want to remove this anxiety?");
            if (confirmDelete) {
                await axios.delete(`/api/user/${currentUser?.uid}/anxieties/${anx_id}/delete-anx`);
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
                await axios.delete(`/api/user/${currentUser?.uid}/factors/${factor_id}/delete-factor`);
                setFactors(factors.filter(factor => factor.factor_id !== factor_id));
            }
        } catch (error) {
            console.error("Error deleting factor:", error);
        }
    };

    return (
        <div className="h-screen w-screen bg-amber-50">
         {anxiety && <h1 className="text-6xl text-center text-black font-blaka">{anxiety.anx_name}</h1>}
         <button className="absolute top-0 right-0 mt-2 p-2 bg-red-500 text-white" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Cancel" : "Edit"}
         </button>
      {editMode && (
        <button className="mt-2 p-2 font-lato bg-red-600 text-white" onClick={handleDeleteAnxiety}>Remove Anxiety</button>
      )}
      <div className="mt-4" >
        {factors.map(factor => (
            <div key={factor.factor_id} className="mb-4">
            <h2 className="text-xl text-black font-semibold">- {factor.factor_name}</h2>
            {editMode && (
                <button className="mt-1 p-2 bg-red-500 text-white" onClick={() => handleDeleteFactor(factor.factor_id)}>
                Remove Factor
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

};
export default ViewProgress;

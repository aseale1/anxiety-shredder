import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
// import { CHALLENGE_LEVELS, CHALLENGE_COLORS, CHALLENGE_SHAPES } from "../constants/challengeStyles";

interface Challenge {
  challenge_id: number;
  challenge_name: string;
  description: string;
  chall_level: string;
}

const GenerateMountain: React.FC = () => {

    const { anx_id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [anxiety, setAnxiety] = useState<any>(null);
    const [generatedMountain, setGeneratedMountain] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            console.error('User is not logged in');
        }

        if (!anx_id) {
            console.error('anx_id parameter is missing');
        }

        const fetchAnxiety = async () => {
            try {
                const response = await axios.get(`/api/anxieties/${anx_id}`);
                setAnxiety(response.data);
            } catch (error) {
                console.error('Error fetching anxiety:', error);
                setError('Failed to fetch anxiety');
            }
        };

        fetchAnxiety();
    }, [anx_id, currentUser]);

    useEffect(() => {
        if (anxiety) {
            const generateFullMountain = async () => {
                try {
                    const maxChallsResponse = await axios.post(`/api/generate-max-challenges/${anx_id}`, {
                        firebase_uid: currentUser,
                        anx_id: anxiety.anx_id,
                    });

                    console.log('Full mountain generated:', maxChallsResponse.data);
                    setGeneratedMountain(maxChallsResponse.data);
                } catch (error) {
                    console.error('Error generating full mountain:', error);
                    setError('Failed to generate mountain');
                }
            };

            generateFullMountain();
        }
    }, [anxiety, anx_id, currentUser]);

    return (
            <div className="h-screen w-screen bg-amber-50">
                {anxiety && (
                    <h1 className="pt-4 text-2xl text-center text-black font-fast">
                        Your {anxiety.anx_name} Mountain
                    </h1>
                )}
                {Array.isArray(generatedMountain) && generatedMountain.length > 0 ? (
                    <div className="pl-4 pt-8 text-black font-afacad">
                        {generatedMountain.map((challenge: Challenge) => (
                            <div key={challenge.challenge_id}>
                                <h2 className="text-lg font-bold">{challenge.chall_level}</h2>
                                <p>{challenge.description}</p>

                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center mt-4">
                        {loading ? "Loading..." : "No challenges generated yet"}
                    </div>
                )}
            </div>
        );
    };

export default GenerateMountain;
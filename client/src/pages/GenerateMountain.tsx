import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { CHALLENGE_LEVELS, CHALLENGE_COLORS, CHALLENGE_SHAPES } from "../constants/challengeStyles";

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
    const [maxChallenges, setMaxChallenges] = useState<any>({});
    const [generatedMountain, setGeneratedMountain] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChallengeData = async () => {
            try {
                if (currentUser) {
                    const anxResponse = await axios.get(`/api/anxieties/${anx_id}`);
                    setAnxiety(anxResponse.data);

                    const maxChallengesResponse = await axios.get(`/api/generate-max-challenges/${anx_id}`);
                    setMaxChallenges(maxChallengesResponse.data);
                }} catch (err) {
                    console.error(err);
                    setError("Error fetching challenge data");
                } finally {
                    setLoading(false);
                }};

        fetchChallengeData();
    }, [anx_id, currentUser]);

    useEffect (() => {
        const generateFullMountain = async () => {
            try {
            if (currentUser && anxiety?.anx_id) {
                const response = await axios.post(`/api/generate-full-mountain`, {
                firebase_uid: currentUser.uid,
                anx_id: anxiety.anx_id,
                });
                console.log("Full mountain generated:", response.data);
                setGeneratedMountain(response.data);
            }
            } catch (error) {
            console.error("Error generating full mountain:", error);
            }};
        generateFullMountain();
        }, [anxiety, currentUser]);

    /*
    const handleGenerateFullMountain = async () => {
        // Logic to generate multiple challenges
        try {
            if (currentUser) {
                const response = await axios.post(`/api/generate-full-mountain`, {
                    firebase_uid: currentUser.uid,
                    anx_id: anxiety.anx_id,
                });
                console.log("Full mountain generated:", response.data);
                setGeneratedMountain(response.data);
            }
        } catch (error) {
            console.error("Error generating full mountain:", error);
            if (axios.isAxiosError(error)) {
                setError(error.response?.data.message || "An error occurred");
            } else {
                setError("An error occurred");
        }
        }
    };
    */

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
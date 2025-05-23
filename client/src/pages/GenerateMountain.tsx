import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

interface Challenge {
  description: string;
  chall_level: string;
  selectedConditions: {
    con_id: number;
    condition_name: string;
    con_desc?: string;
    factor_id: number;
  }[];
}

interface MaxChallenges {
    Green: number;
    Blue: number;
    Black: number;
    DoubleBlack: number;
}

const GenerateMountain: React.FC = () => {

    const { anx_id } = useParams();
    const { currentUser } = useAuth();
    const [anxiety, setAnxiety] = useState<any>(null);
    const [maxChallenges, setMaxChallenges] = useState<MaxChallenges | null>(null);
    const [generatedChallenges, setGeneratedChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

    useEffect(() => {
        let uid: string | null = null;
        if (currentUser) {
            uid = currentUser.uid;
            console.log('Using currentUser.uid:', uid);
        } else {
            uid = sessionStorage.getItem('firebase_uid');
            console.log('Using sessionStorage firebase.uid:', uid);
        }

        if (!uid) {
            console.error('User is not authenticated');
            setLoading(false);
            return;
        }

        setFirebaseUid(uid);

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
        if ( firebaseUid && anxiety) {
            const generateFullMountain = async () => {
                try {
                    const maxChallsResponse = await axios.post(`/api/generate-max-challenges`, {
                        firebase_uid: firebaseUid,
                        anx_id: anxiety.anx_id,
                    });

                    setMaxChallenges(maxChallsResponse.data);

                    const challenges: Challenge[] = [];

                    for (const level of Object.keys(maxChallsResponse.data) as Array<keyof MaxChallenges>) {
                        const maxCount = maxChallsResponse.data[level];

                        if (maxCount > 0) {

                            for (let i = 0; i < maxCount; i++) {
                                try {
                                    const challengeResponse = await axios.post(`/api/generate-challenge`, {
                                        firebase_uid: firebaseUid,
                                        anx_id: anxiety.anx_id,
                                        chall_level: level,
                                    });

                                    challenges.push({
                                        chall_level: level,
                                        description: challengeResponse.data.description,
                                        selectedConditions: challengeResponse.data.selectedConditions,
                                    });
                                } catch (error) {
                                    console.error('Error generating challenge:', error);
                                }
                            }
                        }
                    }
                    setGeneratedChallenges(challenges);
                    setLoading(false);
                } catch (error) {
                    console.error('Error generating full mountain:', error);
                    setLoading(false);
                }
            };
            
            generateFullMountain();
        }
    }, [anxiety, anx_id, firebaseUid]);

    return (
   <div className="min-h-screen w-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          
          {anxiety && (
            <h1 className="text-3xl text-center text-black font-fast flex-grow">
              Your "{anxiety.anx_name}" Mountain
            </h1>
          )}
          <div className="w-[100px]"></div>
        </div>
        <div className="text-center">
          <h2 className="mt-4 text-xl italic font-afacad text-black">Below is a list of all possible challenges based on your condition ratings</h2>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-700">Building your mountain...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-8">
            <p className="text-xl text-red-600">{error}</p>
          </div>
        )}

        {/* Mountain visualization */}
        {!loading && !error && (
          <div className="p-6">
            {maxChallenges && Object.entries(maxChallenges).map(([level, count]) => (
              <div key={level} className="mb-8">
                <h2 className={`text-xl text-black font-bold mb-2 ${count > 0 ? '' : 'text-gray-400'}`}>
                  {level} Level Challenges {count > 0 ? `(${count} possible)` : '(Not available)'}
                </h2>
                
                {count === 0 ? (
                  <p className="text-gray-500 italic">
                    You need more rated conditions to generate challenges at this level.
                  </p>
                ) : (
                  <div>
                    {generatedChallenges
                      .filter(challenge => challenge.chall_level === level)
                      .map((challenge, index) => (
                        <div 
                          key={`${level}-${index}`} 
                          className="p-4 mb-4 border rounded"
                        >
                          <h3 className="font-semibold text-black mb-2">Challenge {index + 1}</h3>
                          <p className="whitespace-pre-line text-black">
                            {challenge.description.split(', ').map(condition => `• ${condition}`).join('\n')}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateMountain;
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { mockAnxietySources, mockFactors, mockConditions, generateChallengeDemo } from "../mocks/mockAPIs";

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

interface Condition {
  con_id: number;
  condition_name: string;
  con_desc?: string;
  [key: string]: any;
}

interface CustomAnxiety {
  anxiety: {
    anx_id: number;
    anx_name: string;
  };
  factors: any[];
  conditions: any[];
}

interface AnxietySource {
  anx_id: number;
  anx_name: string;
}

const GenerateMountain: React.FC = () => {

    const { anx_id } = useParams();
    const demoUser = { uid: 'demo-user' };
    const [anxiety, setAnxiety] = useState<AnxietySource | null>(null);
    const [maxChallenges, setMaxChallenges] = useState<MaxChallenges | null>(null);
    const [generatedChallenges, setGeneratedChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

    useEffect(() => {
        const uid = 'demo-user';
        setFirebaseUid(uid);

        const fetchAnxiety = async () => {
          if (!anx_id) {
            setError('anx_id is undefined');
            return;
          }
            try {
              const customData = sessionStorage.getItem('custom-anxiety');
              if (customData) {
                const customAnxieties = JSON.parse(customData);
                const customAnxiety = customAnxieties.find((anx: CustomAnxiety) => 
                  anx.anxiety && anx.anxiety.anx_id.toString() === anx_id.toString());
                if (customAnxiety) {
                    setAnxiety(customAnxiety.anxiety);
                    return;
                }
              }
                const mockAnxieties = await mockAnxietySources();
                const foundAnxiety = mockAnxieties.find((anx: AnxietySource) =>
                  anx.anx_id && anx.anx_id.toString() === anx_id.toString());
                  
                if (foundAnxiety) {
                  setAnxiety(foundAnxiety);
                } else {
                  setError('Anxiety not found');
                }
            } catch (error) {
                console.error('Error fetching anxiety:', error);
                setError('Failed to fetch anxiety');
            }
        };

        fetchAnxiety();
    }, [anx_id]);

    useEffect(() => {
        if (anxiety) {
            const generateFullMountain = async () => {
                try {
                    const demoData = JSON.parse(sessionStorage.getItem('demo-anxiety') || '{}');
                    const userRatings = demoData.ratings || demoData.conditions || [];

                    const maxChallsResponse = {
                        Green: userRatings.filter((r: any) => r.rating === 1).length >= 3 ? 2 : 0,
                        Blue: userRatings.filter((r: any) => r.rating >= 1).length >= 3 ? 2 : 0,
                        Black: userRatings.filter((r: any) => r.rating >= 2).length >= 2 ? 1 : 0,
                        DoubleBlack: userRatings.filter((r: any) => r.rating === 3).length >= 1 ? 1 : 0,
                    };

                    setMaxChallenges(maxChallsResponse);

                    const challenges: Challenge[] = [];
                    const allConditions = await getAllConditions();

                    const conditionPool = userRatings
                        .filter((rating: any) => rating.rating > 0) // Only include rated conditions
                        .map((rating: any) => ({
                            condition: allConditions.find(c => c.con_id === rating.con_id),
                            rating: rating.rating
                        }))
                        .filter((item: any) => item.condition);

                        console.log('Condition Pool:', conditionPool);

                    for (const level of Object.keys(maxChallsResponse) as Array<keyof MaxChallenges>) {
                        const maxCount = maxChallsResponse[level];

                        if (maxCount > 0) {
                            for (let i = 0; i < maxCount; i++) {
                                try {
                                    const challengeResponse = await generateChallengeDemo(conditionPool, level);
                                        challenges.push({ ...challengeResponse, chall_level: challengeResponse.chall_level });
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

    const getAllConditions = async (): Promise<Condition[]> => {
      try {
        const mockConditionsData = await mockConditions();
        const demoData = JSON.parse(sessionStorage.getItem('demo-anxiety') || '{}');

        if (demoData.isCustom || demoData.conditions) {
          const customConditions: Condition[] = demoData.conditions || [];
          console.log('Using Custom Conditions:', customConditions);
          return [...mockConditionsData, ...customConditions];
        }
        return mockConditionsData;
      } catch (error) {
        console.error('Error fetching conditions:', error);
        return await mockConditions();
      }
    };

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
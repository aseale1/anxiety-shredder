import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate, useLocation } from "react-router-dom";

interface Factor {
    id: string; //temporary ID for frontend use
    factor_name: string;
    conditions: Condition[];
}
interface Condition {
    id: string; //temporary ID for frontend use
    condition_name: string;
    con_desc?: string;
}

const CustomAnxiety: React.FC = () => {
    const navigate = useNavigate();
    const demoUser = { uid: 'demo-user' };
    const [anxietyName, setAnxietyName] = useState('');
    const [factors, setFactors] = useState<Factor[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        addFactor(); // Initialize 1 empty factor
    }, []);
    
    const generateId = () => Math.random().toString(36).substring(2, 9);

    const addFactor = () => {
        // if (factors.length >= 10) return;
        const newFactor: Factor = {
            id: generateId(),
            factor_name: '',
            conditions: [],
        };
        setFactors([...factors, newFactor]);
    };

    const removeFactor = (id: string) => {
        setFactors(factors.filter(factor => factor.id !== id));
    };

    const updateFactorName = (id: string, name: string) => {
        setFactors(factors.map(factor =>
            factor.id === id ? { ...factor, factor_name: name } : factor
        ));
    };
    const addCondition = (factorId: string) => {
        setFactors(factors.map(factor => {
            if (factor.id === factorId) {
                const newCondition: Condition = {
                    id: generateId(),
                    condition_name: '',
                    con_desc: '',
                };
                return { ...factor, conditions: [...factor.conditions, newCondition] };
            }
            return factor;
        }
        ));
    };

    const removeCondition = (factorId: string, conditionId: string) => {
        setFactors(factors.map(factor => 
            factor.id === factorId 
                ? { ...factor, conditions: factor.conditions.filter(c => c.id !== conditionId) }
                : factor
        ));
    };
    const updateCondition = (factorId: string, conditionId: string, field: keyof Condition, value: string) => {
        setFactors(factors.map(f => 
            f.id === factorId 
                ? {
                    ...f, 
                    conditions: f.conditions.map(c => 
                        c.id === conditionId ? { ...c, [field]: value } : c
                    )
                }
                : f
        ));
    };

    //TODO: Add validation for empty fields

    const location = useLocation();
    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            const existingCustomData = JSON.parse(sessionStorage.getItem('custom-anxiety') || '[]');
            const newAnxietyId = existingCustomData.length + 100;
            let currentFactorId = 999;
            let currentConditionId = 9999;

            const customAnxiety = {
                anx_id: newAnxietyId,
                anx_name: anxietyName
            };

            const customFactors = factors.map(factor => {
                const factorId = currentFactorId++;
                return {
                    factor_id: factorId,
                    anx_id: newAnxietyId,
                    factor_name: factor.factor_name,
                    conditions: factor.conditions.map(condition => ({
                        con_id: currentConditionId++,
                        factor_id: factorId,
                        condition_name: condition.condition_name,
                        con_desc: condition.con_desc || condition.condition_name
                    }))
                };
            });
            const customConditions = customFactors.flatMap(factor => factor.conditions);
            const newCustomData = {
                anxiety: customAnxiety,
                factors: customFactors.map(factor => ({
                    factor_id: factor.factor_id,
                    anx_id: factor.anx_id,
                    factor_name: factor.factor_name
                })),
                conditions: customConditions.map(condition => ({
                    con_id: condition.con_id,
                    factor_id: condition.factor_id,
                    condition_name: condition.condition_name,
                    con_desc: condition.con_desc
                }))
            };
            existingCustomData.push(newCustomData);
            sessionStorage.setItem('custom-anxiety', JSON.stringify(existingCustomData));
            sessionStorage.setItem('current-custom-anxiety', JSON.stringify({
                anxiety: customAnxiety,
                factors: customFactors.map(factor => ({
                    factor_id: factor.factor_id,
                    anx_id: factor.anx_id,
                    factor_name: factor.factor_name
                })),
                conditions: customConditions
            }));
            console.log('Custom anxiety created successfully:', newCustomData);
            navigate('/', { state: { customAnxietyId: newAnxietyId } }); // Navigate back to add anxiety page

        } catch (error) {
            console.error('Error creating custom anxiety:', error);
            setValidationErrors(['Failed to create custom anxiety. Please try again.']);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-screen bg-mountain bg-center flex justify-center items-center">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative w-full max-w-4xl bg-amber-50 rounded-lg p-8 m-4">
        <h1 className="text-5xl text-black text-center font-fast mb-4 pt-4">Create a Custom Anxiety Source</h1>
        <div className="border-b-2 border-black mb-6"></div>
       
        {/* Anxiety Name */}
        <div className="mb-4">
            <h2 className="text-2xl text-black font-afacad font-semibold mb-1">Anxiety Name</h2>
            
            <input
                type="text"
                value={anxietyName}
                onChange={(e) => setAnxietyName(e.target.value)}
                placeholder="ex. social events, standardized testing, etc."
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            </div> 

        {/* Factors */}
         <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={addFactor}
                    className="bg-[#7f85a1] text-white rounded-lg hover:opacity-75"
                >
                    Add A Factor
                </button>
                </div>
            {factors.map((factor, factorIndex) => (
                <div key={factor.id} className="mb-6 p-6 rounded-lg bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl text-black font-afacad font-semibold">
                            Factor {factorIndex + 1}
                        </h3>
                        {factors.length > 1 && (
                            <button
                                onClick={() => removeFactor(factor.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            > 
                                Remove This Factor
                            </button>
                        )} 
                    </div>
                    <div className="mb-4">
                        <label className="block text-black font-afacad text-xl mb-2">Factor Name</label>
                        <input
                            type="text"
                            value={factor.factor_name}
                            onChange={(e) => updateFactorName(factor.id, e.target.value)}
                            placeholder="ex. how many people are there, how long is the event, etc."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                    
                                    <button
                                        onClick={() => addCondition(factor.id)}
                                        className="bg-[#7f85a1] text-white rounded-lg hover:opacity-75"
                                    >
                                        Add A Condition
                                    </button>
                                </div>
                            {factor.conditions.map((condition, conditionIndex) => (
                                <div key={condition.id} className="mb-6 p-6 rounded-lg bg-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg text-black font-afacad font-semibold">
                                            Condition {conditionIndex + 1}
                                        </span>
                                        <button
                                            onClick={() => removeCondition(factor.id, condition.id)}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                            Remove This Condition
                                        </button>
                                        </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-black font-afacad text-xl mb-2">Condition Name</label>
                                            <input
                                                type="text"
                                                value={condition.condition_name}
                                                onChange={(e) => updateCondition(factor.id, condition.id, 'condition_name', e.target.value)}
                                                placeholder="ex. less than 10 people, 1 hour long, etc."
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            </div>
                                        <div>
                                            <label className="block text-black font-afacad text-xl mb-2">Condition Description</label>
                                            <input
                                                type="text"
                                                value={condition.con_desc || ''}
                                                onChange={(e) => updateCondition(factor.id, condition.id, 'con_desc', e.target.value)}
                                                placeholder="optional description"
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center pt-6 border-t-2 border-gray-300">
                                <button 
                                    onClick={() => navigate("/")} 
                                    className="bg-gray-500 text-white px-6 py-3 rounded-lg font-afacad text-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className={`bg-blue-500 text-white px-6 py-3 rounded-lg font-afacad text-lg hover:bg-blue-600 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    </div>
    );
};
export default CustomAnxiety;
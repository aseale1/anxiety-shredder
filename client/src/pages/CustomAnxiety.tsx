import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

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
    const { currentUser } = useAuth();
    const [anxietyName, setAnxietyName] = useState('');
    const [factors, setFactors] = useState<Factor[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (factors.length === 0) {
            addFactor(); // Initialize 1 empty factor
        }
    }, [factors]);
    
    const generateId = () => Math.random().toString(36).substring(2, 9);

    const addFactor = () => {
        // Uncomment following line to limit the number of factors
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

    const handleSubmit = async () => {
        if (!currentUser) {
            console.error("User is not authenticated");
            return;
        }

        setIsSubmitting(true);

        try {
            const requestData = {
                anx_name: anxietyName.trim(),
                firebase_uid: currentUser.uid,
                factors: factors.map(factor => ({
                    factor_name: factor.factor_name.trim(),
                    conditions: factor.conditions.map(condition => ({
                        condition_name: condition.condition_name.trim(),
                        con_desc: condition.con_desc?.trim() || condition.condition_name.trim()
                    }))
                }))
            };

            const response = await axios.post('/api/create-custom-anxiety', requestData);
              if (response.status === 201) {
                console.log('Custom anxiety created successfully');
                navigate('/add-anxiety'); // Navigate back to add anxiety page
            }
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
        <h1 className="text-black text-center mt-5 mb-2 pt-4">Create a Custom Anxiety Source</h1>
        <div className="border-b-2 border-black mb-6"></div>
       
        {/* Anxiety Name */}
        <div className="mb-4">
            <h3 className="text-black mb-1">Anxiety Name</h3>
            
            <input
                type="text"
                value={anxietyName}
                onChange={(e) => setAnxietyName(e.target.value)}
                placeholder="ex. social events, standardized testing, etc."
                className="w-full p-2 border border-gray-300 rounded-lg"
            />
            </div> 

        {/* Factors */}
         <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={addFactor}
                    className="btn-primary rounded-lg"
                >
                    Add A Factor
                </button>
                </div>
            {factors.map((factor, factorIndex) => (
                <div key={factor.id} className="mb-6 p-6 rounded-lg bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-black">
                            Factor {factorIndex + 1}
                        </h3>
                        {factors.length > 1 && (
                            <button
                                onClick={() => removeFactor(factor.id)}
                                className="px-4 py-2 btn-red"
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
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                    
                                    <button
                                        onClick={() => addCondition(factor.id)}
                                        className="btn-primary rounded-lg"
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
                                            className="btn-red px-4 py-2"
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
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                            </div>
                                        <div>
                                            <label className="block text-black font-afacad text-xl mb-2">Condition Description</label>
                                            <input
                                                type="text"
                                                value={condition.con_desc || ''}
                                                onChange={(e) => updateCondition(factor.id, condition.id, 'con_desc', e.target.value)}
                                                placeholder="optional description"
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </div>
                        ))}
                        </div>

                        {/* Return Home */}
                        <button 
                            onClick={() => navigate("/home")} 
                            className="btn-navigate absolute top-0 left-0 mt-2 ml-4"
                        >
                            Return to Home
                        </button>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            className={`btn-secondary w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isSubmitting}
                            >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                    </div>
                    
    );
};
export default CustomAnxiety;
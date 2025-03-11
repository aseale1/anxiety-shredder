import React, { useState } from 'react';
import { signUp } from '../firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import firebase from 'firebase/compat/app';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  // Create new account
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user } = await signUp(email, password);
      const userId = user.uid;
      const createUser = async () => {
        const response = await axios.post(`/api/new-user`, {
          firebase_uid: userId,
          email,
          first_name: firstName,
        });
        return response.data;
      };
  
      const newUser = await createUser();
      console.log('New user created:', newUser);
  
      navigate('/add-anxiety');
    } catch (err: any) {
      console.error(err);
      setError('Error signing up');
    }
  };
 
return (
  <div className="flex h-screen w-screen bg-skislope bg-center justify-center items-center">
    <div className="bg-amber-50 w-3/4 md:w-2/3 lg:w-1/2 p-8 rounded-md shadow-lg">
      <div className="text-center">
        {/* Header */}
        <div className="font-blaka text-black text-6xl mb-8">Welcome!</div>
        <div className="font-normal italic text-black text-2xl mb-8">create new account</div>

        {/* User Info Section */}
        <form onSubmit={handleSubmit}>
          <div className="text-lg text-black text-2xl font-lato mb-1">FIRST NAME</div>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-400 rounded-md"
          />

          <div className="text-lg text-black text-2xl font-lato mb-1">EMAIL ADDRESS</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-400 rounded-md"
          />

          <div className="text-lg text-black text-2xl font-lato mb-1">PASSWORD</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-400 rounded-md"
          />

          <div className="text-lg text-black text-2xl font-lato mb-1">CONFIRM PASSWORD</div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-400 rounded-md"
          />

          {error && <div className="text-red-500 mb-4">{error}</div>}

          {password !== confirmPassword && (
            <div className="text-red-500 mb-4">Passwords do not match</div>
          )}

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
            disabled={password !== confirmPassword}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  </div>
  );
};

export default SignUp;

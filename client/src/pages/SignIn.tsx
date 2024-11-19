import React, { useState } from 'react';
import { logIn } from '../firebase';
import { useNavigate } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await logIn(email, password);
    navigate('/home');
  } catch (err) {
    setError('Error signing in');
  }
};

  return (
    <div className="flex h-screen w-screen bg-skislope bg-center">
      {/* Left half */}
      <div className="w-1/2"></div>

      {/* Right half */}
      <div className="w-1/2 flex justify-center items-center bg-amber-50">
        <div className="text-center">
          {/* Header */}
          <div className="font-blaka text-black text-8xl mb-8">ANXIETY SHREDDER</div>
          <div className="font-normal italic text-black text-4xl mb-8">conquer your mountain</div>

          {/* Sign In Section */}
          <form onSubmit={handleSubmit}>
          <div className="text-lg text-black text-2xl font-lato mb-1">SIGN IN</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 mb-3 rounded-md border border-gray-300 bg-[#c4c6cf] focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 mb-3 rounded-md border border-gray-300 bg-[#c4c6cf] focus:outline-none"
          />
          <button type="submit" className="w-full p-2 mt-2 rounded-full bg-[#7f85a1] text-black font-lato">Sign In</button>
          </form>

          {/* Sign Up Section */}
          <div className="text-lg text-black font-lato mt-6 mb-4">FIRST TIME HERE?</div>
          <button className="w-full p-2 rounded-full bg-[#7f85a1] text-black font-lato">Sign Up</button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

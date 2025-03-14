import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserData {
  firebase_uid: string;
  email: string;
  first_name: string;
}
interface UserAnx {
  firebase_uid: string;
  anx_id: number;
  anxiety_source: AnxSource;
}
interface AnxSource {
  anx_id: number;
  anx_name: string;
}

const Home = () => {
  const { currentUser } = useAuth(); 
  const [userData, setUserData] = useState<UserData | null>(null);
  const [anxieties, setAnxieties] = useState<UserAnx[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = async (uid: string) => {
    const response = await axios.get(`/api/${uid}`);
    return response.data;
  };

  const fetchUserAnxieties = async (uid: string) => {
    const response = await axios.get(`/api/${uid}/anxieties`);
    return response.data;
  };

  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        setLoading(true);
        try {
      // Promise.all fetches both data points simultaneously
          const [user, anxieties] = await Promise.all([
            fetchUserData(currentUser.uid),
            fetchUserAnxieties(currentUser.uid),
          ]);
          setUserData(user);
          setAnxieties(anxieties);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [currentUser]);


  if (loading) return <p className='h-screen w-screen bg-amber-50 text-center text-2xl text-black font-fast'>Loading...</p>;

  return (
    <div className="relative h-screen w-screen">
    <div className="absolute inset-0 bg-mountain bg-center brightness-150 opacity-80"></div>
    
    <div className="relative z-10 pt-10">
    <div className="bg-amber-50 max-w-2xl mx-auto rounded-xl p-6 shadow-lg">
      <h1 className="text-center text-black font-fast">
        Welcome, {userData?.first_name || 'Loading...'}
      </h1>
      {loading ? (
        <p className="text-center text-black font-afacad">Loading...</p>
      ) : userData ? (
        <div className="text-center">

          {/*
          <p className="text-black font-afacad">Email: {userData.email}</p>
          <p className="text-black font-afacad">Name: {userData.first_name}</p>
          */}
  
          <h2 className="mt-4 text-2xl font-semibold font-afacad text-black">You are working on:</h2>
          {Array.isArray(anxieties) && anxieties.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {anxieties.map((anx) => (
                <li key={anx.anx_id} className="text-black text-lg font-afacad">
                {/* Navigate to ViewProgress based on selected anxiety */}
                  <button onClick={() => navigate("/view-progress/" + anx.anx_id)} className="p-2 rounded-full bg-[#7f85a1] text-black font-afacad"> {anx.anxiety_source.anx_name} </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-black font-afacad">No anxieties found.</p>
          )}
          <p className="text-center mt-2 text-black italic font-afacad">select an anxiety source to view your progress</p>
          <button onClick={() => navigate("/add-anxiety")} className="bg-black-500 font-afacad text-lg text-white p-2 mt-10">+ Add an Anxiety Source</button>
        </div>
      ) : (
        <p className="text-center text-black font-afacad">No user data available.</p>
      )}
    </div>
    </div>
  </div>
  
  );
   
};
export default Home;

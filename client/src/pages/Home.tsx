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
    const response = await axios.get(`/api/user/${uid}`);
    return response.data;
  };

  const fetchUserAnxieties = async (uid: string) => {
    const response = await axios.get(`/api/home/${uid}/anxieties`);
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


  if (loading) return <p className='h-screen w-screen bg-amber-50 text-center text-2xl text-black font-blaka'>Loading...</p>;

  return (
    <div className="h-screen w-screen bg-amber-50">
      <h1 className="text-center text-black font-blaka">
        Welcome, {userData?.first_name || 'Loading...'}
      </h1>
      {loading ? (
        <p className="text-center text-black font-lato">Loading...</p>
      ) : userData ? (
        <div className="text-center">
          <p className="text-black font-lato">Email: {userData.email}</p>
          <p className="text-black font-lato">Name: {userData.first_name}</p>
  
          <h2 className="mt-4 text-lg font-semibold text-black">You are working on:</h2>
          {Array.isArray(anxieties) && anxieties.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {anxieties.map((anx) => (
                <li key={anx.anx_id} className="text-black font-lato">
                  <p className="text-black font-lato"> - {anx.anxiety_source.anx_name} </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-black font-lato">No anxieties found.</p>
          )}
          <button onClick={() => navigate("/add-anxiety")} className="bg-black-500 font-lato text-white p-2 mt-4">Add an Anxiety Source</button>
        </div>
      ) : (
        <p className="text-center text-black font-lato">No user data available.</p>
      )}
    </div>
  );
   
};
export default Home;

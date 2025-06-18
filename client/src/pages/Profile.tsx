import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserData {
  firebase_uid: string;
  email: string;
  first_name: string;
}

const Profile = () => {
  const { currentUser } = useAuth(); 
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = async (uid: string) => {
    const response = await axios.get(`/api/${uid}`);
    return response.data;
  };

  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        setLoading(true);
        try {
      // Promise.all fetches both data points simultaneously
          const [user] = await Promise.all([
            fetchUserData(currentUser.uid),
          ]);
          setUserData(user);
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
      <h1 className="mt-8 text-center text-black font-fast">
        Your Profile:
      </h1>
      {loading ? (
        <p className="text-center text-black font-afacad">Loading...</p>
      ) : userData ? (
        <div className="text-center">
          <p className="text-black text-xl font-afacad">Email: {userData.email}</p>
          <p className="text-black text-xl font-afacad">Name: {userData.first_name}</p>
        </div>
      ) : (
        <p className="text-center text-black font-afacad">No user data available.</p>
      )}
      {/* Return Home */}
            <button 
                onClick={() => navigate("/home")} 
                className="absolute top-10 left-5 mt-2 p-2 ml-4 font-afacad text-lg bg-[#7f85a1] text-white"
            >
                Return to Home
            </button>
    </div>
  </div>
  </div>
  );
   
};
export default Profile;

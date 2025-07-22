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

  const updateProfile = async (uid: string, email: string, first_name: string) => {
    const response = await axios.put(`/api/${uid}/edit-profile`, { email, first_name });
    const updateduserData = response.data;
    setUserData(updateduserData);
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
      <h1 className=" text-center text-black">
        Your Profile:
      </h1>
      {loading ? (
        <p className="text-center text-black font-afacad">Loading...</p>
      ) : userData ? (
        <div className="text-center">
          <p className="text-black text-2xl">Email: {userData.email}</p>
          <button 
           className="btn-red p-2"
           onClick={() => {
            const newEmail = prompt("Enter your new email address:");
            if (newEmail && currentUser) {
              updateProfile(currentUser.uid, newEmail, userData.first_name);
            }
           }}
           >
          Change Email Address
           </button>
          <p className="text-black text-2xl mt-4">Name: {userData.first_name}</p>
          <button 
           className="btn-red p-2"
           onClick={() => {
            const newName = prompt("Enter your new name:");
            if (newName && currentUser) {
              updateProfile(currentUser.uid, userData.email, newName);
            }
           }}
           >
          Change Name
           </button>
          <div className="border-b-2 border-black mb-4 mt-4"></div>
           <button
           className="btn-red italic text-black p-2" >
           Reset Password
           </button>
        </div>
        
      ) : (
        <p className="italic text-2xl text-center text-black">No user data available.</p>
      )}
      {/* Return Home */}
            <button 
                onClick={() => navigate("/home")} 
                className="btn-navigate mt-4"
            >
                Return to Home
            </button>
    </div>
  </div>
  </div>
  );
   
};
export default Profile;

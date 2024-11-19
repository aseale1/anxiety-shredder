import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

type User = {
  firebase_uid: string;
  email: string;
  first_name: string;
};

const Home = () => {
  const { currentUser } = useAuth(); 
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      axios
        .get(`/api/user/${currentUser.uid}`) 
        .then((response) => {
          setUserData(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        });
    }
  }, [currentUser]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className = 'h-screen w-screen bg-amber-50'>
      <h1 className = 'text-center text-black font-blaka' >Welcome, {userData?.first_name}!</h1>
      {userData ? (
        <div>
          <p className = 'text-center text-black'><strong>Email:</strong> {userData.email}</p>
          <p className = 'text-center text-black'><strong>Name:</strong> {userData.first_name}</p>
        </div>
      ) : (
        <p>No user data available.</p>
      )}
    </div>
  );
};

export default Home;

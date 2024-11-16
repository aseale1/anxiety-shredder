import React, { useEffect, useState } from "react";
import {auth, onAuthStateChangedListener } from "../firebase";
import axios from "axios";

const Home = () => {
  const [userInfo, setUserInfo] = useState<{ email: string; first_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (user) => {
        if (user) {
          try {
            const response = await axios.get(`/api/users/${user.uid}`);
            setUserInfo(response.data);
          } catch (err) {
            console.error('Error fetching user data:', err);
          } finally {
            setLoading(false);
          }
        } else {
          console.log('No user signed in');
          setLoading(false);
        }
      });
  
      return () => unsubscribe;
    }, []);
  
    if (loading) return <p>Loading...</p>;
  
    return (
      <div>
        {userInfo ? (
          <div>
            <h1>Welcome, {userInfo.first_name || 'User'}!</h1>
            <p>Email: {userInfo.email}</p>
          </div>
        ) : (
          <p>No user data found</p>
        )}
      </div>
    );
  };
  
  export default Home;
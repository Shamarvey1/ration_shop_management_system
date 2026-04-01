import React, { useEffect } from 'react'


// this is only for my testing,and i can remove this latter...
const Dashboard = () => {
  useEffect(() => {
  const fetchData = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/test`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    console.log("hello",data);
  };

  fetchData();
}, []);
  return (
    <div>Dashboard</div>
    
  )
}

export default Dashboard
import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { BookContext } from './constexts/bookContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const PrivateRoute = () => {
    const navigate = useNavigate()
  const { token, isLoading } = useContext(BookContext);

  if (isLoading) return <div className="text-white p-6">Checking auth...</div>;

  return token ? <Outlet /> : useEffect(()=>{navigate("/login")}, [token, isLoading]);
};


export default PrivateRoute;

import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { BookContext } from './constexts/bookContext';
import { useNavigate } from 'react-router-dom';

const PrivateRoute = () => {
    const navigate = useNavigate()
  const { token, isLoading } = useContext(BookContext);

  if (isLoading) return <div className="text-white p-6">Checking auth...</div>;

  return token ? <Outlet /> : navigate("/login");
};


export default PrivateRoute;

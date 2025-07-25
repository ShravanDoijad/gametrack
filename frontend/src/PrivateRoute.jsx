import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { BookContext } from './constexts/bookContext';

const PrivateRoute = () => {
  const { token, isLoading, userInfo, hasCheckedAuth  } = useContext(BookContext);
  
  console.log("isLoading", isLoading)
  if (isLoading || !hasCheckedAuth) {
    return <div className="text-white p-6">Checking auth...</div>;
  }

  return token ? <Outlet /> : <Navigate to="/register" replace />;
};

export default PrivateRoute;

import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { BookContext } from './constexts/bookContext';

const OwnerPrivateRoute = () => {
 
         const { token, isLoading, userInfo } = useContext(BookContext);
        
          if (isLoading) {
            return <div className="text-white p-6">Checking auth...</div>;
          }
        
          return token && userInfo.role==="owner" ? <Outlet /> : <Navigate to="/register" replace />;
  
  
}

export default OwnerPrivateRoute
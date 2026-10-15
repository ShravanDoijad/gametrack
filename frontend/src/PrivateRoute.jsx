import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { BookContext } from './constexts/bookContext';

const PrivateRoute = () => {
  const { token, isLoading, hasCheckedAuth  } = useContext(BookContext);
  
  if (isLoading || !hasCheckedAuth) {
    return <div className="text-white p-6">Checking auth...</div>;
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;

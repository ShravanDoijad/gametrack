import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { BookContext } from './constexts/bookContext';

const OwnerPrivateRoute = () => {

  const { token, isLoading, hasCheckedAuth, userInfo } = useContext(BookContext);

  if (isLoading || !hasCheckedAuth) {
    return <div className="text-white p-6">Checking auth...</div>;
  }

  if (userInfo?.role === 'user') {
    return <Navigate to="/forbidden" />;
  }

  return token && userInfo?.role === "owner"  ? <Outlet /> : <Navigate to="/login" replace />;


}

export default OwnerPrivateRoute

import { Navigate } from 'react-router-dom';

const Index = () => {
  // Since we're using proper routing in App.tsx, redirect to login
  return <Navigate to="/login" replace />;
};

export default Index;
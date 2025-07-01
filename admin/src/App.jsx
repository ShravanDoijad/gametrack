import { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import AdminLogin from './pages/adminLogin';
import AddTurf from './pages/AddTurf';

function App() {
 

  return (
    
      <div
        className="max-w-screen min-h-screen box-border flex flex-col"
        
      >

        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<AdminLogin />} />
            <Route path='/addTurf' element={<AddTurf/>} />
            
          </Routes>
        </div>
      </div>
    
  );
}

export default App;

import React, { useState, useEffect, useContext } from 'react';
import { BookContext } from '../constexts/bookContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X, Phone } from 'lucide-react';
import OwnerLogin from './OwnerLogin';

const Register = () => {
  const navigate = useNavigate();
  const { setloginPanel, token, settoken } = useContext(BookContext);
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [showOwnerPopup, setShowOwnerPopup] = useState(false);

  useEffect(() => {
    if (token) {
      setloginPanel(false);
    }
  }, [token, navigate, setloginPanel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/users/userRegister`, { fullname, phone });
      if (response.data.success) {
        setFullname("");
        setPhone("");
        settoken(true)
        navigate("/otp", { state: { identifier: phone, type: "phone" } });
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Something went wrong");
    }
  };

  return (
    <>
      <div className="fixed z-50 top-1/2 left-1/2 w-[90%] max-w-md bg-white rounded-2xl p-6 shadow-2xl transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Get Set Play</h1>
          <X
            onClick={() => {
              setloginPanel(false);
              navigate("/");
            }}
            className="cursor-pointer"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="p-3 rounded-lg border border-gray-300 outline-none focus:ring-2 ring-yellow-400"
          />

          <div className="relative">
            <Phone className="absolute top-3 left-3 text-gray-400" />
            <input
              type="number"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 p-3 w-full rounded-lg border border-gray-300 outline-none focus:ring-2 ring-yellow-400"
            />
          </div>

          <button
            type="submit"
            className="bg-yellow-500 text-black font-semibold py-3 rounded-xl hover:bg-yellow-600 transition"
          >
            Register
          </button>
        </form>

        <p
          onClick={() => setShowOwnerPopup(true)}
          className="text-sm mt-4 text-center text-blue-600 cursor-pointer hover:underline"
        >
          Are you a turf owner? Login here
        </p>
      </div>

      {showOwnerPopup &&
        <OwnerLogin />
      }
    </>
  );
};

export default Register;

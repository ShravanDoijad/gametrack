import React, { useState, useEffect, useContext } from 'react';
import { BookContext } from '../constexts/bookContext';
import axios from 'axios';
import {
  LogOut,
  Pencil,
  MapPin,
  Calendar,
  Clock,
  ImagePlus,
  Check,
  User,
  Mail,
  Phone,
  Shield,
  CreditCard,
  Star,
  Award,
  Settings,
  Info,
  Lock,
  Sun,
  Moon,
  CircleGauge,
  ArrowUpDown,
  Trophy,
  Wallet,
  ClipboardList,
  Loader2,
  Zap,
  Activity,
  TrendingUp,
  Crown,
  AlertTriangle
} from 'lucide-react';

const TurfProfile = () => {
  const [turf, setTurf] = useState([]);
  const [owner, setOwner] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { handleLogout } = useContext(BookContext);

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const response = await axios.get('/owner/turfDetails');
        setTurf(response.data.turf);
        setOwner(response.data.owner);
        setFormData(response.data.turf);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching turf profile', err);
        setIsLoading(false);
      }
    };

    fetchTurf();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.put('/owner/updateTurfProfile', formData);
      setTurf(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-lime-400 mx-auto mb-4" />
          <p className="text-lime-200">Loading turf profile...</p>
        </div>
      </div>
    );
  }

  if (!turf || !owner) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900/50 rounded-xl p-8 text-center border border-gray-800">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-400 mb-4" />
          <h3 className="text-xl text-gray-300 mb-2">Profile Not Found</h3>
          <p className="text-gray-500">We couldn't load your turf information</p>
        </div>
      </div>
    );
  }

  const editableFields = [
    { label: 'Turf Name', key: 'name', icon: <ArrowUpDown size={16} className="text-lime-400" /> },
    { 
      label: 'Location', 
      key: 'location', 
      icon: <MapPin size={16} className="text-blue-400" />,
      display: `${turf.location?.address}, ${turf.location?.city}, ${turf.location?.pincode}`
    },
    { 
      label: 'Day Price', 
      key: 'dayPrice', 
      icon: <Sun size={16} className="text-amber-400" />,
      prefix: '₹'
    },
    { 
      label: 'Night Price', 
      key: 'nightPrice', 
      icon: <Moon size={16} className="text-indigo-400" />,
      prefix: '₹'
    },
    { 
      label: 'Opening Time', 
      key: 'openingTime', 
      icon: <Clock size={16} className="text-emerald-400" /> 
    },
    { 
      label: 'Closing Time', 
      key: 'closingTime', 
      icon: <Clock size={16} className="text-red-400" /> 
    },
    { 
      label: 'Allow Advance', 
      key: 'allowAdvancePayment', 
      type: 'checkbox',
      icon: <Wallet size={16} className="text-green-400" />
    },
    { 
      label: 'Allow Full Payment', 
      key: 'allowFullPaymentOnly', 
      type: 'checkbox',
      icon: <CreditCard size={16} className="text-purple-400" />
    },
    { 
      label: 'Allow Tournaments', 
      key: 'allowTournaments', 
      type: 'checkbox',
      icon: <Trophy size={16} className="text-yellow-400" />
    },
    { 
      label: 'Policies', 
      key: 'onSitePolicies', 
      icon: <Shield size={16} className="text-blue-400" />,
      type: 'textarea'
    },
    { 
      label: 'Amenities', 
      key: 'amenities', 
      icon: <ClipboardList size={16} className="text-cyan-400" />,
      type: 'textarea'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white font-sora">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-lime-300 to-emerald-400 mb-2">
              Turf Command Center
            </h1>
            <p className="text-gray-400 flex items-center">
              <Zap className="mr-2 text-lime-400" size={16} />
              Manage your turf profile and business settings
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-0 flex items-center space-x-2 text-red-400 hover:text-red-300 border border-red-600/50 px-4 py-2.5 rounded-xl hover:bg-red-900/20 transition-all"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Owner Profile Card */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-lime-500/10 transition-all hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center">
                    {owner.fullname}
                    <span className="ml-2"><Star className="text-amber-400" size={16} /></span>
                  </h3>
                  <div className="text-xs px-2 py-1 rounded-full inline-flex items-center mt-1 bg-blue-900/30 text-blue-300">
                    Business Owner
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-400 mb-1">Account Status</div>
                  <div className="flex">
                    <Star className="text-amber-400 fill-amber-400" size={16} />
                    <Star className="text-amber-400 fill-amber-400" size={16} />
                    <Star className="text-amber-400 fill-amber-400" size={16} />
                    <Star className="text-amber-400 fill-amber-400" size={16} />
                    <Star className="text-amber-400 fill-amber-400" size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="text-gray-400 mr-3" size={16} />
                  <span className="text-gray-300">{owner.email || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="text-gray-400 mr-3" size={16} />
                  <span className="text-gray-300">{owner.phone}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="text-gray-400 mr-3" size={16} />
                  <div>
                    <div className="text-gray-300">Member since {new Date(owner.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-xs text-gray-400">Turfs Owned</div>
                  <div className="text-lg font-bold text-lime-300">1</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Member Since</div>
                  <div className="text-lg font-bold text-emerald-300">
                    {new Date(owner.createdAt).getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Turf Details Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-lime-500/10 transition-all hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-lime-500 to-emerald-400"></div>
            
            <div className="p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center text-lime-300">
                  <CircleGauge className="mr-2" size={20} />
                  Turf Details
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
                    isEditing 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' 
                      : 'bg-lime-600 hover:bg-lime-500 text-gray-900'
                  }`}
                >
                  <Pencil size={16} />
                  <span>{isEditing ? 'Cancel Editing' : 'Edit Details'}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                <div className="w-32 h-32 rounded-xl bg-gray-700/50 flex items-center justify-center overflow-hidden border-2 border-lime-500/30">
                  {turf.images?.[0] ? (
                    <img src={turf.images[0]} alt="Turf" className="object-cover w-full h-full" />
                  ) : (
                    <ImagePlus className="text-gray-500" size={40} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{turf.name}</h3>
                    <div className="flex items-center bg-amber-500/10 px-3 py-1 rounded-full">
                      <Star className="text-amber-400 mr-1" size={16} />
                      <span className="font-medium">{turf.averageRating || 'New'}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-gray-300">
                    <MapPin className="text-blue-400 mr-2" size={16} />
                    <span>{turf.location?.address}, {turf.location?.city}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-gray-700/30 p-2 rounded-lg border border-gray-600/50 flex items-center">
                      <Sun className="text-amber-400 mr-2" size={16} />
                      <span className="text-sm">Day: ₹{turf.dayPrice || '—'}</span>
                    </div>
                    <div className="bg-gray-700/30 p-2 rounded-lg border border-gray-600/50 flex items-center">
                      <Moon className="text-indigo-400 mr-2" size={16} />
                      <span className="text-sm">Night: ₹{turf.nightPrice || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {editableFields.map(({ label, key, icon, type = 'text', prefix = '', display }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm text-gray-300 flex items-center">
                      <span className="mr-2">{icon}</span>
                      {label}
                    </label>
                    {isEditing ? (
                      type === 'checkbox' ? (
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            name={key}
                            checked={formData[key] || false}
                            onChange={handleChange}
                            className="accent-lime-500 w-5 h-5 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-300">
                            {formData[key] ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : type === 'textarea' ? (
                        <textarea
                          name={key}
                          value={formData[key] || ''}
                          onChange={handleChange}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-lime-500 min-h-[100px]"
                        />
                      ) : (
                        <input
                          type={type}
                          name={key}
                          value={formData[key] || ''}
                          onChange={handleChange}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-lime-500"
                        />
                      )
                    ) : (
                      <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                        <p className="text-white">
                          {prefix}{display || turf[key]?.toString() || 'Not specified'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isEditing && (
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition flex items-center"
                  >
                    <span>Discard Changes</span>
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-6 py-3 rounded-xl bg-lime-600 hover:bg-lime-500 text-gray-900 font-medium transition flex items-center"
                  >
                    <Check className="mr-2" size={18} />
                    <span>Save Updates</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfProfile;
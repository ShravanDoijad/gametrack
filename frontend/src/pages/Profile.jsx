import React, { useContext, useState } from 'react';
import { BookContext } from '../constexts/bookContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Pencil, Trash2, Mail, Bell, Clock, User, Phone, MapPin, Star, Settings, Shield, CalendarDays, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { userInfo, isLoading, setloginPanel, setuserInfo, handleLogout, token } = useContext(BookContext);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        fullname: userInfo?.fullname || '',
        phone: userInfo?.phone || '',
        email: userInfo?.email || '',
        preferences: {
            preferredTime: userInfo?.preferences?.preferredTime || '',
            notifyOnBooking: userInfo?.preferences?.notifyOnBooking ?? true
        }
    });

    if (!userInfo || isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-lime-500/20 border-t-lime-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('preferences.')) {
            const prefField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    [prefField]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let res = await axios.post("/api/users/updateUser", {
                userId: userInfo._id,
                email: formData.email,
                isNotification: formData.preferences.notifyOnBooking,
                preferredTime: formData.preferences.preferredTime
            });

            // Update local context manually or re-fetch
            setuserInfo(prev => ({
                ...prev,
                email: formData.email,
                fullname: formData.fullname,
                phone: formData.phone,
                preferences: {
                    ...prev.preferences,
                    notifyOnBooking: formData.preferences.notifyOnBooking,
                    preferredTime: formData.preferences.preferredTime
                }
            }));

            toast.success(res.data.message || "Profile updated successfully");
            setIsEditing(false);
        } catch (error) {
            console.log("user Update error", error?.response?.data);
            toast.error("Something went wrong");
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const res = await axios.post("/api/users/deleteUser", {
                userId: userInfo._id
            });
            toast.success(res.data.message || "Account deleted successfully");
            setuserInfo(null);
        } catch (error) {
            console.log("user Delete error", error?.response?.data);
            toast.error("Something went wrong");
        } finally {
            setIsDeleting(false);
            setloginPanel(true);
            setShowDeleteConfirmation(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* HERO SECTION */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-[2rem] overflow-hidden bg-[#111] border border-white/10 p-8 sm:p-12 shadow-2xl"
                >
                    {/* Decorative Background */}
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-lime-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
                    
                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 z-10">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 p-1">
                                <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                                    <span className="text-4xl font-bold bg-gradient-to-br from-lime-400 to-emerald-500 bg-clip-text text-transparent uppercase">
                                        {userInfo.fullname?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 w-5 h-5 bg-lime-500 border-4 border-[#111] rounded-full"></div>
                        </div>

                        {/* User Info Header */}
                        <div className="text-center md:text-left flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-4">
                                <CalendarDays size={14} className="text-lime-400" />
                                Member since {userInfo.registeredAt ? new Date(userInfo.registeredAt).toLocaleDateString() : 'recently'}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                {userInfo.fullname}
                            </h1>
                            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-6 text-gray-400 text-sm mb-6">
                                <span className="flex items-center gap-2">
                                    <Phone size={16} className="text-lime-500/70" />
                                    +91 {userInfo.phone}
                                </span>
                                <span className="hidden sm:block text-white/20">•</span>
                                <span className="flex items-center gap-2">
                                    <Mail size={16} className="text-lime-500/70" />
                                    {userInfo.email || 'No email provided'}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-lime-500 hover:bg-lime-400 text-black rounded-xl font-semibold transition-all shadow-lg shadow-lime-500/20 active:scale-95"
                                    >
                                        <Pencil size={18} />
                                        Edit Profile
                                    </button>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all active:scale-95"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Main Info & Settings */}
                    <div className="lg:col-span-2 space-y-8">
                        <AnimatePresence mode="wait">
                            {isEditing ? (
                                <motion.form
                                    key="edit-form"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    onSubmit={handleSubmit}
                                    className="bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-xl"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {/* Grid for inputs */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Full Name */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                                    <User size={16} /> Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="fullname"
                                                    value={formData.fullname}
                                                    onChange={handleChange}
                                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
                                                    required
                                                />
                                            </div>

                                            {/* Phone */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                                    <Phone size={16} /> Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
                                                    required
                                                />
                                            </div>

                                            {/* Email */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                                    <Mail size={16} /> Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
                                                />
                                            </div>

                                            {/* Preferred Time */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                                    <Clock size={16} /> Preferred Booking Time
                                                </label>
                                                <select
                                                    name="preferences.preferredTime"
                                                    value={formData.preferences.preferredTime}
                                                    onChange={handleChange}
                                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all appearance-none"
                                                >
                                                    <option value="">Select preferred time</option>
                                                    <option value="Morning">Morning (6AM-12PM)</option>
                                                    <option value="Afternoon">Afternoon (12PM-5PM)</option>
                                                    <option value="Evening">Evening (5PM-9PM)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Notifications */}
                                        <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] border border-white/10 rounded-xl mt-4 cursor-pointer hover:border-white/20 transition-all" onClick={() => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, notifyOnBooking: !prev.preferences.notifyOnBooking } }))}>
                                            <div className="relative flex items-center pointer-events-none">
                                                <input
                                                    type="checkbox"
                                                    className="peer sr-only"
                                                    checked={formData.preferences.notifyOnBooking}
                                                    readOnly
                                                />
                                                <div className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 ${formData.preferences.notifyOnBooking ? 'bg-lime-500' : 'bg-white/10'}`}>
                                                    <div className={`w-5 h-5 rounded-full bg-white transition-all shadow-sm ${formData.preferences.notifyOnBooking ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                </div>
                                            </div>
                                            <label className="text-sm text-gray-300 select-none">
                                                Receive booking and promotional notifications
                                            </label>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="submit"
                                                className="flex-1 sm:flex-none px-8 py-3 bg-lime-500 hover:bg-lime-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-lime-500/20 active:scale-95"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 sm:flex-none px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all active:scale-95"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="view-profile"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-xl"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                        <Settings size={24} className="text-lime-400" />
                                        Profile Details
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3 mb-2 text-gray-400">
                                                <User size={18} className="text-lime-400" />
                                                <span className="text-sm font-medium">Full Name</span>
                                            </div>
                                            <p className="text-lg text-white font-semibold pl-8">{userInfo.fullname}</p>
                                        </div>

                                        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3 mb-2 text-gray-400">
                                                <Phone size={18} className="text-lime-400" />
                                                <span className="text-sm font-medium">Phone Number</span>
                                            </div>
                                            <p className="text-lg text-white font-semibold pl-8">+91 {userInfo.phone}</p>
                                        </div>

                                        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3 mb-2 text-gray-400">
                                                <Mail size={18} className="text-lime-400" />
                                                <span className="text-sm font-medium">Email Address</span>
                                            </div>
                                            <p className="text-lg text-white font-semibold pl-8 truncate">{userInfo.email || "Not provided"}</p>
                                        </div>

                                        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3 mb-2 text-gray-400">
                                                <Clock size={18} className="text-lime-400" />
                                                <span className="text-sm font-medium">Preferred Time</span>
                                            </div>
                                            <p className="text-lg text-white font-semibold pl-8">{userInfo.preferences?.preferredTime || "Any time"}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Bell size={20} className="text-lime-400" />
                                            <div>
                                                <p className="text-white font-medium">Notifications</p>
                                                <p className="text-sm text-gray-400">Receive booking updates</p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${userInfo.preferences?.notifyOnBooking ? 'bg-lime-500/20 text-lime-400' : 'bg-white/10 text-gray-400'}`}>
                                            {userInfo.preferences?.notifyOnBooking ? "Enabled" : "Disabled"}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN: Account Security & Stats */}
                    <div className="space-y-8">
                        {/* Account Security */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Shield size={20} className="text-rose-400" />
                                Security
                            </h2>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            <button
                                onClick={() => setShowDeleteConfirmation(true)}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-medium transition-all"
                            >
                                <Trash2 size={18} />
                                Delete Account
                            </button>
                        </motion.div>

                        {/* Quick Stats */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-white/10 rounded-[2rem] p-8 shadow-xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Star size={20} className="text-amber-400" />
                                Favorites ({userInfo.favoriteTurfs?.length || 0})
                            </h2>
                            {userInfo.favoriteTurfs && userInfo.favoriteTurfs.length > 0 ? (
                                <div className="space-y-4">
                                    {userInfo.favoriteTurfs.slice(0, 3).map((turf) => (
                                        <div key={turf._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate(`/turf/${turf._id}`)}>
                                            <div>
                                                <p className="text-white font-medium text-sm truncate max-w-[150px]">{turf.name}</p>
                                                <p className="text-gray-400 text-xs flex items-center gap-1 mt-1 truncate max-w-[150px]">
                                                    <MapPin size={10} /> {turf.location}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 text-amber-400 text-xs font-bold">
                                                <span className="flex items-center gap-1"><Star size={12} fill="currentColor" /> {turf.rating || "New"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 border border-white/10">
                                        <Star size={20} className="text-gray-500" />
                                    </div>
                                    <p className="text-gray-400 text-sm">No favorites yet</p>
                                    <button onClick={()=>navigate("/")} className="text-lime-400 text-sm mt-2 hover:underline">Explore Turfs</button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Favorite Turfs Full Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-12 pt-8 border-t border-white/5"
                >
                    <h2 className="text-2xl text-white font-bold mb-6 flex items-center gap-3 px-2">
                        <Star className="text-lime-400" />
                        Favorite Turfs Collection
                    </h2>
                    {userInfo.favoriteTurfs && userInfo.favoriteTurfs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userInfo.favoriteTurfs.map((turf) => (
                                <motion.div
                                    key={turf._id}
                                    className="group bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-lime-500/50 transition-all cursor-pointer shadow-lg"
                                    whileHover={{ y: -5 }}
                                    onClick={() => navigate(`/turf/${turf._id}`)}
                                >
                                    <div className="h-40 bg-gray-800 relative overflow-hidden">
                                        {turf.image || turf.images?.[0] ? (
                                            <img src={turf.image || turf.images?.[0]} alt={turf.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                                <MapPin size={32} className="text-gray-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-amber-400 flex items-center gap-1 border border-white/10">
                                            <Star size={12} fill="currentColor" /> {turf.rating || "New"}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-lime-400 transition-colors">{turf.name}</h3>
                                        <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-4">
                                            <MapPin size={14} className="text-gray-500" />
                                            {turf.location}
                                        </p>
                                        <div className="flex items-center justify-between text-xs font-medium border-t border-white/5 pt-4">
                                            <span className="text-gray-500">View Details</span>
                                            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-lime-500 group-hover:text-black transition-colors">
                                                <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#111] border border-white/10 rounded-[2rem] p-12 text-center shadow-lg">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <Star size={32} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl text-white font-semibold mb-2">No Favorites Yet</h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">You haven't marked any turf as a favorite. Browse our collection and save the ones you love!</p>
                            <button onClick={()=>navigate("/")} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold rounded-xl transition-colors">
                                Explore Turfs
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Delete Account Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirmation && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#111] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600"></div>
                            
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                                <Trash2 size={28} className="text-red-500" />
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white mb-3">Delete Account</h3>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Are you absolutely sure? This action cannot be undone. All your bookings, favorites, and profile data will be permanently wiped from our servers.
                            </p>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirmation(false)}
                                    className="flex-1 px-4 py-3 border border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl font-medium transition-colors"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Yes, Delete'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
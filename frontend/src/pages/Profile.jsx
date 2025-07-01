import React, { useContext, useState } from 'react';
import { BookContext } from '../constexts/bookContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LogOut, Pencil, Trash2, Mail, Bell, Clock, User, Phone } from 'lucide-react';
import { toast } from 'react-toastify';

const Profile = () => {
    const { userInfo, setloginPanel, setuserInfo, handleLogout, token } = useContext(BookContext);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        fullname: userInfo.fullname || '',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        preferences: {
            preferredTime: userInfo.preferences?.preferredTime || '',
            notifyOnBooking: userInfo.preferences?.notifyOnBooking || true
        }
    });

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
            let res = await axios.post("/api/updateUser", {
                userId: userInfo._id,
                email: formData.email,
                isNotification: formData.preferences.notifyOnBooking,
                preferredTime: formData.preferences.preferredTime

            })

            toast.success(res.data.message)
            setIsEditing(false);
        } catch (error) {
            console.log("user Update error", error?.response?.data)
            toast.error("Something Went Wrong")
        }



    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const res = await axios.post("/api/deleteUser", {
                userId: userInfo._id
            })
            toast.success(res.data.message)
            setuserInfo(null)
        } catch (error) {
            console.log("user Delete error", error?.response?.data)
            toast.error("Something Went Wrong")
        } finally {
            setIsDeleting(false);
            setloginPanel(true)
            setShowDeleteConfirmation(false);
        }

    };

    if(!token){
        toast.warning("Login to StepUp")
        setloginPanel(true)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 px-6 ">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-semibold  bg-clip-text sora text-white mb-6 ">
                    {isEditing ? 'Edit Profile' : `Welcome, ${userInfo.fullname?.split(" ")[0] || 'User'}!`}
                </h1>

                {isEditing ? (
                    <form onSubmit={handleSubmit} className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl p-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                                        <User className="h-4 w-4" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="fullname"
                                        value={formData.fullname}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                                        <Phone className="h-4 w-4" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                                        <Mail className="h-4 w-4" />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-gray-300 text-sm">
                                        <Clock className="h-4 w-4" />
                                        Preferred Booking Time
                                    </label>
                                    <select
                                        name="preferences.preferredTime"
                                        value={formData.preferences.preferredTime}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    >
                                        <option value="">Select preferred time</option>
                                        <option value="Morning">Morning (6AM-12PM)</option>
                                        <option value="Afternoon">Afternoon (12PM-5PM)</option>
                                        <option value="Evening">Evening (5PM-9PM)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="notifyOnBooking"
                                    name="preferences.notifyOnBooking"
                                    checked={formData.preferences.notifyOnBooking}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-600 rounded"
                                />
                                <label htmlFor="notifyOnBooking" className="text-gray-300 text-sm">
                                    Receive booking notifications
                                </label>
                            </div>

                            <div className="pt-4 flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-600 hover:to-emerald-700 text-white rounded-full font-medium"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex items-center gap-2 px-6 py-2 border border-gray-500 text-gray-300 hover:text-white hover:border-white rounded-full"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-1 space-y-6 text-gray-300">
                                <div>
                                    <h2 className="text-2xl text-white font-semibold">{userInfo.fullname}</h2>
                                    <p className="text-sm text-gray-400">
                                        Joined: {new Date(userInfo.registeredAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-700 rounded-lg">
                                            <User className="h-5 w-5 text-lime-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Full Name</p>
                                            <p className="text-white font-medium">{userInfo.fullname}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-700 rounded-lg">
                                            <Phone className="h-5 w-5 text-lime-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Phone Number</p>
                                            <p className="text-white font-medium">+91 {userInfo.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-700 rounded-lg">
                                            <Mail className="h-5 w-5 text-lime-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Email Address</p>
                                            <p className="text-white font-medium">{userInfo.email || "Not provided"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-700 rounded-lg">
                                            <Clock className="h-5 w-5 text-lime-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Preferred Booking Time</p>
                                            <p className="text-white font-medium">
                                                {userInfo.preferences?.preferredTime || "Not specified"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-700 rounded-lg">
                                            <Bell className="h-5 w-5 text-lime-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Notification Preference</p>
                                            <p className="text-white font-medium">
                                                {userInfo.preferences?.notifyOnBooking ? "Enabled" : "Disabled"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-600 hover:to-emerald-700 text-white rounded-full font-medium"
                                    >
                                        <Pencil size={16} />
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirmation(true)}
                                        className="flex items-center gap-2 px-6 py-2 bg-red-600/90 hover:bg-red-700 text-white rounded-full"
                                    >
                                        <Trash2 size={16} />
                                        Delete Account
                                    </button>
                                    <button
                                    onClick={handleLogout}
                                     className="flex items-center gap-2 px-6 py-2 border border-gray-500 text-gray-300 hover:text-white hover:border-white rounded-full">
                                        
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Account Confirmation Modal */}
                {showDeleteConfirmation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full"
                        >
                            <h3 className="text-xl font-semibold text-white mb-4">Delete Account</h3>
                            <p className="text-gray-300 mb-6">
                                Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirmation(false)}
                                    className="px-4 py-2 border border-gray-500 text-gray-300 hover:text-white hover:border-white rounded-lg"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Account'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <div className="mt-12">
                    <h2 className="text-2xl text-lime-400 font-semibold mb-4">Your Favorite Turfs</h2>
                    {userInfo.favoriteTurfs && userInfo.favoriteTurfs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userInfo.favoriteTurfs.map((turf) => (
                                <motion.div
                                    key={turf._id}
                                    className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow hover:shadow-lime-500/20 transition-shadow"
                                    whileHover={{ y: -5 }}
                                >
                                    <h3 className="text-white font-semibold text-lg mb-1">{turf.name}</h3>
                                    <p className="text-sm text-gray-400">Location: {turf.location}</p>
                                    <p className="text-sm text-gray-400">Rating: {turf.rating || "N/A"}</p>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                            <p className="text-gray-400">You haven't marked any turf as favorite yet.</p>
                            <button className="mt-4 px-4 py-2 text-lime-400 border border-lime-400 rounded-full hover:bg-lime-400/10 transition-colors">
                                Explore Turfs
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  User, Mail, Phone, CalendarDays, BadgeCheck, 
  AlertTriangle, Loader2, Star, Crown, Activity,
  TrendingUp, Zap, Award, Shield, Clock
} from "lucide-react";
import moment from "moment";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get("/owner/customers");
        setCustomers(res.data.customers);
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const classifyCustomer = (customer) => {
    const bookingsCount = customers.filter(c => c.userId === customer.userId).length;
    const lastBooking = moment(customer.bookingDate);
    const now = moment();
    const daysSinceLast = now.diff(lastBooking, 'days');

    if (bookingsCount > 5 && daysSinceLast <= 10) return "VIP";
    if (bookingsCount > 3 || daysSinceLast <= 15) return "Regular";
    if (bookingsCount > 1 && daysSinceLast <= 30) return "Active";
    return "Inactive";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "VIP": return "bg-gradient-to-r from-amber-500 to-yellow-400";
      case "Regular": return "bg-gradient-to-r from-lime-500 to-emerald-400";
      case "Active": return "bg-gradient-to-r from-blue-500 to-cyan-400";
      default: return "bg-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "VIP": return <Crown className="text-amber-400" size={16} />;
      case "Regular": return <Star className="text-lime-400" size={16} />;
      case "Active": return <Activity className="text-blue-400" size={16} />;
      default: return <AlertTriangle className="text-gray-400" size={16} />;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery);
    
    if (activeFilter === "all") return matchesSearch;
    return classifyCustomer(customer) === activeFilter && matchesSearch;
  });

  const getCustomerValue = (customer) => {
    const status = classifyCustomer(customer);
    const bookingsCount = customers.filter(c => c.userId === customer.userId).length;
    const totalSpent = customers
      .filter(c => c.userId === customer.userId)
      .reduce((sum, c) => sum + c.amountPaid, 0);

    if (status === "VIP") return 5;
    if (status === "Regular") return 4;
    if (bookingsCount > 3) return 3;
    if (totalSpent > 2000) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white font-sora">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-lime-300 to-emerald-400 mb-2">
              Customer Intelligence
            </h1>
            <p className="text-gray-400 flex items-center">
              <Zap className="mr-2 text-lime-400" size={16} />
              Actionable insights about your customers
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search customers..."
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pl-10 w-full md:w-64 text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-all ${
              activeFilter === "all" 
                ? 'bg-lime-500/20 text-lime-300 border border-lime-500/30' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="mr-2" size={16} /> All Customers
          </button>
          <button
            onClick={() => setActiveFilter("VIP")}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-all ${
              activeFilter === "VIP" 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Crown className="mr-2" size={16} /> VIP
          </button>
          <button
            onClick={() => setActiveFilter("Regular")}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-all ${
              activeFilter === "Regular" 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Star className="mr-2" size={16} /> Regular
          </button>
          <button
            onClick={() => setActiveFilter("Active")}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-all ${
              activeFilter === "Active" 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Activity className="mr-2" size={16} /> Active
          </button>
          <button
            onClick={() => setActiveFilter("Inactive")}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-all ${
              activeFilter === "Inactive" 
                ? 'bg-gray-600/20 text-gray-300 border border-gray-500/30' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Clock className="mr-2" size={16} /> Inactive
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 text-lime-400 mx-auto mb-4" />
              <p className="text-lime-200">Loading customer intelligence...</p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-gray-900/50 rounded-xl p-8 text-center border border-gray-800">
            <Award className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-xl text-gray-300 mb-2">No customers found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer, index) => {
              const status = classifyCustomer(customer);
              const customerValue = getCustomerValue(customer);
              const bookingsCount = customers.filter(c => c.userId === customer.userId).length;
              const lastBooking = moment(customer.bookingDate);
              const now = moment();
              const daysSinceLast = now.diff(lastBooking, 'days');

              return (
                <div 
                  key={index} 
                  className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-lime-500/10 transition-all hover:-translate-y-1"
                >
                  <div className={`h-2 ${getStatusColor(status)}`}></div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center">
                          {customer.name}
                          <span className="ml-2">{getStatusIcon(status)}</span>
                        </h3>
                        <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center mt-1 ${
                          status === "VIP" ? "bg-amber-900/30 text-amber-300" :
                          status === "Regular" ? "bg-lime-900/30 text-lime-300" :
                          status === "Active" ? "bg-blue-900/30 text-blue-300" :
                          "bg-gray-700 text-gray-400"
                        }`}>
                          {status} Customer
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-gray-400 mb-1">Customer Value</div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`${i < customerValue ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} 
                              size={16} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Mail className="text-gray-400 mr-3" size={16} />
                        <span className="text-gray-300">{customer.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="text-gray-400 mr-3" size={16} />
                        <span className="text-gray-300">{customer.phone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CalendarDays className="text-gray-400 mr-3" size={16} />
                        <div>
                          <div className="text-gray-300">Last Booking: {lastBooking.format("MMM D, YYYY")}</div>
                          <div className="text-xs text-gray-500">{daysSinceLast} days ago</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-gray-400">Bookings</div>
                        <div className="text-lg font-bold text-lime-300">{bookingsCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Total Spent</div>
                        <div className="text-lg font-bold text-emerald-300">
                          ₹{customers
                            .filter(c => c.userId === customer.userId)
                            .reduce((sum, c) => sum + c.amountPaid, 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Avg. Spend</div>
                        <div className="text-lg font-bold text-amber-300">
                          ₹{bookingsCount > 0 ? 
                            Math.round(customers
                              .filter(c => c.userId === customer.userId)
                              .reduce((sum, c) => sum + c.amountPaid, 0) / bookingsCount) 
                            : 0}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between">
                      <button className="text-xs bg-gray-800 hover:bg-gray-700 text-lime-300 px-3 py-1.5 rounded-lg flex items-center transition">
                        <Phone className="mr-1" size={14} /> Contact
                      </button>
                      <button className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-300 px-3 py-1.5 rounded-lg flex items-center transition">
                        <Shield className="mr-1" size={14} /> Offer
                      </button>
                      <button className="text-xs bg-gray-800 hover:bg-gray-700 text-amber-300 px-3 py-1.5 rounded-lg flex items-center transition">
                        <Star className="mr-1" size={14} /> Reward
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredCustomers.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-400">
            Showing <span className="font-medium text-lime-300">{filteredCustomers.length}</span> of <span className="font-medium text-white">{customers.length}</span> customers
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
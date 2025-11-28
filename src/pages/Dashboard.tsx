import React from "react";
import { Activity, Users, MapPin, TrendingUp } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      {/* TOP NAVBAR */}
      <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">
  Admin Dashboard (Updated by Amay)
     </h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Logout
        </button>
      </header>

      <main className="flex-1 p-6">
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <h2 className="text-2xl font-bold">1,248</h2>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-4 bg-green-100 rounded-lg">
              <MapPin className="text-green-600" size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Trips</p>
              <h2 className="text-2xl font-bold">87</h2>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-4 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue (Monthly)</p>
              <h2 className="text-2xl font-bold">₹4,92,000</h2>
            </div>
          </div>
        </div>

        {/* ACTIVITY SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <Activity className="text-blue-600" size={20} />
              <p className="text-gray-700">User “Ravi” booked a ride to Bengaluru Airport.</p>
            </li>
            <li className="flex items-center gap-3">
              <Activity className="text-green-600" size={20} />
              <p className="text-gray-700">Driver “Suresh” completed a trip.</p>
            </li>
            <li className="flex items-center gap-3">
              <Activity className="text-purple-600" size={20} />
              <p className="text-gray-700">New user registration: “Ananya”.</p>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
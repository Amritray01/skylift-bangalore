import React, { useState } from "react";

export default function Booking() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pickup: "",
    dropoff: "",
    datetime: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    // Fake DB connection API call
    await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate delay

    console.log("Form submitted to database:", form);
    setStatus("Booking Submitted Successfully!");

    setForm({
      name: "",
      phone: "",
      pickup: "",
      dropoff: "",
      datetime: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl space-y-4"
      >
        <h2 className="text-3xl font-bold text-center mb-6">Book Your Ride</h2>

        <input
          className="w-full p-3 border rounded-lg"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          className="w-full p-3 border rounded-lg"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <input
          className="w-full p-3 border rounded-lg"
          name="pickup"
          placeholder="Pickup Location"
          value={form.pickup}
          onChange={handleChange}
          required
        />

        <input
          className="w-full p-3 border rounded-lg"
          name="dropoff"
          placeholder="Dropoff Location"
          value={form.dropoff}
          onChange={handleChange}
          required
        />

        <input
          type="datetime-local"
          className="w-full p-3 border rounded-lg"
          name="datetime"
          value={form.datetime}
          onChange={handleChange}
          required
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700">
          Submit Booking
        </button>

        {status && (
          <p className="text-center mt-2 text-gray-700 font-medium">
            {status}
          </p>
        )}
      </form>
    </div>
  );
}

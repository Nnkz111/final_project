import React, { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";

function UserProfilePage() {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Redirect to login or show a message if the user is not logged in
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Please log in to view your profile.</p>
        <Link to="/login" className="text-green-600 hover:underline mt-4 block">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">User Profile</h1>
        <div className="space-y-3">
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          {/* Add other user details if available in the user object */}
          {/* <p><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p> */}
          {/* <p><strong>Status:</strong> {user.status}</p> */}
        </div>
        {/* Placeholder for Edit Profile button */}
        <div className="mt-6">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
            Edit Profile (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;

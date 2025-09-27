import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/Auth/Login";
import SignUpPage from "./pages/Auth/Register";
import Profile from "./pages/Auth/Profile";
import EditProfile from "./pages/Auth/EditProfile";
import AddJournal from "./pages/Journal/AddJournal";
import JournalView from "./pages/Journal/JournalView";
import PublicReviewsPage from "./pages/PublicReviewsPage";
import ResetPassword from "./pages/Auth/ResetPassword";
import ChangePassword from "./pages/Auth/ChangePassword";
import TripInputPage from "./pages/Scheduler/TripInputPage";
import ItineraryPage from './pages/Scheduler/ItineraryPage';



const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/signin" replace />;
};

const GuestRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/profile" replace /> : children;
};

function App() {
  const showAlert = ({ message }) => {
    alert(message); // replace with a Snackbar/Toast later
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<GuestRoute><SignInPage onAlert={showAlert} /></GuestRoute>}/>
        <Route path="/signup" element={<GuestRoute><SignUpPage onAlert={showAlert} /></GuestRoute> }/>
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute> }/>
        <Route path="/journal" element={<ProtectedRoute><JournalView /></ProtectedRoute>} />
        <Route path="/journal/add" element={<ProtectedRoute><AddJournal onAlert={showAlert} /></ProtectedRoute>} />
        <Route path="/editprofile" element={<ProtectedRoute><EditProfile onAlert={showAlert} /></ProtectedRoute>}/>
        <Route path="/reviews" element={<PublicReviewsPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/trip-input" element={<TripInputPage />} />
        <Route path="/itinerary" element={<ItineraryPage />} />

        
      </Routes>
    </Router>
  );
}

export default App;

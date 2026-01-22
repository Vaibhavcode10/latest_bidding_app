import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BiddingRequestProvider } from './context/BiddingRequestContext';
import Home from './pages/Home';
import Login from './pages/Login';
import TeamSelection from './pages/TeamSelection';
import PlayerSelectSport from './pages/PlayerSelectSport';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import PlayerDashboardLayout from './pages/dashboard/PlayerDashboardLayout';
import AuctioneerDashboardLayout from './pages/dashboard/AuctioneerDashboardLayout';
import Overview from './pages/dashboard/Overview';
import Players from './pages/dashboard/Players';
import Teams from './pages/dashboard/Teams';
import PlayerProfilePage from './pages/dashboard/PlayerProfile';
import BidEvents from './pages/dashboard/BidEvents';
import AuctionRequests from './pages/dashboard/AuctionRequests';
import AuctioneerOverview from './pages/dashboard/AuctioneerOverview';
import AuctioneerTeamDetails from './pages/dashboard/AuctioneerTeamDetails';
import AuctioneerPlayers from './pages/dashboard/AuctioneerPlayers';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BiddingRequestProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/teams" element={<TeamSelection />} />
            
            {/* Player Routes */}
            <Route path="/player/select-sport" element={<PlayerSelectSport />} />
            <Route path="/player/dashboard" element={<PlayerDashboardLayout />}>
              <Route index element={<PlayerProfilePage />} />
              <Route path="bid-events" element={<BidEvents />} />
            </Route>

            {/* Auctioneer Routes */}
            <Route path="/auctioneer/dashboard" element={<AuctioneerDashboardLayout />}>
              <Route index element={<AuctioneerOverview />} />
              <Route path="team" element={<AuctioneerTeamDetails />} />
              <Route path="players" element={<AuctioneerPlayers />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="players" element={<Players />} />
              <Route path="teams" element={<Teams />} />
              <Route path="requests" element={<AuctionRequests />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </BiddingRequestProvider>
    </AuthProvider>
  );
};

export default App;
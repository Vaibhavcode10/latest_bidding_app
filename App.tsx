import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import TeamSelection from './pages/TeamSelection';
import PlayerSelectSport from './pages/PlayerSelectSport';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import PlayerDashboardLayout from './pages/dashboard/PlayerDashboardLayout';
import AuctioneerDashboardLayout from './pages/dashboard/AuctioneerDashboardLayout';
import TeamsAndPlayers from './pages/dashboard/TeamsAndPlayers';
import PlayerProfilePage from './pages/dashboard/PlayerProfile';
import BidEvents from './pages/dashboard/BidEvents';
import { History } from './pages/dashboard/History';
import SeasonManagement from './pages/dashboard/SeasonManagement';
import AuctioneerOverview from './pages/dashboard/AuctioneerOverview';
import AuctioneerTeamDetails from './pages/dashboard/AuctioneerTeamDetails';
import AuctioneerPlayers from './pages/dashboard/AuctioneerPlayers';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
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

            {/* Admin Routes - Teams & Players, Seasons, History */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<TeamsAndPlayers />} />
              <Route path="seasons" element={<SeasonManagement />} />
              <Route path="history" element={<History />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};
export default App;
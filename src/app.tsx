import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import Landing from "./pages/Landing";
import Guide from "./pages/Guide";
import Dashboard from "./pages/Dashboard";
import CreateGift from "./pages/gift/CreateGift";
import TokenPage from "./pages/TokenPage";
import ClaimGift from "./pages/ClaimGift";
import { DepositProvider } from "./components/DepositModal";
import { WithdrawProvider } from "./components/WithdrawModal";
import { ConnectWalletProvider } from "./components/ConnectWallet";
import { AuthProvider } from "./auth/AuthProvider";
import Mixes from "./pages/Mixes";
import MixDetail from "./pages/MixDetail";
import Transfer from "./pages/Transfer";
import { RequireAuth } from "./auth/RequireAuth";
import { BalanceProvider } from "./chain/Balances";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
       <BalanceProvider>
        <DepositProvider>
         <WithdrawProvider>
          <ConnectWalletProvider>
            <Routes>
              {/* The dashboard is the first screen. The landing page lives at /welcome. */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/welcome" element={<Landing />} />
              <Route path="/mix" element={<Mixes />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/mix/:id" element={<MixDetail />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/app" element={<Navigate to="/" replace />} />
              <Route path="/app/token/:id" element={<TokenPage />} />
              <Route path="/app/gifts/create" element={<RequireAuth><CreateGift /></RequireAuth>} />
              {/* Claim page stays public: recipients sign in from there */}
              <Route path="/g/:id" element={<ClaimGift />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ConnectWalletProvider>
         </WithdrawProvider>
        </DepositProvider>
       </BalanceProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

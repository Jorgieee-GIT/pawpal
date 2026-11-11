import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";

// Staff and recovery screens are rare entry points; keep them out of the
// player bundle.
const Admin = lazy(() => import("./features/admin/Admin"));
const Develop = lazy(() => import("./Develop"));
const ResetPassword = lazy(() => import("./features/auth/ResetPassword"));

const path = window.location.pathname.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Suspense fallback={null}>
            {path === "/admin" ? (
                <Admin />
            ) : path === "/develop" ? (
                <Develop />
            ) : path === "/reset-password" ? (
                <ResetPassword />
            ) : (
                <App />
            )}
        </Suspense>
    </React.StrictMode>
);

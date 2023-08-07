import React from 'react'
import { Link, Outlet } from "react-router-dom";

export default function Root() {
    return (
      <>
        <Link id="change-route" to="/contacts/1">
          Contact 1
        </Link>
        <Outlet />
      </>
    );
  }
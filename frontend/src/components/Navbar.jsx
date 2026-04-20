import React from "react";
import { Link } from "react-router-dom";
import ApplyPage from "../pages/ApplyPage";

const Navbar = () => {
  return (
    <div className="navbar bg-neutral-600 bg-opacity-60 py-4 shadow-sm text-white">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />{" "}
            </svg>
          </div>
          <ul
            tabIndex="-1"
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            <li>
              <Link>Yorum Analiz</Link>
            </li>
            <li>
              <Link>Rakip Dükkanlar</Link>
            </li>
            <li>
              <Link>Sadakat</Link>
            </li>
            <li>
              <Link>Detaylı Analiz</Link>
            </li>
            <li>
              <Link to="/apply">Başvuru</Link>
            </li>
          </ul>
        </div>
        <Link className="ml-3 text-3xl font-bold font-mono" to={"/"}>
          <span style={{ color: "#FF6000" }}>Open</span>cart
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 text-xl">
          <li>
            <Link>Yorum Analiz</Link>
          </li>
          <li>
            <Link>Rakip Dükkanlar</Link>
          </li>
          <li>
            <Link>Sadakat</Link>
          </li>
          <li>
            <Link>Detaylı Analiz</Link>
          </li>
          <li>
            <Link to="/apply">Başvuru</Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end"></div>
    </div>
  );
};

export default Navbar;

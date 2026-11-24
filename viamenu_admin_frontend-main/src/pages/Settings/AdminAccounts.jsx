import React, { useState } from "react";
import { FaUserShield, FaSearch, FaTimes } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import StatsCard from "../../components/common/StatsCard";
import Pagination from "../../components/common/Pagination";
import "./AdminAccounts.css";

export default function AdminAccounts() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);

  const params = { page, limit: 10, ...(search && { search }) };
  const { data: admins, loading, metadata } = useDataFetch("/admin/settings/admins", "admins", params);

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

  return (
    <div className="aa-page">
      <div className="aa-header">
        <h1 className="aa-title">Admin Accounts</h1>
        <p className="aa-subtitle">{metadata.total_records} admin accounts</p>
      </div>
      <div className="aa-stats">
        <StatsCard icon={FaUserShield} label="Total Admins" value={metadata.total_records} color="#2c8769" />
      </div>
      <div className="aa-filters">
        <div className="aa-search-wrap">
          <FaSearch className="aa-search-icon" />
          <input className="aa-search" placeholder="Search admins…" value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} />
          {searchInput && <FaTimes className="aa-clear" onClick={() => setSearchInput("")} />}
        </div>
        <button className="aa-btn" onClick={() => { setSearchInput(""); setPage(1); }}>
          <FaTimes /> Reset
        </button>
      </div>
      <div className="aa-table-wrap">
        {loading ? (
          <div className="aa-loader"><div className="aa-spinner" /></div>
        ) : admins.length === 0 ? (
          <div className="aa-empty">No admin accounts found</div>
        ) : (
          <table className="aa-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Mobile</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="aa-admin">
                      <div className="aa-avatar">{(a.name?.[0] || "A").toUpperCase()}</div>
                      <div>
                        <div className="aa-name">{a.name}</div>
                        <div className="aa-email">{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{a.mobileNo || "—"}</td>
                  <td><span className="aa-role">Super Admin</span></td>
                  <td>{fmt(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination metadata={metadata} onPageChange={(p) => setPage(p)} />
    </div>
  );
}

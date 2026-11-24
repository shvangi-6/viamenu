import React, { useState, useEffect } from "react";
import { FaUsers } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../utils/axiosInstance";
import StatsCard from "../../components/common/StatsCard";
import "./UserGrowth.css";
import { ENTITY_COLORS as C } from "../../utils/entityColors";

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; };
const today = () => new Date().toISOString().split("T")[0];

export default function UserGrowth() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/analytics/overview", { params: { from, to } });
        if (res.data.statusCode === 200) setData(res.data.data);
      } catch { toast.error("Failed to fetch user growth data"); }
      finally { setLoading(false); }
    };
    fetch();
  }, [from, to]);

  const maxCount = data?.userGrowth?.length ? Math.max(...data.userGrowth.map((r) => r.count), 1) : 1;

  return (
    <div className="ug-page">
      <div className="ug-header">
        <div>
          <h1 className="ug-title">User Growth</h1>
          <p className="ug-subtitle">Daily new user registrations</p>
        </div>
        <div className="ug-date-range">
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="ug-date-input" />
          <span>to</span>
          <input type="date" value={to} min={from} max={today()} onChange={(e) => setTo(e.target.value)} className="ug-date-input" />
        </div>
      </div>

      <div className="ug-stats">
        <StatsCard icon={FaUsers} label="New Users in Period" value={data?.newUsers ?? 0} color={C.users} />
        <StatsCard icon={FaUsers} label="Days with Activity" value={data?.userGrowth?.filter((r) => r.count > 0).length ?? 0} color={C.users} />
      </div>

      {loading ? (
        <div className="ug-loading"><div className="ug-spinner" /></div>
      ) : (
        <div className="ug-card">
          <h3 className="ug-card-title">Daily Registrations</h3>
          {!data?.userGrowth?.length ? (
            <div className="ug-no-data">No user registrations in this period</div>
          ) : (
            <table className="ug-table">
              <thead>
                <tr><th>Date</th><th>New Users</th><th>Visual</th></tr>
              </thead>
              <tbody>
                {data.userGrowth.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td><strong>{row.count}</strong></td>
                    <td>
                      <div className="ug-bar" style={{ width: `${(row.count / maxCount) * 200}px` }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

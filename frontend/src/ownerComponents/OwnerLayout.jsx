import { useContext } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, IndianRupee, Users, Settings, X,
  Clock, ChevronRight, ListChecks, Bell, LogOut, Trophy, Menu,
} from "lucide-react";
import { BookContext } from "../constexts/bookContext";

const navItems = [
  { path: "/owner/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/owner/bookings", icon: CalendarDays, label: "Bookings" },
  { path: "/owner/turfTodaysbookings", icon: ListChecks, label: "Today's schedule" },
  { path: "/owner/time-slots", icon: Clock, label: "Manage slots" },
  { path: "/owner/revenue", icon: IndianRupee, label: "Payments" },
  { path: "/owner/customers", icon: Users, label: "Customers" },
  { path: "/owner/tournaments", icon: Trophy, label: "Tournaments" },
  { path: "/owner/subscription", icon: Bell, label: "Subscriptions" },
  { path: "/owner/turf-profile", icon: Settings, label: "Turf settings" },
];

const OwnerLayout = () => {
  const {
    sidebarOpen, closeSidebar, toggleSidebar, turfs, selectedTurfId,
    setSelectedTurfId, userInfo, handleLogout,
  } = useContext(BookContext);
  const location = useLocation();
  const currentPage = navItems.find((item) => location.pathname === item.path)?.label
    || (location.pathname.startsWith("/owner/time-slots") ? "Manage slots"
      : location.pathname.startsWith("/owner/turfTodaysbookings") ? "Today's schedule"
        : navItems.find((item) => location.pathname.startsWith(item.path))?.label)
    || "Home";
  const selectedTurf = turfs?.find((turf) => String(turf._id) === String(selectedTurfId));

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sora text-white md:flex">
      {sidebarOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden" onClick={closeSidebar} />}

      <aside className={`fixed inset-y-0 right-0 z-40 flex w-[min(18rem,88vw)] flex-col border-l border-white/10 bg-[#111] transition-transform duration-200 md:sticky md:left-0 md:right-auto md:top-0 md:h-screen md:w-[236px] md:translate-x-0 md:border-l-0 md:border-r ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400 font-black text-black">G</div>
            <div><p className="text-sm font-bold tracking-wide">GameTrack</p><p className="mt-0.5 text-xs text-gray-500">Owner workspace</p></div>
          </div>
          <button type="button" aria-label="Close menu" onClick={closeSidebar} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 md:hidden"><X size={18} /></button>
        </div>

        {turfs?.length > 0 && <div className="border-b border-white/10 px-4 py-4">
          <label htmlFor="active-turf" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Your turf</label>
          <select id="active-turf" value={selectedTurfId || ""} onChange={(event) => setSelectedTurfId(event.target.value)} className="min-h-11 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-3 text-sm text-white outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20">
            {turfs.map((turf) => <option key={turf._id} value={turf._id}>{turf.name}</option>)}
          </select>
        </div>}

        <nav aria-label="Owner navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600">Manage your business</p>
          {navItems.map(({ path, icon: Icon, label }) => <NavLink key={path} to={path} onClick={closeSidebar} className={({ isActive }) => `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 ${isActive ? "bg-lime-400 font-semibold text-black" : "text-gray-400 hover:bg-white/[0.06] hover:text-white"}`}>
            {({ isActive }) => <><Icon size={18} className={isActive ? "text-black" : "text-gray-500 group-hover:text-lime-300"} aria-hidden="true" /><span className="flex-1">{label}</span>{isActive && <ChevronRight size={15} aria-hidden="true" />}</>}
          </NavLink>)}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400 font-bold text-black">{(userInfo?.fullname || selectedTurf?.name || "O").slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{userInfo?.fullname || "Turf owner"}</p><p className="mt-0.5 truncate text-xs text-gray-500">{userInfo?.email || "Owner account"}</p></div>
          </div>
          <button type="button" onClick={handleLogout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-gray-400 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"><LogOut size={16} aria-hidden="true" /> Sign out</button>
        </div>
      </aside>

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-[68px] items-center gap-3 border-b border-white/10 bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur md:px-7">
          <button type="button" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={toggleSidebar} className="rounded-lg border border-white/10 p-2 text-gray-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 md:hidden"><Menu size={19} /></button>
          <div className="min-w-0 flex-1"><h1 className="truncate text-base font-semibold text-white">{currentPage}</h1><p className="mt-0.5 text-xs text-gray-500">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p></div>
          <div className="hidden max-w-56 truncate rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-400 sm:block">{selectedTurf?.name || "GameTrack"}</div>
        </header>
        <div className="min-w-0 flex-1"><Outlet /></div>
      </main>
    </div>
  );
};

export default OwnerLayout;

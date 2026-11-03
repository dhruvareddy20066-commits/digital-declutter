import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ITEMS_CHANGED, getStats } from '../api/client.js';
import { DEFAULT_STALE_DAYS } from '../constants.js';

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/items', label: 'All items', end: true },
  { to: '/items/new', label: 'Add item', end: true },
];

const Logo = () => (
  <span className="flex h-9 w-9 flex-col justify-center gap-[3px] rounded-lg bg-pine-600 px-2" aria-hidden="true">
    <span className="h-[3px] w-full rounded bg-dust-400" />
    <span className="h-[3px] w-3/4 rounded bg-paper" />
    <span className="h-[3px] w-1/2 rounded bg-paper" />
  </span>
);

const StaleBadge = ({ count }) =>
  count > 0 ? (
    <span
      className="ml-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-dust-400 px-1.5 text-xs font-bold text-ink"
      title={`${count} stale at ${DEFAULT_STALE_DAYS} days`}
    >
      {count}
      <span className="sr-only"> stale items</span>
    </span>
  ) : null;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [staleCount, setStaleCount] = useState(0);
  const location = useLocation();

  const loadBadge = useCallback(() => {
    getStats(DEFAULT_STALE_DAYS)
      .then((res) => setStaleCount(res.data.staleCount))
      .catch(() => setStaleCount(0));
  }, []);

  useEffect(() => {
    loadBadge();
    window.addEventListener(ITEMS_CHANGED, loadBadge);
    return () => window.removeEventListener(ITEMS_CHANGED, loadBadge);
  }, [loadBadge]);

  // Close the drawer when the route changes.
  useEffect(() => setOpen(false), [location.pathname]);

  const linkClass = ({ isActive }) =>
    `flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors ${
      isActive ? 'bg-pine-50 text-pine-800' : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
          <Logo />
          DigitalDeclutter
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/" className="ml-2 flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-dust-700 hover:bg-dust-50">
            Needs review
            <StaleBadge count={staleCount} />
          </Link>
        </div>

        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-lg hover:bg-ink/5 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          {!open && staleCount > 0 && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-dust-400" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-ink/10 bg-paper px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/" className="flex min-h-[44px] items-center rounded-lg bg-dust-50 px-3 text-sm font-medium text-dust-700">
              Needs review
              <StaleBadge count={staleCount} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

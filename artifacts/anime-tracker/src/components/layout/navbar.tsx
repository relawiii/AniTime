import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Bookmark, Search } from "lucide-react";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useFollowsContext } from "@/hooks/use-follows";
import { NotificationCenter } from "./notification-center";
import { SearchModal } from "./search-modal";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { showJST, setShowJST } = useAppSettings();
  const { follows } = useFollowsContext();
  const safeFollows = Array.isArray(follows) ? follows : [];
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Open search with Ctrl+K / Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/schedule", label: "Schedule" },
    { href: "/following", label: "My List" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen
            ? "bg-[#080808]/95 backdrop-blur-md shadow-xl shadow-black/40"
            : "bg-gradient-to-b from-black/85 to-transparent"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 lg:px-14 h-16 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-10">
            <Link href="/">
              <span className="text-xl font-black tracking-tight cursor-pointer select-none">
                <span className="text-primary">Ani</span>
                <span className="text-white">Stream</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`text-sm cursor-pointer transition-all font-medium ${
                      location === link.href
                        ? "text-white"
                        : "text-white/50 hover:text-white/85"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/45 hover:text-white/80 hover:bg-white/[0.06] transition-all group"
            >
              <Search className="w-4.5 h-4.5" />
              <span className="hidden md:flex items-center gap-1.5 text-xs">
                <span>Search</span>
                <kbd className="text-[10px] font-mono bg-white/[0.08] px-1.5 py-0.5 rounded border border-white/10 text-white/30 group-hover:text-white/40">
                  ⌘K
                </kbd>
              </span>
            </button>

            {/* JST Toggle */}
            <button
              onClick={() => setShowJST(!showJST)}
              className={`hidden md:flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                showJST
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"
              }`}
            >
              JST
            </button>

            {/* My List icon */}
            <Link href="/following">
              <button className="relative p-2 text-white/50 hover:text-white transition-colors rounded-md hover:bg-white/5">
                <Bookmark className="w-5 h-5" />
                {safeFollows.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                    {safeFollows.length > 9 ? "9+" : safeFollows.length}
                  </span>
                )}
              </button>
            </Link>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] px-5 py-4 space-y-1 bg-[#080808]/98 backdrop-blur-md">
            {/* Mobile search */}
            <button
              onClick={() => { setSearchOpen(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 text-sm font-medium py-3 px-3 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <Search className="w-4 h-4" />
              Search anime
            </button>
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <div
                  className={`text-sm font-medium py-3 px-3 rounded-lg cursor-pointer transition-all ${
                    location === link.href
                      ? "text-white bg-white/5"
                      : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </div>
              </Link>
            ))}
            <div className="pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setShowJST(!showJST)}
                className={`flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-lg border transition-all ${
                  showJST
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "text-white/40 border-white/10"
                }`}
              >
                JST Mode {showJST ? "On" : "Off"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

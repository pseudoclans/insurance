"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Upload, Search, Users } from "lucide-react";

const navLinks = [
  { href: "/", label: "Upload Claim", icon: Upload },
  { href: "/status", label: "Claim Status", icon: Search },
  { href: "/dashboard", label: "Adjuster Dashboard", icon: Users },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Shield className="w-7 h-7 text-primary" />
          <span className="text-lg font-semibold text-primary">
            InsureTriage
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

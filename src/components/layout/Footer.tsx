import { Link } from "react-router-dom";
import { Twitter, Github } from "lucide-react";

const footerLinks = [
  { label: "Privacy", path: "/policy" },
  { label: "Terms", path: "/terms" },
  { label: "Contact", path: "/contact" },
];

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  { icon: Github, label: "GitHub", href: "https://github.com" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="h-[84px] bg-card border-t border-border mt-auto">
      <div className="container-main h-full flex items-center justify-between">
        {/* Copyright */}
        <p className="text-sm text-muted-foreground">
          © {currentYear} Smart Tourist Safety
        </p>

        {/* Navigation Links */}
        <nav className="flex items-center gap-4 sm:gap-6" aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-ring rounded px-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Social Links */}
        <div className="flex items-center gap-2">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all focus-ring"
                aria-label={social.label}
              >
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}

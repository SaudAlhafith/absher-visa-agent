import { Plane, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer" data-testid="link-home">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">Absher</h1>
                <p className="text-xs text-muted-foreground">Visa Services</p>
              </div>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/">
              <span className="text-sm font-medium text-foreground cursor-pointer" data-testid="nav-home">
                Home
              </span>
            </Link>
            <Link href="/">
              <span className="text-sm text-muted-foreground cursor-pointer" data-testid="nav-services">
                Services
              </span>
            </Link>
            <Link href="/">
              <span className="text-sm text-muted-foreground cursor-pointer" data-testid="nav-help">
                Help
              </span>
            </Link>
          </nav>

          <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

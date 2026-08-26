import { Link, useLocation } from "@tanstack/react-router";
import { 
  Coins, 
  LayoutDashboard, 
  Gift, 
  Share2, 
  LogOut, 
  Menu, 
  X, 
  Shield, 
  Settings, 
  User,
  Bell,
  History,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Sparkles,
  Zap,
  CheckCircle2,
  Star,
  HelpCircle
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { NotificationsPopover } from "./NotificationsPopover";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Mobile Menu Overlay Component
const MobileMenuOverlay = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => (
  <div 
    className={cn(
      "md:hidden fixed inset-0 z-[70] flex transition-all duration-300 ease-out",
      isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
    )}
  >
    <div 
      className={cn(
        "fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0"
      )} 
      onClick={onClose} 
    />
    <div 
      className={cn(
        "relative w-72 h-full bg-card shadow-2xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col",
        isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
      )}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-2 top-2"
        onClick={onClose}
        aria-label="Close menu"
      >
        <X className="h-5 w-5" />
      </Button>
      {children}
    </div>
  </div>
);

export function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isAuthPage = location.pathname === "/auth";
  const isLandingPage = location.pathname === "/";

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !isAuthPage && !isLandingPage,
  });

  const { data: authInfo } = useQuery({
    queryKey: ["authInfo"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAdmin: false, isModerator: false, isTasker: false };
      
      const [{ data: isAdmin }, { data: isModerator }, { data: isTasker }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: 'admin' }),
        supabase.rpc("has_role", { _user_id: user.id, _role: 'moderator' }),
        supabase.rpc("has_role", { _user_id: user.id, _role: 'tasker' })
      ]);
      
      return { isAdmin, isModerator, isTasker };
    },
    enabled: !isAuthPage && !isLandingPage,
  });

  const isAdmin = authInfo?.isAdmin || false;
  const isModerator = authInfo?.isModerator || false;
  const isTasker = (authInfo?.isTasker as boolean) || false;

  // Auth page renders its own standalone layout with no global header
  if (isAuthPage) return null;

  // Custom transparent navbar for landing pages
  if (isLandingPage) {
    return (
      <>
        <nav className="fixed top-4 left-4 right-4 z-50 glass-card rounded-2xl premium-shadow-lg max-w-[calc(100vw-2rem)]">
          <div className="container mx-auto px-4 flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              {!isAuthPage && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden hover:bg-primary/5 transition-colors" 
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6 text-foreground" />
                </Button>
              )}
              <Link to="/" className="flex items-center gap-2 font-black text-2xl hover:opacity-80 transition-opacity uppercase tracking-tighter">
                <img src="/logo.png" alt="Noble Gain" className="h-8 w-8 object-contain" />
                <span className="hidden xs:inline text-foreground">Noble <span className="text-[#e6c17a]">Gain</span></span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-bold uppercase text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-bold uppercase text-muted-foreground hover:text-primary transition-colors">How It Works</a>
              <a href="#testimonials" className="text-sm font-bold uppercase text-muted-foreground hover:text-primary transition-colors">Testimonials</a>
              <a href="#faq" className="text-sm font-bold uppercase text-muted-foreground hover:text-primary transition-colors">FAQ</a>
            </div>
            
            <div className="flex items-center gap-4">
              {!isAuthPage && (
                <>
                  <Button variant="ghost" className="font-bold uppercase hidden sm:flex hover:bg-primary/5 transition-colors" asChild>
                    <Link to="/auth">Log in</Link>
                  </Button>
                  <Button className="font-bold uppercase premium-shadow hover:scale-105 transition-transform" asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </nav>


        {/* Landing Page Mobile Overlay Menu */}
        <MobileMenuOverlay isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 pr-10">
              <Link to="/" className="flex items-center gap-2 font-black text-xl uppercase tracking-tighter">
                <img src="/logo.png" alt="Noble Gain" className="h-8 w-8 object-contain" />
                <span className="text-foreground">Noble <span className="text-[#e6c17a]">Gain</span></span>
              </Link>
            </div>

            <nav className="flex flex-col gap-4">
              <a 
                href="#features" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-bold uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-3"
              >
                <Zap className="h-5 w-5 text-primary" />
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-bold uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-primary" />
                How It Works
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-bold uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-3"
              >
                <Star className="h-5 w-5 text-primary" />
                Testimonials
              </a>
              <a 
                href="#faq" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-bold uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-3"
              >
                <HelpCircle className="h-5 w-5 text-primary" />
                FAQ
              </a>
            </nav>

            <div className="mt-auto space-y-4">
              <Button variant="outline" className="w-full font-bold uppercase h-12 rounded-2xl glass-card" asChild>
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
              </Button>
              <Button className="w-full font-bold uppercase h-12 rounded-2xl premium-shadow hover:scale-105 transition-transform" asChild>
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </div>
        </MobileMenuOverlay>
      </>
    );
  }



  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('noble-gain-remember-me');
      sessionStorage.removeItem('noble-gain-session-active');
      toast.success("Successfully signed out. See you soon!");
      // Force a full reload to landing page to clear all states
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error signing out. Please try again.");
    }
  };

  const menuGroups = [
    {
      label: "Main Menu",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Earn Points", href: "/earn", icon: Coins },
        
        { name: "Redeem", href: "/redeem", icon: Gift },
        { name: "Referral", href: "/refer", icon: Share2 },
      ]
    },
    {
      label: "Account",
      items: [
        { name: "Profile", href: "/profile", icon: User },
        { name: "Settings", href: "/settings" as any, icon: Settings },
        ...(isAdmin ? [{ name: "Admin Panel", href: "/admin", icon: Shield }] : []),
        ...(isModerator && !isAdmin ? [{ name: "Moderator Panel", href: "/moderator", icon: Shield }] : []),
        ...(isTasker && !isModerator && !isAdmin ? [{ name: "Tasker Panel", href: "/tasker", icon: Shield }] : []),
      ]
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4 bg-ink text-ink-fg">
      <div className="flex items-center gap-3 px-2 mb-8">
        <img src="/logo.png" alt="Noble Gain" className="h-8 w-8 object-contain shrink-0" />
        <span className="font-black text-xl tracking-[-0.03em] text-ink-fg">Noble<span className="text-gold">Gain</span></span>
      </div>

      <div className="flex-1 space-y-8">
        {menuGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            <h3 className="px-2 text-[10px] font-bold text-ink-muted uppercase tracking-[0.18em]">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group",
                      isActive
                        ? "bg-gold/15 text-gold border border-gold/30 shadow-sm"
                        : "text-ink-muted hover:bg-ink-2 hover:text-ink-fg"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4.5 w-4.5 transition-colors",
                      isActive ? "text-gold fill-gold/20" : "text-ink-muted group-hover:text-ink-fg"
                    )} strokeWidth={2} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-hairline">
        <div className="flex items-center gap-3 px-2 mb-4">
          <Avatar className="h-10 w-10 border border-hairline shadow-sm">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-ink-2 text-gold font-bold">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          {profile && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink-fg truncate">{profile.username ? (profile.username.charAt(0).toUpperCase() + profile.username.slice(1)) : "Member"}</p>
              <p className="text-[11px] text-ink-muted truncate font-mono">{profile.points_balance?.toLocaleString() || 0} PTS</p>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-ink-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-xl px-3 h-10 transition-colors text-xs font-bold cursor-pointer"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="mr-2.5 h-4 w-4" strokeWidth={2} />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl glass-card border-border/40 max-w-[400px] premium-shadow">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-xl">Sign out of Noble Gain?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              You'll need to sign back in to access your rewards and track your progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-2xl font-bold border-border/40 hover:bg-primary/5 transition-colors">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              className="rounded-2xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-3 left-3 right-3 z-50 flex items-center justify-between h-15 px-4 bg-ink/85 border border-hairline rounded-2xl ink-header-shadow backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 font-black text-base tracking-[-0.03em] ml-1">
            <img src="/logo.png" alt="Noble Gain" className="h-7 w-7 object-contain" />
            <span className="leading-tight text-ink-fg">Noble<span className="text-gold">Gain</span></span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
           <ThemeToggle />
           <NotificationsPopover />
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-gold/30 shadow-sm ring-1 ring-gold/20 transition-transform hover:scale-105" aria-label="User menu">
                <Avatar className="h-full w-full">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-ink-2 text-gold font-bold">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2 rounded-2xl p-2 bg-ink-2 border border-hairline text-ink-fg shadow-xl" align="end">
              <DropdownMenuLabel className="font-black px-3 py-2">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-black text-ink-fg">{profile?.username ? (profile.username.charAt(0).toUpperCase() + profile.username.slice(1)) : "Member"}</p>
                  <p className="text-[10px] text-gold uppercase tracking-wider font-mono font-bold">{profile?.points_balance?.toLocaleString()} PTS</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-hairline my-1" />
              <DropdownMenuItem asChild className="rounded-xl focus:bg-ink-3 focus:text-gold cursor-pointer px-3 py-2 font-bold text-xs transition-colors">
                <Link to="/profile" className="flex items-center w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <User className="mr-2.5 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild className="rounded-xl focus:bg-ink-3 focus:text-gold cursor-pointer px-3 py-2 font-bold text-xs transition-colors">
                  <Link to="/admin" className="flex items-center w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Shield className="mr-2.5 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              {isModerator && !isAdmin && (
                <DropdownMenuItem asChild className="rounded-xl focus:bg-ink-3 focus:text-gold cursor-pointer px-3 py-2 font-bold text-xs transition-colors">
                  <Link to="/moderator" className="flex items-center w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Shield className="mr-2.5 h-4 w-4" />
                    Moderator Panel
                  </Link>
                </DropdownMenuItem>
              )}
              {isTasker && !isModerator && !isAdmin && (
                <DropdownMenuItem asChild className="rounded-xl focus:bg-ink-3 focus:text-gold cursor-pointer px-3 py-2 font-bold text-xs transition-colors">
                  <Link to="/tasker" className="flex items-center w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Shield className="mr-2.5 h-4 w-4" />
                    Tasker Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="rounded-xl focus:bg-ink-3 focus:text-gold cursor-pointer px-3 py-2 font-bold text-xs transition-colors">
                <Link to="/transactions" className="flex items-center w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <History className="mr-2.5 h-4 w-4" />
                  Points History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer px-3 py-2 font-bold text-xs text-rose-400 transition-colors">
                <button onClick={() => setShowLogoutDialog(true)} className="flex items-center w-full">
                  <LogOut className="mr-2.5 h-4 w-4" />
                  Sign out
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Overlay Sidebar (Off-canvas Drawer) */}
      <MobileMenuOverlay isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
        <SidebarContent />
      </MobileMenuOverlay>

      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:flex fixed top-0 left-0 z-40 w-72 h-screen bg-ink border-r border-hairline">
        <SidebarContent />
      </aside>

      {/* Desktop Top Bar */}
      <header className="hidden md:flex fixed top-0 right-0 z-30 h-20 items-center justify-between pl-80 pr-8 left-0 bg-ink/85 border-b border-hairline backdrop-blur-xl">
        <div className="flex flex-col">
          <h1 className="text-base font-black uppercase tracking-tight text-ink-fg">
            {location.pathname === "/dashboard" && "Dashboard Overview"}
            {location.pathname === "/earn" && "Earn Opportunities"}
            {location.pathname === "/refer" && "Referral Accelerator"}
            {location.pathname === "/redeem" && "Rewards Catalog"}
            {location.pathname === "/profile" && "Account Profile"}
            {location.pathname === "/transactions" && "Points Ledger"}
            {location.pathname === "/settings" && "Account Settings"}
            {location.pathname === "/admin" && "Admin Control Panel"}
          </h1>
          <p className="text-[11px] text-ink-muted font-medium">
            Welcome back, <strong className="text-gold">{profile?.username ? (profile.username.charAt(0).toUpperCase() + profile.username.slice(1)) : "Member"}</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5 bg-ink-2/80 border border-hairline px-3.5 py-1.5 rounded-xl">
            <Coins className="h-4 w-4 text-gold" strokeWidth={2.5} />
            <span className="text-xs font-mono font-black text-ink-fg">
              {profile?.points_balance?.toLocaleString() || 0}
              <span className="text-[10px] text-gold ml-1 font-bold">PTS</span>
            </span>
          </div>
          <div className="h-6 w-[1px] bg-hairline mx-0.5" />
          <ThemeToggle />
          <NotificationsPopover />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-gold/30 shadow-sm ring-1 ring-gold/20 transition-transform hover:scale-105 active:scale-95" aria-label="User profile menu">
                <Avatar className="h-full w-full">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-ink-2 text-gold font-bold">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 mt-2 rounded-2xl p-2 bg-ink-2 border border-hairline text-ink-fg shadow-xl" align="end">
              <DropdownMenuLabel className="font-black px-3 py-2.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-black text-ink-fg">{profile?.username ? (profile.username.charAt(0).toUpperCase() + profile.username.slice(1)) : "Member"}</p>
                  <div className="flex items-center gap-1.5 bg-ink border border-hairline w-fit px-2.5 py-1 rounded-lg">
                    <Coins className="h-3 w-3 text-gold" />
                    <p className="text-[11px] text-gold uppercase tracking-wider font-mono font-bold">{profile?.points_balance?.toLocaleString()} PTS</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-hairline my-1" />
              <DropdownMenuItem asChild className="rounded-xl focus:bg-ink-3 focus:text-gold cursor-pointer px-3 py-2 font-bold text-xs transition-colors">
                <Link to="/profile" className="flex items-center w-full">
                  <User className="mr-2.5 h-4 w-4" strokeWidth={2} />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl focus:bg-ink-3 focus:text-gold cursor-pointer px-3 py-2 font-bold text-xs transition-colors">
                <Link to="/settings" className="flex items-center w-full">
                  <Settings className="mr-2.5 h-4 w-4" strokeWidth={2} />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl focus:bg-ink-3 focus:text-gold cursor-pointer px-3 py-2 font-bold text-xs transition-colors">
                <Link to="/transactions" className="flex items-center w-full">
                  <History className="mr-2.5 h-4 w-4" strokeWidth={2} />
                  Points History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-hairline my-1" />
              <DropdownMenuItem asChild className="rounded-xl focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer px-3 py-2 font-bold text-xs text-rose-400 transition-colors">
                <button onClick={() => setShowLogoutDialog(true)} className="flex items-center w-full">
                  <LogOut className="mr-2.5 h-4 w-4" strokeWidth={2} />
                  Sign out
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}

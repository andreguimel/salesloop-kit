import { useState, useEffect } from "react";
import { LayoutDashboard, Search, History, FileBarChart, LogOut, Target, AlertCircle, Settings, Moon, Sun, Coins, FileText, Shield, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOverdueTasks } from "@/hooks/useOverdueTasks";
import { useCredits } from "@/hooks/useCredits";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Buscar Empresas", url: "/buscar", icon: Search },
  { title: "CRM", url: "/crm", icon: Target, showOverdue: true },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut, user } = useAuth();
  const { count: overdueCount } = useOverdueTasks();
  const { balance, loading: creditsLoading, isLow, isCritical } = useCredits();
  const { theme, setTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(data === true);
    };
    checkAdmin();
  }, [user]);

  const isActive = (path: string) => currentPath === path;
  const isDark = theme === "dark";

  const getCreditsBadgeVariant = () => {
    if (isCritical) return "destructive";
    if (isLow) return "secondary";
    return "default";
  };

  const getCreditsBadgeClass = () => {
    if (isCritical) return "bg-destructive text-destructive-foreground";
    if (isLow) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar text-sidebar-foreground">
      <SidebarContent className="pt-4 bg-sidebar">
        {/* Logo/Brand */}
        <div className="px-4 pb-4 mb-2 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary">
              <Search className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">Achei Leads</h1>
                <p className="text-xs text-sidebar-foreground/60">Prospecção Inteligente</p>
              </div>
            )}
          </div>
        </div>

        {/* Credits Section */}
        <div className="px-4 pb-3 border-b border-sidebar-border">
          <Link 
            to="/creditos" 
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-sidebar-accent",
              currentPath === "/creditos" && "bg-sidebar-accent"
            )}
          >
            <Coins className={cn(
              "h-5 w-5",
              isCritical ? "text-destructive" : isLow ? "text-yellow-500" : "text-emerald-500"
            )} />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm text-sidebar-foreground">Créditos</span>
                <Badge 
                  variant="outline" 
                  className={cn("font-bold", getCreditsBadgeClass())}
                >
                  {creditsLoading ? "..." : balance}
                </Badge>
              </div>
            )}
            {collapsed && !creditsLoading && (
              <Badge 
                variant="outline" 
                className={cn("absolute -top-1 -right-1 h-5 px-1.5 text-[10px]", getCreditsBadgeClass())}
              >
                {balance}
              </Badge>
            )}
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">
            {!collapsed && "Menu"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-sidebar-accent text-sidebar-foreground"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    >
                      <div className="relative">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.showOverdue && overdueCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {overdueCount > 9 ? '9+' : overdueCount}
                          </span>
                        )}
                      </div>
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          {item.title}
                          {item.showOverdue && overdueCount > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                              <AlertCircle className="h-3 w-3 mr-0.5" />
                              {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">
              {!collapsed && "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin")}
                    tooltip="Painel Admin"
                  >
                    <NavLink
                      to="/admin"
                      end
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-sidebar-accent text-sidebar-foreground"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    >
                      <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                      {!collapsed && <span>Painel Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 bg-sidebar space-y-2">
        {/* Theme Toggle Switch */}
        <div 
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
            "hover:bg-sidebar-accent"
          )}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          <div className="relative">
            {/* Toggle Track */}
            <div className={cn(
              "w-11 h-6 rounded-full transition-colors duration-300",
              isDark ? "bg-primary/30" : "bg-amber-500/30"
            )}>
              {/* Toggle Thumb with Icon */}
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-md",
                isDark 
                  ? "left-[22px] bg-primary" 
                  : "left-0.5 bg-amber-500"
              )}>
                {isDark ? (
                  <Moon className="h-3 w-3 text-primary-foreground" />
                ) : (
                  <Sun className="h-3 w-3 text-white" />
                )}
              </div>
            </div>
          </div>
          {!collapsed && (
            <span className="text-sm text-sidebar-foreground/70">
              {isDark ? "Tema Escuro" : "Tema Claro"}
            </span>
          )}
        </div>

        {/* Terms and Privacy Links */}
        <div className="flex flex-col gap-1">
          <Link 
            to="/termos-de-uso"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
              "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              currentPath === "/termos-de-uso" && "bg-sidebar-accent text-sidebar-foreground"
            )}
          >
            <FileText className="h-4 w-4" />
            {!collapsed && <span>Termos de Uso</span>}
          </Link>
          <Link 
            to="/politica-privacidade"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
              "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              currentPath === "/politica-privacidade" && "bg-sidebar-accent text-sidebar-foreground"
            )}
          >
            <Shield className="h-4 w-4" />
            {!collapsed && <span>Privacidade</span>}
          </Link>
        </div>

        {!collapsed && user && (
          <div className="px-2">
            <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

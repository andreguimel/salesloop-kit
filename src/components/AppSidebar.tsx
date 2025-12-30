import { LayoutDashboard, Search, History, FileBarChart, LogOut, Target, AlertCircle, Settings, Moon, Sun, Coins } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOverdueTasks } from "@/hooks/useOverdueTasks";
import { useCredits } from "@/hooks/useCredits";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 bg-sidebar space-y-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{isDark ? "Tema Claro" : "Tema Escuro"}</span>}
        </Button>

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

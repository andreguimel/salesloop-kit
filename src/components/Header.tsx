import { Sparkles, Menu, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 glass">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary glow-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gradient">ProspectPro</h1>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-foreground font-medium">
            Dashboard
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
            Campanhas
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
            Relatórios
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-foreground">
            <User className="h-5 w-5" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] glass-strong">
              <nav className="flex flex-col gap-4 mt-8">
                <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  Dashboard
                </a>
                <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Campanhas
                </a>
                <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Relatórios
                </a>
                <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Configurações
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

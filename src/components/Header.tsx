import { Zap, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ProspectPro</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Prospecção Inteligente</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Dashboard
          </a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Campanhas
          </a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Relatórios
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden md:flex">
            Configurações
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
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

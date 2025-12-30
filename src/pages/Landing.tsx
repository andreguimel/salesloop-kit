import { Link } from 'react-router-dom';
import { 
  Search, 
  Target, 
  Zap, 
  TrendingUp, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  CheckCircle2,
  ArrowRight,
  Star,
  Shield,
  Clock,
  BarChart3,
  Globe,
  MessageSquare,
  ChevronRight,
  Play,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Landing = () => {
  const features = [
    {
      icon: Search,
      title: 'Busca por CNAE',
      description: 'Encontre empresas por código CNAE ou atividade econômica.',
    },
    {
      icon: Target,
      title: 'Leads Qualificados',
      description: 'Acesse informações disponíveis: telefones, e-mails, redes sociais e endereço comercial.',
    },
    {
      icon: Zap,
      title: 'Enriquecimento Automático',
      description: 'Nosso sistema busca automaticamente dados adicionais para cada empresa.',
    },
    {
      icon: TrendingUp,
      title: 'CRM Integrado',
      description: 'Gerencie seus leads com pipeline personalizado, atividades e histórico completo.',
    },
  ];

  const mockLeads = [
    { name: 'Tech Solutions Ltda', cnae: '6201-5/00', activity: 'Desenvolvimento de programas', city: 'São Paulo', phone: '(11) 9****-4567', email: 'contato@tech***.com.br' },
    { name: 'Construtora Horizonte', cnae: '4120-4/00', activity: 'Construção de edifícios', city: 'Rio de Janeiro', phone: '(21) 9****-8901', email: 'comercial@horiz***.com.br' },
    { name: 'Clínica Saúde Total', cnae: '8630-5/01', activity: 'Atividade médica ambulatorial', city: 'Belo Horizonte', phone: '(31) 9****-2345', email: 'atendimento@sau***.com.br' },
    { name: 'Restaurante Sabor & Arte', cnae: '5611-2/01', activity: 'Restaurantes e similares', city: 'Curitiba', phone: '(41) 9****-6789', email: 'reservas@sabo***.com.br' },
    { name: 'Academia Fitness Pro', cnae: '9313-1/00', activity: 'Atividades de condicionamento físico', city: 'Porto Alegre', phone: '(51) 9****-0123', email: 'info@fitne***.com.br' },
  ];

  // Pacotes reais do sistema
  const plans = [
    {
      name: 'Starter',
      credits: 100,
      bonus: 0,
      price: 25,
      popular: false,
      features: ['100 leads qualificados', 'Dados completos', 'Suporte por e-mail', 'Exportação CSV'],
    },
    {
      name: 'Pro',
      credits: 200,
      bonus: 30,
      price: 50,
      popular: true,
      features: ['200 + 30 leads bônus', 'CRM integrado', 'Suporte prioritário', 'Exportação ilimitada', 'Enriquecimento IA'],
    },
    {
      name: 'Business',
      credits: 400,
      bonus: 100,
      price: 100,
      popular: false,
      features: ['400 + 100 leads bônus', 'Suporte dedicado', 'Dashboard avançado', 'Relatórios personalizados'],
    },
    {
      name: 'Agency',
      credits: 1200,
      bonus: 500,
      price: 300,
      popular: false,
      features: ['1200 + 500 leads bônus', 'API de integração', 'Suporte VIP', 'Multi-usuários', 'White label'],
    },
  ];

  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'Diretor Comercial',
      company: 'TechVendas SA',
      content: 'Triplicamos nossas vendas em 3 meses usando a plataforma. Os leads são extremamente qualificados!',
      avatar: 'CS',
    },
    {
      name: 'Ana Paula Mendes',
      role: 'CEO',
      company: 'Consultoria Prime',
      content: 'A melhor ferramenta de prospecção que já utilizei. Interface intuitiva e dados sempre atualizados.',
      avatar: 'AM',
    },
    {
      name: 'Roberto Santos',
      role: 'Gerente de Marketing',
      company: 'Digital Growth',
      content: 'O CRM integrado fez toda a diferença no acompanhamento dos nossos leads. Recomendo muito!',
      avatar: 'RS',
    },
  ];

  const stats = [
    { value: '50M+', label: 'Empresas Cadastradas' },
    { value: '98%', label: 'Taxa de Precisão' },
    { value: '10K+', label: 'Clientes Ativos' },
    { value: '24/7', label: 'Dados Atualizados' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl gradient-primary">
              <Search className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">Achei Leads</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">Demo</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-primary border-0 hover:opacity-90">
                Começar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              <Star className="h-4 w-4 mr-2 text-warning" />
              Mais de 10.000 empresas já usam
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Encontre os <span className="text-gradient">leads perfeitos</span> para o seu negócio
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Acesse milhões de empresas brasileiras com dados completos e atualizados. 
              Prospecte com inteligência e feche mais negócios.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary border-0 hover:opacity-90 text-lg px-8 py-6 glow-primary">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#demo">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 group">
                  <Play className="mr-2 h-5 w-5 group-hover:text-primary transition-colors" />
                  Ver Demonstração
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="glass rounded-xl p-4 hover-glow"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-2xl sm:text-3xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Recursos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa para <span className="text-gradient">prospectar</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para encontrar, qualificar e gerenciar seus leads de forma eficiente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="glass border-border/50 hover-glow group cursor-pointer"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo/Mockup Section */}
      <section id="demo" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Demonstração</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Veja a plataforma em <span className="text-gradient">ação</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simule uma busca e veja o tipo de dados que você terá acesso ao se cadastrar.
            </p>
          </div>

          {/* Interactive Mockup */}
          <div className="max-w-5xl mx-auto">
            <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-2xl glow-primary">
              {/* Mockup Header */}
              <div className="bg-secondary/50 border-b border-border/50 p-4 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-background/50 rounded-lg px-4 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    acheileads.com.br/buscar
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-6 border-b border-border/50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Buscar por CNAE, atividade econômica ou cidade..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary/50 border border-border/50 focus:outline-none focus:border-primary/50 transition-colors"
                      defaultValue="5611-2/01 - Restaurantes em São Paulo"
                    />
                  </div>
                  <Button className="gradient-primary border-0 px-8">
                    <Search className="h-5 w-5 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>

              {/* Results */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    Encontradas <span className="text-foreground font-semibold">2.847</span> empresas
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Dados em tempo real
                  </Badge>
                </div>

                <div className="space-y-3">
                  {mockLeads.map((lead, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-accent-foreground" />
                          </div>
                          <div>
                            <h4 className="font-semibold group-hover:text-primary transition-colors">{lead.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge variant="outline" className="text-xs font-mono">{lead.cnae}</Badge>
                              <span className="text-xs text-muted-foreground">{lead.activity}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {lead.city}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {lead.phone}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {lead.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Blur overlay for locked content */}
                <div className="relative mt-4">
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2">Desbloqueie todos os dados</h4>
                      <p className="text-muted-foreground text-sm mb-4">
                        Cadastre-se gratuitamente e comece a prospectar
                      </p>
                      <Link to="/auth">
                        <Button className="gradient-primary border-0">
                          Criar Conta Grátis
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="blur-sm opacity-50 pointer-events-none">
                    {mockLeads.slice(0, 2).map((lead, index) => (
                      <div key={index} className="p-4 rounded-xl bg-secondary/30 border border-border/30 mb-3">
                        <div className="h-12 bg-secondary/50 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Por que escolher?</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Economize tempo e <span className="text-gradient">feche mais vendas</span>
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Clock, text: 'Economize 80% do tempo com prospecção manual' },
                  { icon: BarChart3, text: 'Aumente sua taxa de conversão com leads qualificados' },
                  { icon: Users, text: 'Gerencie toda sua equipe em um só lugar' },
                  { icon: MessageSquare, text: 'Integre com WhatsApp e e-mail marketing' },
                  { icon: Shield, text: 'Dados em conformidade com a LGPD' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl glass hover-glow">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="glass rounded-2xl p-8 border border-border/50">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-gradient mb-2">3x</div>
                  <p className="text-muted-foreground">mais vendas em média</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-success">+156%</div>
                    <p className="text-xs text-muted-foreground">Leads qualificados</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-accent">-80%</div>
                    <p className="text-xs text-muted-foreground">Tempo de prospecção</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-warning">98%</div>
                    <p className="text-xs text-muted-foreground">Precisão dos dados</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary">24h</div>
                    <p className="text-xs text-muted-foreground">Dados atualizados</p>
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Preços</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Planos para todos os <span className="text-gradient">tamanhos</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comece gratuitamente e escale conforme sua necessidade. Sem contratos, cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative glass border-border/50 hover-glow overflow-hidden ${
                  plan.popular ? 'ring-2 ring-primary scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 gradient-primary py-1 text-center text-xs font-medium text-primary-foreground">
                    Mais Popular
                  </div>
                )}
                <CardHeader className={plan.popular ? 'pt-10' : ''}>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-4xl font-bold text-foreground">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-4 rounded-xl bg-secondary/50">
                    <div className="text-3xl font-bold text-gradient">
                      {plan.credits.toLocaleString()}
                      {plan.bonus > 0 && (
                        <span className="text-success text-lg ml-1">+{plan.bonus}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">créditos/leads</p>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/auth" className="block">
                    <Button 
                      className={`w-full ${plan.popular ? 'gradient-primary border-0' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Começar Agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <p className="text-xs text-center text-muted-foreground">
                    R$ {(plan.price / (plan.credits + plan.bonus)).toFixed(2).replace('.', ',')} por lead
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Depoimentos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              O que nossos clientes <span className="text-gradient">dizem</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass border-border/50 hover-glow">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role} - {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Pronto para transformar sua <span className="text-gradient">prospecção</span>?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Junte-se a milhares de empresas que já estão fechando mais negócios com nossa plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary border-0 hover:opacity-90 text-lg px-8 py-6 glow-primary">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              ✓ Sem cartão de crédito &nbsp;•&nbsp; ✓ Teste grátis &nbsp;•&nbsp; ✓ Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl gradient-primary">
                <Search className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-gradient">Achei Leads</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link to="/politica-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
              <a href="mailto:contato@acheileads.com.br" className="hover:text-foreground transition-colors">Contato</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Achei Leads. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import { useState, useEffect } from 'react';
import { GripVertical, DollarSign, Calendar, CheckCircle2, Target, BarChart3, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CompanyCard {
  id: string;
  name: string;
  city: string;
  value: number | null;
  date?: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  companies: CompanyCard[];
}

const initialStages: Stage[] = [
  {
    id: 'prospeccao',
    name: 'Prospecção',
    color: '#6366f1',
    companies: [
      { id: 'c1', name: 'Tech Solutions LTDA', city: 'São Paulo, SP', value: 5000 },
      { id: 'c2', name: 'Digital Commerce SA', city: 'Rio de Janeiro, RJ', value: 8500 },
      { id: 'c3', name: 'Inovação Tech ME', city: 'Curitiba, PR', value: null },
    ],
  },
  {
    id: 'contato',
    name: 'Contato',
    color: '#f59e0b',
    companies: [
      { id: 'c4', name: 'Construções Modernas', city: 'Belo Horizonte, MG', value: 15000, date: '15/01' },
      { id: 'c5', name: 'Logística Express', city: 'Campinas, SP', value: 7200, date: '20/01' },
    ],
  },
  {
    id: 'proposta',
    name: 'Proposta',
    color: '#8b5cf6',
    companies: [
      { id: 'c6', name: 'Indústria Alimentícia', city: 'Porto Alegre, RS', value: 25000, date: '10/01' },
    ],
  },
  {
    id: 'fechado',
    name: 'Fechado',
    color: '#10b981',
    companies: [
      { id: 'c7', name: 'Consultoria Alpha', city: 'Brasília, DF', value: 45000 },
    ],
  },
];

// Animation sequence: card id, from stage, to stage
const animationSequence = [
  { cardId: 'c1', from: 'prospeccao', to: 'contato' },
  { cardId: 'c4', from: 'contato', to: 'proposta' },
  { cardId: 'c6', from: 'proposta', to: 'fechado' },
];

export function CrmMockupSection() {
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const runAnimation = () => {
      const step = animationSequence[animationStep];
      if (!step) {
        // Reset and start over
        setTimeout(() => {
          setStages(initialStages);
          setAnimationStep(0);
        }, 2000);
        return;
      }

      // Start animating the card
      setAnimatingCard(step.cardId);

      // After animation, move the card
      setTimeout(() => {
        setStages(prevStages => {
          const newStages = prevStages.map(stage => ({
            ...stage,
            companies: [...stage.companies],
          }));

          // Find and remove card from source
          const fromStage = newStages.find(s => s.id === step.from);
          const toStage = newStages.find(s => s.id === step.to);
          
          if (fromStage && toStage) {
            const cardIndex = fromStage.companies.findIndex(c => c.id === step.cardId);
            if (cardIndex !== -1) {
              const [card] = fromStage.companies.splice(cardIndex, 1);
              toStage.companies.unshift(card);
            }
          }

          return newStages;
        });

        setAnimatingCard(null);
        setAnimationStep(prev => prev + 1);
      }, 800);
    };

    const timer = setTimeout(runAnimation, 2500);
    return () => clearTimeout(timer);
  }, [animationStep]);

  const getStageTotal = (companies: CompanyCard[]) => {
    return companies.reduce((sum, c) => sum + (c.value || 0), 0);
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">CRM Integrado</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Gerencie seus leads com <span className="text-gradient">pipeline visual</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Acompanhe cada oportunidade do primeiro contato até o fechamento. 
            Arraste e solte para mover leads entre estágios.
          </p>
        </div>

        {/* Kanban Mockup */}
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-2xl border border-border/50 p-4 overflow-hidden shadow-2xl">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {stages.map((stage) => (
                <div key={stage.id} className="flex-shrink-0 w-64">
                  <div className={`glass rounded-xl border overflow-hidden transition-all duration-300 ${
                    stage.id === 'fechado' ? 'border-success/30' : 
                    stage.id === 'proposta' ? 'border-primary/50 ring-2 ring-primary/30' : 
                    'border-border/30'
                  }`}>
                    <div className="p-3 border-b border-border/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full transition-transform duration-300" 
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-sm font-medium">{stage.name}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="text-xs transition-all duration-300"
                      >
                        {stage.companies.length}
                      </Badge>
                    </div>
                    <div className="p-2 space-y-2 min-h-[120px]">
                      {stage.companies.map((company) => (
                        <div 
                          key={company.id}
                          className={`p-3 rounded-lg border transition-all duration-500 cursor-grab ${
                            animatingCard === company.id 
                              ? 'scale-105 shadow-lg ring-2 ring-primary opacity-80 translate-x-2' 
                              : 'scale-100 shadow-none'
                          } ${
                            stage.id === 'fechado' 
                              ? 'bg-success/10 border-success/30' 
                              : 'bg-secondary/50 border-border/30 hover:bg-secondary/80'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-colors ${
                              animatingCard === company.id ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{company.name}</p>
                              <p className="text-xs text-muted-foreground">{company.city}</p>
                              {company.value && (
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge 
                                    variant={stage.id === 'fechado' ? 'default' : 'outline'} 
                                    className={`text-xs gap-1 ${
                                      stage.id === 'fechado' ? 'bg-success/20 text-success border-success/30' : ''
                                    }`}
                                  >
                                    <DollarSign className="h-3 w-3" />
                                    R$ {company.value.toLocaleString('pt-BR')}
                                  </Badge>
                                  {company.date && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {company.date}
                                    </Badge>
                                  )}
                                  {stage.id === 'fechado' && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-success" />
                                      Ganho
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {stage.companies.length === 0 && (
                        <div className="flex items-center justify-center h-16 text-xs text-muted-foreground border-2 border-dashed border-border/30 rounded-lg">
                          Arraste empresas aqui
                        </div>
                      )}
                    </div>
                    {stage.id === 'proposta' && getStageTotal(stage.companies) > 0 && (
                      <div className="p-3 border-t border-border/30 text-center">
                        <span className="text-xs text-muted-foreground">Total: </span>
                        <span className="text-xs font-semibold text-primary">
                          R$ {getStageTotal(stage.companies).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {stage.id === 'fechado' && (
                      <div className="p-3 border-t border-border/30 text-center bg-success/5">
                        <span className="text-xs text-muted-foreground">Total ganho: </span>
                        <span className="text-xs font-semibold text-success">
                          R$ {getStageTotal(stage.companies).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRM Features */}
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <div className="glass rounded-xl p-4 text-center hover-glow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm mb-1">Pipeline Personalizável</h4>
              <p className="text-xs text-muted-foreground">Crie estágios que refletem seu processo de vendas</p>
            </div>
            <div className="glass rounded-xl p-4 text-center hover-glow">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <h4 className="font-medium text-sm mb-1">Valores e Previsões</h4>
              <p className="text-xs text-muted-foreground">Acompanhe o valor total de cada estágio</p>
            </div>
            <div className="glass rounded-xl p-4 text-center hover-glow">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <h4 className="font-medium text-sm mb-1">Histórico Completo</h4>
              <p className="text-xs text-muted-foreground">Registre todas as interações com cada lead</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

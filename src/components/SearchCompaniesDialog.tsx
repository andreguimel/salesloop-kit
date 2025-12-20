import { useState } from 'react';
import { Search, Building2, MapPin, Phone as PhoneIcon, Loader2, Plus, Check, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { searchCompaniesAPI, importCompanyFromSearch, SearchCompanyResult } from '@/lib/api';

interface SearchCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompaniesImported: () => void;
}

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Popular CNAEs organized by segment with keywords for intelligent search
const popularCnaes = {
  'Tecnologia': [
    { code: '6201-5/01', description: 'Desenvolvimento de programas de computador sob encomenda', keywords: ['programador', 'desenvolvedor', 'software', 'sistema', 'app', 'aplicativo', 'ti', 'tecnologia', 'dev', 'código', 'programação', 'web', 'site'] },
    { code: '6202-3/00', description: 'Desenvolvimento e licenciamento de software', keywords: ['software', 'saas', 'licença', 'programa', 'sistema', 'startup'] },
    { code: '6203-1/00', description: 'Desenvolvimento e licenciamento de software não-customizável', keywords: ['software', 'produto', 'pacote', 'erp'] },
    { code: '6204-0/00', description: 'Consultoria em tecnologia da informação', keywords: ['consultoria', 'ti', 'consultor', 'tecnologia', 'infraestrutura'] },
    { code: '6209-1/00', description: 'Suporte técnico em tecnologia da informação', keywords: ['suporte', 'ti', 'técnico', 'helpdesk', 'manutenção', 'computador'] },
    { code: '6311-9/00', description: 'Tratamento de dados, provedores de hospedagem', keywords: ['data', 'dados', 'hosting', 'hospedagem', 'servidor', 'cloud', 'nuvem'] },
    { code: '6319-4/00', description: 'Portais, provedores de conteúdo e outros serviços de informação', keywords: ['portal', 'site', 'blog', 'conteúdo', 'digital'] },
    { code: '6399-2/00', description: 'Outras atividades de prestação de serviços de informação', keywords: ['informação', 'dados', 'digital'] },
  ],
  'Comércio': [
    { code: '4711-3/02', description: 'Comércio varejista de mercadorias em geral', keywords: ['loja', 'varejo', 'mercado', 'comerciante', 'vendedor', 'atacado'] },
    { code: '4712-1/00', description: 'Comércio varejista de mercadorias em lojas de departamentos', keywords: ['loja', 'departamento', 'magazine'] },
    { code: '4721-1/02', description: 'Padaria e confeitaria', keywords: ['padaria', 'padeiro', 'pão', 'confeitaria', 'bolo', 'doce'] },
    { code: '4722-9/01', description: 'Comércio varejista de carnes - açougues', keywords: ['açougue', 'açougueiro', 'carne', 'frigorífico'] },
    { code: '4744-0/05', description: 'Comércio varejista de materiais de construção', keywords: ['material', 'construção', 'ferragem', 'depósito'] },
    { code: '4751-2/01', description: 'Comércio varejista de equipamentos de informática', keywords: ['informática', 'computador', 'notebook', 'pc', 'eletrônico'] },
    { code: '4753-9/00', description: 'Comércio varejista de eletrodomésticos', keywords: ['eletrodoméstico', 'geladeira', 'fogão', 'máquina'] },
    { code: '4755-5/02', description: 'Comércio varejista de artigos de armarinho', keywords: ['armarinho', 'linha', 'costura', 'botão'] },
    { code: '4761-0/01', description: 'Comércio varejista de livros', keywords: ['livraria', 'livro', 'literatura'] },
    { code: '4771-7/01', description: 'Comércio varejista de produtos farmacêuticos', keywords: ['farmácia', 'remédio', 'medicamento', 'drogaria'] },
    { code: '4772-5/00', description: 'Comércio varejista de cosméticos', keywords: ['cosméticos', 'perfumaria', 'beleza', 'maquiagem'] },
    { code: '4781-4/00', description: 'Comércio varejista de artigos do vestuário', keywords: ['roupa', 'vestuário', 'moda', 'boutique', 'loja de roupa'] },
    { code: '4782-2/01', description: 'Comércio varejista de calçados', keywords: ['calçado', 'sapato', 'tênis', 'sapataria'] },
    { code: '4789-0/99', description: 'Comércio varejista de outros produtos', keywords: ['varejo', 'loja', 'comércio'] },
  ],
  'Alimentação': [
    { code: '5611-2/01', description: 'Restaurantes e similares', keywords: ['restaurante', 'chef', 'cozinheiro', 'comida', 'gastronomia', 'refeição'] },
    { code: '5611-2/02', description: 'Bares e estabelecimentos especializados em servir bebidas', keywords: ['bar', 'boteco', 'pub', 'bebida', 'cerveja'] },
    { code: '5611-2/03', description: 'Lanchonetes, casas de chá, de sucos', keywords: ['lanchonete', 'lanche', 'suco', 'açaí', 'fast food', 'chá'] },
    { code: '5612-1/00', description: 'Serviços ambulantes de alimentação', keywords: ['food truck', 'ambulante', 'carrinho', 'trailer'] },
    { code: '5620-1/02', description: 'Serviços de alimentação para eventos', keywords: ['buffet', 'evento', 'festa', 'catering'] },
    { code: '5620-1/04', description: 'Fornecimento de alimentos preparados (marmitex)', keywords: ['marmita', 'marmitex', 'quentinha', 'delivery', 'entrega'] },
  ],
  'Saúde': [
    { code: '8630-5/01', description: 'Atividade médica ambulatorial', keywords: ['médico', 'clínica', 'consultório', 'medicina', 'saúde', 'doutor'] },
    { code: '8630-5/02', description: 'Atividade médica ambulatorial especializada', keywords: ['especialista', 'cardiologista', 'dermatologista', 'ortopedista'] },
    { code: '8630-5/03', description: 'Atividade médica ambulatorial (cirurgia)', keywords: ['cirurgião', 'cirurgia', 'operação'] },
    { code: '8630-5/04', description: 'Atividade odontológica', keywords: ['dentista', 'odontologia', 'dente', 'ortodontista', 'odonto'] },
    { code: '8650-0/02', description: 'Atividades de profissionais da área de nutrição', keywords: ['nutricionista', 'nutrição', 'dieta', 'alimentação'] },
    { code: '8650-0/03', description: 'Atividades de psicologia e psicanálise', keywords: ['psicólogo', 'psicologia', 'terapeuta', 'terapia', 'psicanalista'] },
    { code: '8650-0/04', description: 'Atividades de fisioterapia', keywords: ['fisioterapeuta', 'fisioterapia', 'reabilitação', 'fisio'] },
    { code: '8650-0/05', description: 'Atividades de fonoaudiologia', keywords: ['fonoaudiólogo', 'fonoaudiologia', 'fono', 'fala'] },
    { code: '8650-0/06', description: 'Atividades de terapia ocupacional', keywords: ['terapeuta ocupacional', 'terapia ocupacional'] },
    { code: '8650-0/07', description: 'Atividades de acupuntura', keywords: ['acupuntura', 'acupunturista', 'medicina chinesa'] },
    { code: '8650-0/99', description: 'Atividades de profissionais da saúde', keywords: ['saúde', 'profissional', 'biomédico'] },
    { code: '8690-9/01', description: 'Atividades de enfermagem', keywords: ['enfermeiro', 'enfermagem', 'técnico enfermagem'] },
  ],
  'Beleza e Estética': [
    { code: '9602-5/01', description: 'Cabeleireiros, manicure e pedicure', keywords: ['cabeleireiro', 'salão', 'cabelo', 'manicure', 'pedicure', 'unha', 'barbeiro', 'barbearia'] },
    { code: '9602-5/02', description: 'Atividades de estética e outros serviços de beleza', keywords: ['estética', 'esteticista', 'beleza', 'depilação', 'limpeza de pele', 'facial', 'massagem'] },
    { code: '9609-2/04', description: 'Saunas e banhos', keywords: ['sauna', 'spa', 'banho', 'relaxamento'] },
  ],
  'Educação': [
    { code: '8511-2/00', description: 'Educação infantil - creche', keywords: ['creche', 'berçário', 'infantil', 'bebê'] },
    { code: '8512-1/00', description: 'Educação infantil - pré-escola', keywords: ['pré-escola', 'jardim', 'infantil'] },
    { code: '8513-9/00', description: 'Ensino fundamental', keywords: ['escola', 'professor', 'ensino fundamental', 'primário'] },
    { code: '8520-1/00', description: 'Ensino médio', keywords: ['colégio', 'ensino médio', 'professor'] },
    { code: '8531-7/00', description: 'Educação superior - graduação', keywords: ['faculdade', 'universidade', 'graduação', 'professor'] },
    { code: '8591-1/00', description: 'Ensino de esportes', keywords: ['professor esporte', 'academia esporte', 'personal trainer', 'personal', 'treinador'] },
    { code: '8592-9/01', description: 'Ensino de dança', keywords: ['dança', 'ballet', 'professor dança', 'escola dança'] },
    { code: '8592-9/02', description: 'Ensino de artes cênicas', keywords: ['teatro', 'ator', 'atriz', 'artes cênicas'] },
    { code: '8592-9/03', description: 'Ensino de música', keywords: ['música', 'professor música', 'instrumento', 'violão', 'piano'] },
    { code: '8593-7/00', description: 'Ensino de idiomas', keywords: ['inglês', 'idioma', 'língua', 'professor idiomas', 'espanhol', 'francês'] },
    { code: '8599-6/01', description: 'Formação de condutores', keywords: ['auto escola', 'autoescola', 'instrutor', 'habilitação', 'cnh'] },
    { code: '8599-6/03', description: 'Treinamento em informática', keywords: ['curso informática', 'treinamento', 'computação'] },
    { code: '8599-6/04', description: 'Treinamento em desenvolvimento profissional', keywords: ['treinamento', 'capacitação', 'curso', 'coaching', 'coach'] },
  ],
  'Construção': [
    { code: '4120-4/00', description: 'Construção de edifícios', keywords: ['construtora', 'construção', 'prédio', 'edifício', 'obra'] },
    { code: '4211-1/01', description: 'Construção de rodovias e ferrovias', keywords: ['estrada', 'rodovia', 'ferrovia', 'pavimentação'] },
    { code: '4321-5/00', description: 'Instalação e manutenção elétrica', keywords: ['eletricista', 'elétrica', 'instalação elétrica'] },
    { code: '4322-3/01', description: 'Instalações hidráulicas, sanitárias e de gás', keywords: ['encanador', 'hidráulica', 'encanamento', 'gás'] },
    { code: '4329-1/01', description: 'Instalação de painéis publicitários', keywords: ['outdoor', 'painel', 'letreiro'] },
    { code: '4330-4/01', description: 'Impermeabilização', keywords: ['impermeabilização', 'vedação'] },
    { code: '4330-4/02', description: 'Instalação de portas, janelas e similares', keywords: ['portas', 'janelas', 'vidraceiro', 'serralheiro'] },
    { code: '4330-4/03', description: 'Obras de acabamento em gesso', keywords: ['gesseiro', 'gesso', 'forro', 'drywall'] },
    { code: '4330-4/04', description: 'Serviços de pintura de edifícios', keywords: ['pintor', 'pintura', 'tinta'] },
    { code: '4330-4/05', description: 'Aplicação de revestimentos', keywords: ['revestimento', 'azulejo', 'piso', 'ladrilheiro'] },
    { code: '4330-4/99', description: 'Outras obras de acabamento da construção', keywords: ['acabamento', 'reforma', 'pedreiro', 'mestre de obras'] },
  ],
  'Consultoria e Serviços Empresariais': [
    { code: '6911-7/01', description: 'Serviços advocatícios', keywords: ['advogado', 'advocacia', 'escritório', 'jurídico', 'direito', 'lawyer'] },
    { code: '6920-6/01', description: 'Atividades de contabilidade', keywords: ['contador', 'contabilidade', 'escritório contábil', 'contábil'] },
    { code: '6920-6/02', description: 'Atividades de consultoria e auditoria contábil', keywords: ['auditoria', 'auditor', 'consultoria contábil'] },
    { code: '7020-4/00', description: 'Atividades de consultoria em gestão empresarial', keywords: ['consultoria', 'consultor', 'gestão', 'empresarial', 'administração'] },
    { code: '7111-1/00', description: 'Serviços de arquitetura', keywords: ['arquiteto', 'arquitetura', 'projeto arquitetônico'] },
    { code: '7112-0/00', description: 'Serviços de engenharia', keywords: ['engenheiro', 'engenharia', 'projeto'] },
    { code: '7119-7/01', description: 'Serviços de cartografia', keywords: ['cartografia', 'topografia', 'topógrafo', 'agrimensor'] },
    { code: '7119-7/02', description: 'Atividades de estudos geológicos', keywords: ['geólogo', 'geologia', 'geotecnia'] },
    { code: '7119-7/03', description: 'Serviços de desenho técnico', keywords: ['desenhista', 'desenho técnico', 'cadista', 'cad'] },
    { code: '7311-4/00', description: 'Agências de publicidade', keywords: ['publicidade', 'propaganda', 'agência', 'marketing'] },
    { code: '7312-2/00', description: 'Agenciamento de espaços para publicidade', keywords: ['mídia', 'veiculação', 'anúncio'] },
    { code: '7319-0/02', description: 'Promoção de vendas', keywords: ['promotor', 'promoção', 'merchandising'] },
    { code: '7319-0/99', description: 'Outras atividades de publicidade', keywords: ['publicidade', 'marketing', 'comunicação'] },
    { code: '7320-3/00', description: 'Pesquisas de mercado e opinião pública', keywords: ['pesquisa', 'mercado', 'opinião', 'estatística'] },
    { code: '7410-2/01', description: 'Design de interiores', keywords: ['designer', 'decorador', 'interiores', 'decoração'] },
    { code: '7410-2/02', description: 'Design de moda', keywords: ['designer moda', 'estilista', 'moda', 'fashion'] },
    { code: '7410-2/99', description: 'Atividades de design não especificadas', keywords: ['designer', 'design gráfico', 'gráfico', 'visual'] },
    { code: '7420-0/01', description: 'Atividades de produção de fotografias', keywords: ['fotógrafo', 'fotografia', 'ensaio', 'foto'] },
    { code: '7420-0/02', description: 'Atividades de produção de fotografias aéreas', keywords: ['drone', 'aérea', 'fotografia aérea'] },
    { code: '7420-0/04', description: 'Filmagem de festas e eventos', keywords: ['videomaker', 'filmagem', 'vídeo', 'cinegrafista'] },
    { code: '7490-1/04', description: 'Atividades de intermediação de negócios', keywords: ['corretor', 'intermediação', 'representante comercial'] },
  ],
  'Imobiliário': [
    { code: '6810-2/01', description: 'Compra e venda de imóveis próprios', keywords: ['imobiliária', 'imóvel', 'venda imóvel'] },
    { code: '6810-2/02', description: 'Aluguel de imóveis próprios', keywords: ['aluguel', 'locação', 'imóvel'] },
    { code: '6821-8/01', description: 'Corretagem na compra e venda de imóveis', keywords: ['corretor imóveis', 'imobiliária', 'corretor'] },
    { code: '6821-8/02', description: 'Corretagem no aluguel de imóveis', keywords: ['corretor', 'locação', 'aluguel'] },
    { code: '6822-6/00', description: 'Gestão e administração da propriedade imobiliária', keywords: ['administradora', 'condomínio', 'síndico'] },
  ],
  'Transporte e Logística': [
    { code: '4921-3/01', description: 'Transporte rodoviário coletivo de passageiros', keywords: ['ônibus', 'transporte', 'passageiro'] },
    { code: '4921-3/02', description: 'Transporte rodoviário coletivo (fretamento)', keywords: ['fretamento', 'ônibus', 'excursão'] },
    { code: '4923-0/01', description: 'Serviço de táxi', keywords: ['táxi', 'taxista'] },
    { code: '4923-0/02', description: 'Transporte por aplicativos', keywords: ['uber', 'motorista', 'app', '99', 'aplicativo'] },
    { code: '4929-9/01', description: 'Transporte escolar', keywords: ['transporte escolar', 'van escolar', 'perua'] },
    { code: '4929-9/02', description: 'Transporte de turismo', keywords: ['turismo', 'excursão', 'viagem'] },
    { code: '4930-2/01', description: 'Transporte rodoviário de carga municipal', keywords: ['frete', 'carga', 'caminhão', 'mudança'] },
    { code: '4930-2/02', description: 'Transporte rodoviário de carga intermunicipal', keywords: ['transporte', 'carga', 'frete', 'logística'] },
    { code: '5211-7/99', description: 'Depósitos de mercadorias para terceiros', keywords: ['depósito', 'armazém', 'estoque', 'logística'] },
    { code: '5212-5/00', description: 'Carga e descarga', keywords: ['carga', 'descarga', 'movimentação'] },
    { code: '5250-8/01', description: 'Comissária de despachos', keywords: ['despachante', 'comissária', 'despacho'] },
    { code: '5250-8/02', description: 'Atividades de agenciamento de cargas', keywords: ['agenciamento', 'carga', 'frete'] },
    { code: '5250-8/03', description: 'Agenciamento de transporte de passageiros', keywords: ['agência viagem', 'passagem', 'viagem'] },
    { code: '5310-5/01', description: 'Atividades do Correio Nacional', keywords: ['correio', 'entrega', 'postal'] },
    { code: '5320-2/02', description: 'Serviços de entrega rápida', keywords: ['motoboy', 'entrega', 'delivery', 'courier'] },
  ],
  'Fitness e Esportes': [
    { code: '9311-5/00', description: 'Gestão de instalações de esportes', keywords: ['academia', 'clube', 'quadra', 'esporte'] },
    { code: '9312-3/00', description: 'Clubes sociais, esportivos e similares', keywords: ['clube', 'associação', 'esportivo'] },
    { code: '9313-1/00', description: 'Atividades de condicionamento físico', keywords: ['academia', 'fitness', 'musculação', 'personal', 'crossfit', 'pilates', 'funcional'] },
    { code: '9319-1/01', description: 'Produção e promoção de eventos esportivos', keywords: ['evento esportivo', 'competição', 'campeonato'] },
    { code: '9319-1/99', description: 'Outras atividades esportivas', keywords: ['esporte', 'atleta', 'treinador'] },
  ],
  'Entretenimento e Eventos': [
    { code: '9001-9/01', description: 'Produção teatral', keywords: ['teatro', 'produção', 'espetáculo'] },
    { code: '9001-9/02', description: 'Produção musical', keywords: ['música', 'banda', 'show', 'produtor musical'] },
    { code: '9001-9/05', description: 'Produção de eventos artísticos', keywords: ['evento', 'show', 'espetáculo', 'produtor'] },
    { code: '9001-9/06', description: 'Atividades de sonorização e iluminação', keywords: ['som', 'luz', 'iluminação', 'sonorização', 'dj'] },
    { code: '9002-7/01', description: 'Atividades de artistas plásticos', keywords: ['artista', 'pintor', 'escultor', 'arte'] },
    { code: '9002-7/02', description: 'Restauração de obras de arte', keywords: ['restauração', 'arte', 'restaurador'] },
    { code: '9003-5/00', description: 'Gestão de espaços para artes cênicas', keywords: ['teatro', 'auditório', 'espaço cultural'] },
    { code: '9329-8/01', description: 'Discotecas, danceterias e salões de dança', keywords: ['balada', 'danceteria', 'boate', 'casa noturna'] },
    { code: '9329-8/04', description: 'Exploração de jogos eletrônicos recreativos', keywords: ['fliperama', 'arcade', 'jogos'] },
    { code: '9329-8/99', description: 'Outras atividades de recreação e lazer', keywords: ['lazer', 'recreação', 'entretenimento', 'diversão'] },
  ],
  'Serviços Domésticos e Pessoais': [
    { code: '9601-7/01', description: 'Lavanderias', keywords: ['lavanderia', 'lavagem', 'roupa', 'tinturia'] },
    { code: '9601-7/02', description: 'Tinturarias', keywords: ['tinturaria', 'tingimento'] },
    { code: '9601-7/03', description: 'Toalheiros', keywords: ['toalha', 'aluguel toalha'] },
    { code: '9603-3/01', description: 'Gestão e manutenção de cemitérios', keywords: ['cemitério', 'funerária'] },
    { code: '9603-3/02', description: 'Serviços de cremação', keywords: ['cremação', 'crematório'] },
    { code: '9603-3/03', description: 'Serviços de sepultamento', keywords: ['sepultamento', 'funeral', 'velório'] },
    { code: '9603-3/04', description: 'Serviços de funerárias', keywords: ['funerária', 'funeral', 'velório', 'óbito'] },
    { code: '9609-2/02', description: 'Agências matrimoniais', keywords: ['casamento', 'matrimonial', 'encontro'] },
    { code: '9609-2/05', description: 'Atividades de cuidados pessoais', keywords: ['cuidador', 'acompanhante', 'idoso'] },
    { code: '9609-2/07', description: 'Alojamento de animais domésticos', keywords: ['hotel pet', 'hospedagem', 'cachorro', 'gato', 'pet'] },
    { code: '9609-2/08', description: 'Higiene e embelezamento de animais', keywords: ['pet shop', 'banho tosa', 'tosador', 'pet', 'cachorro'] },
    { code: '9609-2/99', description: 'Outras atividades de serviços pessoais', keywords: ['serviços', 'pessoais'] },
  ],
  'Agropecuária': [
    { code: '0111-3/01', description: 'Cultivo de arroz', keywords: ['arroz', 'arrozeiro', 'rizicultura'] },
    { code: '0115-6/00', description: 'Cultivo de soja', keywords: ['soja', 'sojicultor', 'grãos'] },
    { code: '0119-9/99', description: 'Cultivo de outras oleaginosas', keywords: ['oleaginosa', 'grãos', 'agricultura'] },
    { code: '0141-5/01', description: 'Produção de sementes certificadas', keywords: ['sementes', 'viveiro', 'mudas'] },
    { code: '0151-2/01', description: 'Criação de bovinos para corte', keywords: ['gado', 'boi', 'pecuária', 'fazenda'] },
    { code: '0151-2/02', description: 'Criação de bovinos para leite', keywords: ['leite', 'vaca', 'laticínio', 'pecuária leiteira'] },
    { code: '0155-5/01', description: 'Criação de frangos para corte', keywords: ['frango', 'avicultura', 'galinha', 'granja'] },
    { code: '0155-5/02', description: 'Produção de ovos', keywords: ['ovo', 'galinha', 'granja'] },
    { code: '0159-8/01', description: 'Apicultura', keywords: ['abelha', 'mel', 'apicultor'] },
    { code: '0161-0/01', description: 'Serviço de pulverização', keywords: ['pulverização', 'agrícola', 'drone'] },
    { code: '0161-0/03', description: 'Serviço de preparação de terreno', keywords: ['terraplanagem', 'preparo solo'] },
    { code: '0162-8/01', description: 'Serviço de inseminação artificial', keywords: ['inseminação', 'veterinário', 'reprodução'] },
    { code: '7500-1/00', description: 'Atividades veterinárias', keywords: ['veterinário', 'veterinária', 'pet', 'animal', 'clínica veterinária'] },
  ],
  'Segurança': [
    { code: '8011-1/01', description: 'Atividades de vigilância e segurança privada', keywords: ['vigilante', 'segurança', 'vigilância'] },
    { code: '8012-9/00', description: 'Atividades de transporte de valores', keywords: ['transporte valores', 'carro forte'] },
    { code: '8020-0/01', description: 'Atividades de monitoramento de sistemas eletrônicos', keywords: ['monitoramento', 'alarme', 'cftv', 'câmera'] },
    { code: '8020-0/02', description: 'Outras atividades de serviços de segurança', keywords: ['segurança', 'portaria', 'controle acesso'] },
    { code: '8030-7/00', description: 'Atividades de investigação particular', keywords: ['detetive', 'investigador', 'investigação'] },
  ],
  'Financeiro e Seguros': [
    { code: '6422-1/00', description: 'Bancos múltiplos com carteira comercial', keywords: ['banco', 'financeiro'] },
    { code: '6424-8/01', description: 'Bancos cooperativos', keywords: ['cooperativa crédito', 'sicredi', 'sicoob'] },
    { code: '6431-0/00', description: 'Bancos de investimento', keywords: ['investimento', 'banco investimento'] },
    { code: '6463-8/00', description: 'Outras sociedades de crédito', keywords: ['crédito', 'financeira', 'empréstimo'] },
    { code: '6619-3/02', description: 'Correspondentes de instituições financeiras', keywords: ['correspondente bancário', 'banco', 'serviços financeiros'] },
    { code: '6622-3/00', description: 'Corretores e agentes de seguros', keywords: ['corretor seguros', 'seguro', 'corretora'] },
    { code: '6629-1/00', description: 'Atividades auxiliares de seguros', keywords: ['seguro', 'previdência', 'planos'] },
  ],
};

export function SearchCompaniesDialog({ open, onOpenChange, onCompaniesImported }: SearchCompaniesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    cnae: '',
    cidade: '',
    uf: '',
  });
  const [results, setResults] = useState<SearchCompanyResult[]>([]);
  const [importing, setImporting] = useState<Record<string, boolean>>({});
  const [imported, setImported] = useState<Record<string, boolean>>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [showCnaeHelper, setShowCnaeHelper] = useState(false);
  const [cnaeSearch, setCnaeSearch] = useState('');
  
  const { toast } = useToast();

  const selectCnae = (code: string) => {
    setSearchParams({ ...searchParams, cnae: code });
    setShowCnaeHelper(false);
  };

  // Intelligent search - searches in code, description AND keywords
  const normalizeText = (text: string) => {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, ''); // Remove special chars
  };

  const filteredCnaes = cnaeSearch
    ? Object.entries(popularCnaes).reduce((acc, [segment, cnaes]) => {
        const searchTerms = normalizeText(cnaeSearch).split(' ').filter(t => t.length > 0);
        
        const filtered = cnaes.filter(cnae => {
          const codeMatch = cnae.code.includes(cnaeSearch);
          const descNormalized = normalizeText(cnae.description);
          const keywordsNormalized = cnae.keywords.map(k => normalizeText(k));
          
          // Check if ALL search terms match somewhere (code, description, or keywords)
          const allTermsMatch = searchTerms.every(term => 
            codeMatch ||
            descNormalized.includes(term) ||
            keywordsNormalized.some(kw => kw.includes(term) || term.includes(kw))
          );
          
          return allTermsMatch;
        });
        
        // Sort by relevance - exact keyword matches first
        const sortedFiltered = filtered.sort((a, b) => {
          const searchNorm = normalizeText(cnaeSearch);
          const aExactKeyword = a.keywords.some(k => normalizeText(k) === searchNorm);
          const bExactKeyword = b.keywords.some(k => normalizeText(k) === searchNorm);
          if (aExactKeyword && !bExactKeyword) return -1;
          if (bExactKeyword && !aExactKeyword) return 1;
          return 0;
        });
        
        if (sortedFiltered.length > 0) acc[segment] = sortedFiltered;
        return acc;
      }, {} as Record<string, typeof popularCnaes['Tecnologia']>)
    : popularCnaes;

  const handleSearch = async () => {
    if (!searchParams.cnae && !searchParams.cidade && !searchParams.uf) {
      toast({
        title: 'Preencha pelo menos um filtro',
        description: 'Informe CNAE, cidade ou estado para buscar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await searchCompaniesAPI(searchParams);
      setResults(response.companies);
      
      if (response.companies.length === 0) {
        toast({
          title: 'Nenhuma empresa encontrada',
          description: 'Tente ajustar os filtros de busca.',
        });
      } else {
        toast({
          title: `${response.companies.length} empresas encontradas`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Erro na busca',
        description: error instanceof Error ? error.message : 'Não foi possível buscar empresas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (company: SearchCompanyResult) => {
    setImporting(prev => ({ ...prev, [company.cnpj]: true }));

    try {
      await importCompanyFromSearch(company);
      setImported(prev => ({ ...prev, [company.cnpj]: true }));
      toast({
        title: 'Empresa importada!',
        description: `${company.fantasyName || company.name} foi adicionada.`,
      });
      onCompaniesImported();
    } catch (error) {
      toast({
        title: 'Erro ao importar',
        description: error instanceof Error ? error.message : 'Não foi possível importar a empresa.',
        variant: 'destructive',
      });
    } finally {
      setImporting(prev => ({ ...prev, [company.cnpj]: false }));
    }
  };

  const handleClose = () => {
    setResults([]);
    setHasSearched(false);
    setImported({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-strong border-border/50 max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-primary">
              <Search className="h-4 w-4 text-primary-foreground" />
            </div>
            Buscar Empresas por CNAE
          </DialogTitle>
          <DialogDescription className="sr-only">
            Busque empresas por CNAE, cidade ou estado para importar para sua lista
          </DialogDescription>
        </DialogHeader>

        {/* Search Form */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                CNAE
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCnaeHelper(!showCnaeHelper)}
                className="h-6 px-2 text-xs text-primary hover:text-primary gap-1"
              >
                <HelpCircle className="h-3 w-3" />
                {showCnaeHelper ? 'Ocultar' : 'Não sei o CNAE'}
              </Button>
            </div>
            <Input
              placeholder="Ex: 6201-5/01"
              value={searchParams.cnae}
              onChange={(e) => setSearchParams({ ...searchParams, cnae: e.target.value })}
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cidade
            </Label>
            <Input
              placeholder="Ex: São Paulo"
              value={searchParams.cidade}
              onChange={(e) => setSearchParams({ ...searchParams, cidade: e.target.value })}
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estado
            </Label>
            <Select
              value={searchParams.uf}
              onValueChange={(value) => setSearchParams({ ...searchParams, uf: value })}
            >
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CNAE Helper */}
        <Collapsible open={showCnaeHelper} onOpenChange={setShowCnaeHelper}>
          <CollapsibleContent className="space-y-3 pb-4">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Encontre o CNAE da atividade</span>
              </div>
              
              <Input
                placeholder="Digite a profissão ou atividade (ex: dentista, advogado, restaurante...)"
                value={cnaeSearch}
                onChange={(e) => setCnaeSearch(e.target.value)}
                className="bg-background/50 border-border/50 mb-3"
              />

              <div className="max-h-[250px] overflow-y-auto space-y-3">
                {Object.entries(filteredCnaes).map(([segment, cnaes]) => (
                  <div key={segment}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {segment}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {cnaes.map((cnae) => (
                        <Badge
                          key={cnae.code}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors text-xs py-1"
                          onClick={() => selectCnae(cnae.code)}
                        >
                          <span className="font-mono mr-1">{cnae.code}</span>
                          <span className="text-muted-foreground hidden sm:inline">
                            - {cnae.description.length > 30 ? cnae.description.slice(0, 30) + '...' : cnae.description}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(filteredCnaes).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum CNAE encontrado para "{cnaeSearch}"
                  </p>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                Clique em um CNAE para selecioná-lo. Esta é uma lista dos mais comuns.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button 
          onClick={handleSearch} 
          disabled={isLoading}
          className="w-full gap-2 gradient-primary hover:opacity-90"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {isLoading ? 'Buscando...' : 'Buscar Empresas'}
        </Button>

        {/* Results */}
        {hasSearched && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 max-h-[400px]">
            {results.length === 0 && !isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma empresa encontrada</p>
              </div>
            ) : (
              results.map((company) => (
                <div
                  key={company.cnpj}
                  className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-border/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">
                        {company.fantasyName || company.name}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {company.name}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {company.city}, {company.state}
                        </span>
                        {company.phone1 && (
                          <span className="flex items-center gap-1">
                            <PhoneIcon className="h-3 w-3" />
                            {company.phone1}
                          </span>
                        )}
                        <code className="px-1.5 py-0.5 rounded bg-secondary">
                          CNAE: {company.cnae}
                        </code>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleImport(company)}
                      disabled={importing[company.cnpj] || imported[company.cnpj]}
                      className={imported[company.cnpj] 
                        ? 'bg-success hover:bg-success' 
                        : 'gradient-primary hover:opacity-90'
                      }
                    >
                      {importing[company.cnpj] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : imported[company.cnpj] ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Importado
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Importar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

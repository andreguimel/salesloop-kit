import { Company, MessageTemplate } from '@/types';

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Tech Solutions LTDA',
    cnae: '6201-5/01',
    cnaeDescription: 'Desenvolvimento de programas de computador sob encomenda',
    city: 'São Paulo',
    state: 'SP',
    segment: 'Tecnologia',
    phones: [
      { number: '(11) 99999-1234', status: 'valid', type: 'mobile' },
      { number: '(11) 3333-4567', status: 'valid', type: 'landline' },
    ],
    messageStatus: 'none',
  },
  {
    id: '2',
    name: 'Comércio Digital S.A.',
    cnae: '4751-2/01',
    cnaeDescription: 'Comércio varejista especializado de equipamentos',
    city: 'Rio de Janeiro',
    state: 'RJ',
    segment: 'E-commerce',
    phones: [
      { number: '(21) 98888-5678', status: 'valid', type: 'mobile' },
      { number: '(21) 2222-8901', status: 'uncertain', type: 'landline' },
    ],
    messageStatus: 'sent',
  },
  {
    id: '3',
    name: 'Construções Modernas EIRELI',
    cnae: '4120-4/00',
    cnaeDescription: 'Construção de edifícios',
    city: 'Belo Horizonte',
    state: 'MG',
    segment: 'Construção',
    phones: [
      { number: '(31) 97777-9012', status: 'valid', type: 'mobile' },
      { number: '(31) 1111-2345', status: 'invalid', type: 'landline' },
    ],
    messageStatus: 'pending',
  },
  {
    id: '4',
    name: 'Indústria Alimentícia Brasil',
    cnae: '1091-1/02',
    cnaeDescription: 'Fabricação de produtos de panificação industrial',
    city: 'Curitiba',
    state: 'PR',
    segment: 'Alimentos',
    phones: [
      { number: '(41) 96666-3456', status: 'uncertain', type: 'mobile' },
      { number: '(41) 4444-6789', status: 'valid', type: 'landline' },
    ],
    messageStatus: 'not_delivered',
  },
  {
    id: '5',
    name: 'Serviços Financeiros Premium',
    cnae: '6499-9/99',
    cnaeDescription: 'Outras atividades de serviços financeiros',
    city: 'Porto Alegre',
    state: 'RS',
    segment: 'Finanças',
    phones: [
      { number: '(51) 95555-7890', status: 'valid', type: 'mobile' },
    ],
    messageStatus: 'none',
  },
  {
    id: '6',
    name: 'Logística Express LTDA',
    cnae: '5211-7/99',
    cnaeDescription: 'Depósitos de mercadorias para terceiros',
    city: 'Campinas',
    state: 'SP',
    segment: 'Logística',
    phones: [
      { number: '(19) 94444-1234', status: 'valid', type: 'mobile' },
      { number: '(19) 5555-5678', status: 'valid', type: 'landline' },
    ],
    messageStatus: 'sent',
  },
];

export const mockTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Apresentação Comercial',
    content: 'Olá! Somos a [Empresa] e gostaríamos de apresentar nossas soluções para o seu negócio. Podemos agendar uma conversa?',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Follow-up',
    content: 'Olá! Entramos em contato anteriormente sobre nossas soluções. Gostaria de saber se tem interesse em conhecer mais?',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Promoção Especial',
    content: 'Olá! Temos uma oferta exclusiva para sua empresa. Entre em contato para saber mais!',
    createdAt: new Date('2024-02-01'),
  },
];

export const segments = [
  'Tecnologia',
  'E-commerce',
  'Construção',
  'Alimentos',
  'Finanças',
  'Logística',
  'Saúde',
  'Educação',
  'Varejo',
];

export const cities = [
  'São Paulo',
  'Rio de Janeiro',
  'Belo Horizonte',
  'Curitiba',
  'Porto Alegre',
  'Campinas',
  'Salvador',
  'Brasília',
  'Fortaleza',
];

/**
 * UI strings, per locale.
 *
 * Keys are grouped by area. To add a string: add it to ALL three locales
 * (English variants may be identical). `t()` falls back along the chain in
 * site.ts FALLBACKS if a key is missing, so a missing en-gb key shows en-us.
 *
 * Content text NEVER lives here — this file is only for interface labels.
 */
import { DEFAULT_LOCALE, FALLBACKS, type Locale, type Localized } from '../config/site';

const ui = {
  'a11y.skip': {
    pt: 'Saltar para o conteúdo',
    'en-gb': 'Skip to content',
  },
  'a11y.mainNav': {
    pt: 'Navegação principal',
    'en-gb': 'Main navigation',
  },
  'a11y.mobileNav': {
    pt: 'Navegação',
    'en-gb': 'Navigation',
  },
  'a11y.footerNav': {
    pt: 'Navegação de rodapé',
    'en-gb': 'Footer navigation',
  },
  'a11y.language': {
    pt: 'Idioma',
    'en-gb': 'Language',
  },
  'a11y.menu': {
    pt: 'Menu',
    'en-gb': 'Menu',
  },

  'theme.toggle': {
    pt: 'Alternar tema claro/escuro',
    'en-gb': 'Toggle light/dark theme',
  },
  'theme.toLight': {
    pt: 'Mudar para tema claro',
    'en-gb': 'Switch to light theme',
  },
  'theme.toDark': {
    pt: 'Mudar para tema escuro',
    'en-gb': 'Switch to dark theme',
  },

  'nav.about': { pt: 'Sobre', 'en-gb': 'About' },
  'nav.team': { pt: 'Equipa', 'en-gb': 'Team' },
  'nav.events': { pt: 'Eventos', 'en-gb': 'Events' },
  'nav.news': { pt: 'Notícias', 'en-gb': 'News' },
  'nav.projects': { pt: 'Projetos', 'en-gb': 'Projects' },
  'nav.join': { pt: 'Sócios', 'en-gb': 'Members' },
  'nav.members': {
    pt: 'Área de Sócio',
    'en-gb': "Members' area",
  },
  'nav.donations': { pt: 'Doações', 'en-gb': 'Donations' },
  'nav.sponsors': { pt: 'Apoios', 'en-gb': 'Sponsors' },
  'nav.privacy': { pt: 'Privacidade', 'en-gb': 'Privacy' },

  'home.cta': {
    pt: 'Explorar projetos',
    'en-gb': 'Explore projects',
  },
  'home.ctaSecondary': {
    pt: 'Conhecer a Plink',
    'en-gb': 'Meet Plink',
  },
  'home.joinQuiet': {
    pt: 'Se isto te soa bem, os sócios são gente como tu.',
    'en-gb': 'If this sounds like you, our members are people like you.',
  },
  'home.upcomingEvents': {
    pt: 'Próximos eventos',
    'en-gb': 'Upcoming events',
  },
  'home.latestNews': {
    pt: 'Últimas notícias',
    'en-gb': 'Latest news',
  },
  'home.featuredProjects': {
    pt: 'Projetos em destaque',
    'en-gb': 'Featured projects',
  },
  'home.viewAll': { pt: 'Ver todos', 'en-gb': 'View all' },
  'home.empty': {
    pt: 'Em breve — voltem para ver novidades.',
    'en-gb': 'Coming soon — check back for updates.',
  },

  'common.readMore': { pt: 'Ler mais', 'en-gb': 'Read more' },
  'common.backTo': { pt: 'Voltar a', 'en-gb': 'Back to' },
  'common.details': { pt: 'Detalhes', 'en-gb': 'Details' },
  'common.fallbackNote': {
    pt: 'Esta página está disponível em português.',
    'en-gb': 'This page is currently only available in Portuguese.',
  },

  'events.upcoming': { pt: 'Próximos', 'en-gb': 'Upcoming' },
  'events.past': { pt: 'Anteriores', 'en-gb': 'Past' },
  'events.cancelled': { pt: 'Cancelado', 'en-gb': 'Cancelled' },
  'events.register': {
    pt: 'Inscrever-me',
    'en-gb': 'Register',
  },
  'events.location': { pt: 'Local', 'en-gb': 'Location' },
  'events.date': { pt: 'Data', 'en-gb': 'Date' },
  'events.noUpcoming': {
    pt: 'Sem eventos marcados de momento.',
    'en-gb': 'No events scheduled right now.',
  },
  'events.noPast': {
    pt: 'Ainda não há eventos anteriores.',
    'en-gb': 'No past events yet.',
  },

  'projects.status.idea': { pt: 'Ideia', 'en-gb': 'Idea' },
  'projects.status.active': { pt: 'Ativo', 'en-gb': 'Active' },
  'projects.status.completed': {
    pt: 'Concluído',
    'en-gb': 'Completed',
  },
  'projects.leads': {
    pt: 'Responsáveis',
    'en-gb': 'Project leads',
  },
  'projects.links': { pt: 'Ligações', 'en-gb': 'Links' },
  'projects.filters': { pt: 'Filtrar', 'en-gb': 'Filter' },
  'projects.allProjects': {
    pt: 'Todos os projetos',
    'en-gb': 'All projects',
  },
  'projects.filtersAll': { pt: 'Todos', 'en-gb': 'All' },
  'projects.filtersStatus': { pt: 'Estado', 'en-gb': 'Status' },
  'projects.filtersTags': { pt: 'Tema', 'en-gb': 'Topic' },
  'projects.simulationPending': {
    pt: 'Simulação interativa — em breve.',
    'en-gb': 'Interactive simulation — coming soon.',
  },

  'news.tags': { pt: 'Temas', 'en-gb': 'Topics' },
  'news.allPosts': {
    pt: 'Todas as notícias',
    'en-gb': 'All posts',
  },
  'news.rss': {
    pt: 'Subscrever via RSS',
    'en-gb': 'Subscribe via RSS',
  },

  'team.department': { pt: 'Departamento', 'en-gb': 'Department' },
  'team.departments': {
    pt: 'Departamentos',
    'en-gb': 'Departments',
  },
  'team.count': { pt: '{n} pessoas', 'en-gb': '{n} people' },
  'team.scroll': {
    pt: 'Desliza para veres toda a gente',
    'en-gb': 'Swipe to see everyone',
  },
  'team.lead': {
    pt: 'Quem faz a Plink acontecer — cinco departamentos, muitas mãos e uma quantidade suspeita de boa vontade.',
    'en-gb': 'The people who make Plink happen — five departments, many hands and a suspicious amount of goodwill.',
  },

  /* Full department names (PLACEHOLDER expansions until Ricardo confirms). */
  'team.organs': { pt: 'Órgãos Sociais', 'en-gb': 'Governing bodies' },
  'team.depts': { pt: 'Departamentos', 'en-gb': 'Departments' },
  'dept.Direção': { pt: 'Direção', 'en-gb': 'Board' },
  'dept.Conselho Fiscal': {
    pt: 'Conselho Fiscal',
    'en-gb': 'Fiscal Council',
  },
  'dept.Mesa da Assembleia': {
    pt: 'Mesa da Assembleia Geral',
    'en-gb': 'General Assembly Board',
  },
  'dept.DREE': {
    pt: 'Departamento de Relações Educativas e Empresariais',
    'en-gb': 'Department of Educational and Business Relations',
  },
  'dept.DP': {
    pt: 'Departamento de Projetos',
    'en-gb': 'Projects Department',
  },
  'dept.DL': {
    pt: 'Departamento de Logística',
    'en-gb': 'Logistics Department',
  },
  'dept.DCI': {
    pt: 'Departamento de Comunicação e Imagem',
    'en-gb': 'Communication and Image Department',
  },
  'desc.Direção': {
    pt: 'Decide o rumo, aprova os projetos e garante que as coisas avançam.',
    'en-gb': 'Sets the direction, approves projects and keeps things moving.',
  },
  'desc.DREE': {
    pt: 'Liga a associação às escolas e ao mundo empresarial.',
    'en-gb': 'Connects the association with schools and the business world.',
  },
  'desc.DP': {
    pt: 'Acompanha os projetos dos membros, da ideia à demonstração final.',
    'en-gb': 'Supports member projects from first idea to final demo.',
  },
  'desc.DL': {
    pt: 'Faz os eventos acontecerem: espaços, material, inscrições e logística.',
    'en-gb': 'Makes events happen: venues, materials, sign-ups and logistics.',
  },
  'desc.DCI': {
    pt: 'Comunicação e imagem: o que se vê, o que se diz e como se diz.',
    'en-gb': 'Communication and image: what is seen, what is said and how it is said.',
  },
  'desc.Conselho Fiscal': {
    pt: 'Vigia as contas e garante que tudo bate certo.',
    'en-gb': 'Watches the accounts and keeps everything honest.',
  },
  'desc.Mesa da Assembleia': {
    pt: 'Conduz a assembleia-geral: agenda, votos e actas.',
    'en-gb': 'Runs the general assembly: agenda, votes and minutes.',
  },

  'join.contact': { pt: 'Contacto', 'en-gb': 'Contact' },
  'join.formLink': {
    pt: 'Preencher o formulário',
    'en-gb': 'Fill in the form',
  },
  'join.emailLabel': {
    pt: 'Escreve-nos',
    'en-gb': 'Email us',
  },
  'join.benefits': {
    pt: 'O que ganhas como sócio',
    'en-gb': 'What you get as a member',
  },
  'join.steps': {
    pt: 'Como te tornas sócio',
    'en-gb': 'How to become a member',
  },
  'join.fee': { pt: 'Quota anual', 'en-gb': 'Annual fee' },
  'join.alreadyMember': {
    pt: 'Já és sócio? Vê os teus dados na Área de Sócio.',
    'en-gb': 'Already a member? Check your details in the members\' area.',
  },

  'members.yourData': {
    pt: 'Os teus dados',
    'en-gb': 'Your details',
  },
  'members.number': {
    pt: 'Número de sócio',
    'en-gb': 'Membership number',
  },
  'members.since': { pt: 'Sócio desde', 'en-gb': 'Member since' },
  'members.status': { pt: 'Quota', 'en-gb': 'Fee' },
  'members.statusPaid': {
    pt: 'Em dia (exemplo)',
    'en-gb': 'Up to date (example)',
  },
  'members.update': {
    pt: 'Pedir alteração de dados',
    'en-gb': 'Request a data change',
  },
  'members.mockNote': {
    pt: 'Os dados abaixo são de exemplo. Em v1 não há área autenticada: cada sócio recebe o seu boletim por email e pede alterações por email ou formulário.',
    'en-gb': 'The details below are examples. There is no login area in v1: every member receives their statement by email and requests changes by email or form.',
  },

  'donations.give': { pt: 'Fazer uma doação', 'en-gb': 'Make a donation' },
  'donations.buys': {
    pt: 'O que o teu dinheiro compra',
    'en-gb': 'What your money buys',
  },
  'donations.transparency': {
    pt: 'Transparência',
    'en-gb': 'Transparency',
  },

  'sponsors.tiers': {
    pt: 'Níveis de apoio',
    'en-gb': 'Support tiers',
  },
  'sponsors.become': {
    pt: 'Tornar-se apoio',
    'en-gb': 'Become a sponsor',
  },
  'sponsors.current': {
    pt: 'Quem já nos apoia',
    'en-gb': 'Who already supports us',
  },

  'common.example': { pt: 'exemplo', 'en-gb': 'example' },

  'form.title': {
    pt: 'Candidatura a sócio',
    'en-gb': 'Membership application',
  },
  'form.pdfTitle': {
    pt: 'Candidatura de adesão — Associação Plink',
    'en-gb': 'Membership application — Associação Plink',
  },
  'form.note': {
    pt: 'Preenche, descarrega o PDF e envia-o para o nosso email — respondemos em poucos dias, com um humano do outro lado.',
    'en-gb': 'Fill it in, download the PDF and email it to us — we reply within a few days, with a human on the other side.',
  },
  'form.name': { pt: 'Nome completo', 'en-gb': 'Full name' },
  'form.birth': { pt: 'Data de nascimento', 'en-gb': 'Date of birth' },
  'form.email': { pt: 'Email', 'en-gb': 'Email' },
  'form.phone': { pt: 'Telefone', 'en-gb': 'Phone' },
  'form.city': { pt: 'Cidade / localidade', 'en-gb': 'City / town' },
  'form.memberType': { pt: 'Tipo de sócio', 'en-gb': 'Membership type' },
  'form.typeStudent': { pt: 'Estudante', 'en-gb': 'Student' },
  'form.typePro': { pt: 'Profissional', 'en-gb': 'Professional' },
  'form.typeSupporter': { pt: 'Simpatizante', 'en-gb': 'Supporter' },
  'form.interests': { pt: 'Departamentos de interesse', 'en-gb': 'Departments of interest' },
  'form.undecided': { pt: 'Ainda não sei', 'en-gb': 'Not sure yet' },
  'form.availability': { pt: 'Onde podes ajudar', 'en-gb': 'Where you can help' },
  'form.availabilityEvents': { pt: 'Eventos', 'en-gb': 'Events' },
  'form.availabilityWorkshops': { pt: 'Oficinas', 'en-gb': 'Workshops' },
  'form.availabilityDesign': { pt: 'Design e comunicação', 'en-gb': 'Design and communication' },
  'form.availabilityDev': { pt: 'Desenvolvimento e ferramentas', 'en-gb': 'Development and tooling' },
  'form.availabilityTranslations': { pt: 'Traduções', 'en-gb': 'Translations' },
  'form.availabilityAnything': { pt: 'O que for preciso', 'en-gb': 'Whatever is needed' },
  'form.found': { pt: 'Como nos conheceste', 'en-gb': 'How you found us' },
  'form.foundSchool': { pt: 'Escola', 'en-gb': 'School' },
  'form.foundFriends': { pt: 'Amigos', 'en-gb': 'Friends' },
  'form.foundSocial': { pt: 'Redes sociais', 'en-gb': 'Social media' },
  'form.foundEvent': { pt: 'Num evento', 'en-gb': 'At an event' },
  'form.foundOther': { pt: 'Outro', 'en-gb': 'Other' },
  'form.notes': { pt: 'Notas', 'en-gb': 'Notes' },
  'form.consent': {
    pt: 'Li e aceito a política de privacidade. Os dados usam-se só para gerir a adesão.',
    'en-gb': 'I have read and accept the privacy policy. The data is used only to manage membership.',
  },
  'form.submit': { pt: 'Enviar candidatura', 'en-gb': 'Send application' },
  'form.pdfSent': {
    pt: 'Está feito — o PDF está no teu computador. Envia-o para',
    'en-gb': 'Done — the PDF is on your computer. Send it to',
  },
  'form.noJs': {
    pt: 'Sem JavaScript não dá para gerar o PDF — escreve-nos diretamente para',
    'en-gb': 'Without JavaScript we cannot generate the PDF — write to us at',
  },

  'subscribe.events.title': {
    pt: 'Recebe os próximos eventos por email',
    'en-gb': 'Get the next events by email',
  },
  'subscribe.news.title': {
    pt: 'Recebe as notícias por email',
    'en-gb': 'Get the news by email',
  },
  'subscribe.note': {
    pt: 'Sem spam — só o que interessa, e cancelas quando quiseres.',
    'en-gb': 'No spam — just what matters, and you can cancel anytime.',
  },
  'subscribe.email': { pt: 'O teu email', 'en-gb': 'Your email' },
  'subscribe.submit': { pt: 'Subscrever', 'en-gb': 'Subscribe' },
  'subscribe.pdfTitle': { pt: 'Subscrição', 'en-gb': 'Subscription' },

  'play.title': {
    pt: 'Brincar com as ideias',
    'en-gb': 'Play with the ideas',
  },
  'play.cradle': { pt: 'Valores em movimento', 'en-gb': 'Values in motion' },
  'play.cradleHint': {
    pt: 'Arrasta uma bola e solta — a física faz o resto.',
    'en-gb': 'Drag a ball and let go — physics does the rest.',
  },
  'play.flasks': {
    pt: 'Misturar departamentos',
    'en-gb': 'Mixing departments',
  },
  'play.flasksHint': {
    pt: 'Arrasta um frasco sobre outro para misturar as cores.',
    'en-gb': 'Drag one flask over another to mix the colours.',
  },
  'play.valueDoing': { pt: 'Aprender fazendo', 'en-gb': 'Learning by doing' },
  'play.valueAccess': { pt: 'Acesso para todos', 'en-gb': 'Access for all' },
  'play.valueOpen': { pt: 'Ciência aberta', 'en-gb': 'Open science' },
  'play.valueCommunity': { pt: 'Comunidade', 'en-gb': 'Community' },
  'play.valueCuriosity': { pt: 'Curiosidade', 'en-gb': 'Curiosity' },

  'footer.rights': {
    pt: 'Todos os direitos reservados.',
    'en-gb': 'All rights reserved.',
  },

  'notFound.title': {
    pt: 'Página não encontrada',
    'en-gb': 'Page not found',
  },
  'notFound.body': {
    pt: 'O endereço que procuras não existe (ou já não existe).',
    'en-gb': 'The address you are looking for does not exist (or no longer exists).',
  },
  'notFound.home': { pt: 'Ir para o início', 'en-gb': 'Go home' },
} satisfies Record<string, Localized>;

export type UIKey = keyof typeof ui;

/** Translated UI string, walking the locale fallback chain (en-gb → en-us → pt). */
export function t(locale: Locale, key: UIKey): string {
  for (const l of [locale, ...FALLBACKS[locale], DEFAULT_LOCALE]) {
    const value = ui[key][l];
    if (value) return value;
  }
  return ui[key].pt;
}

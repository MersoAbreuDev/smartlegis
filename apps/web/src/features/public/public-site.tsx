'use client';

import {
  ArrowRight,
  Banknote,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  FileText,
  Landmark,
  Mail,
  MapPin,
  Megaphone,
  Newspaper,
  Phone,
  Scale,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Vote
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePublicPortalData } from './use-public-portal';

export type PublicSection = 'home' | 'noticias' | 'sessoes' | 'institucional' | 'organograma' | 'vereadores' | 'leis' | 'transparencia';

const sections: Array<{ id: Exclude<PublicSection, 'home'>; label: string; icon: typeof Newspaper }> = [
  { id: 'noticias', label: 'Noticias', icon: Newspaper },
  { id: 'sessoes', label: 'Sessoes', icon: CalendarDays },
  { id: 'institucional', label: 'Institucional', icon: Landmark },
  { id: 'organograma', label: 'Organograma', icon: Building2 },
  { id: 'vereadores', label: 'Vereadores', icon: Users },
  { id: 'leis', label: 'Leis', icon: Scale },
  { id: 'transparencia', label: 'Transparencia', icon: ShieldCheck }
];

const news = [
  ['Institucional', 'Camara amplia canais digitais de atendimento ao cidadao', 'Novo portal organiza noticias, sessoes, leis e transparencia em um unico ambiente publico.'],
  ['Sessoes', 'Sessao ordinaria tera pauta de projetos municipais', 'Moradores podem acompanhar materias em discussao e resultados de votacoes nominais.'],
  ['Vereadores', 'Mural legislativo facilita consulta aos vereadores', 'Perfis dos parlamentares ativos ficam disponiveis com partido e informacoes publicas.'],
  ['Transparencia', 'Dados legislativos passam a ter acesso simplificado', 'Consultas publicas estao organizadas por area e integradas ao cadastro da Camara.']
];

const organization = [
  ['Mesa Diretora', 'Presidencia', 'Vice-presidencia', 'Secretaria'],
  ['Plenario', 'Vereadores', 'Comissoes permanentes', 'Liderancas partidarias'],
  ['Administrativo', 'Diretoria geral', 'Controle interno', 'Atendimento ao cidadao']
];

export function PublicSite({ section = 'home' }: { section?: PublicSection }) {
  const data = usePublicPortalData();
  const brand = data.branding.data;
  const tenant = data.home.data?.tenant;
  const primary = brand?.primaryColor ?? '#0B3C6D';
  const accent = brand?.accentColor ?? '#D4AF37';
  const chamberName = brand?.displayName ?? tenant?.name ?? 'Camara Municipal';

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-700" style={{ ['--brand-primary' as string]: primary, ['--brand-accent' as string]: accent }}>
      <TopBar />
      <Header chamberName={chamberName} logoUrl={brand?.logoPortalUrl} active={section} />
      {section === 'home' ? <Home data={data} chamberName={chamberName} /> : <SectionPage section={section} data={data} chamberName={chamberName} />}
      <Footer chamberName={chamberName} city={tenant ? `${tenant.city} - ${tenant.state}` : 'Municipio'} footerText={brand?.footerText} />
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-slate-200 bg-slate-950 text-xs text-white/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Atendimento institucional</span>
          <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> ouvidoria@camara.local</span>
        </div>
        <Link href="/publico/transparencia" className="font-bold text-[var(--brand-accent)]">Acesso a informacao</Link>
      </div>
    </div>
  );
}

function Header({ chamberName, logoUrl, active }: { chamberName: string; logoUrl?: string | null; active: PublicSection }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/publico" className="flex items-center gap-4">
          {logoUrl ? <img src={logoUrl} alt={chamberName} className="h-14 max-w-[220px] object-contain" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white"><Landmark className="h-7 w-7" /></div>}
          <div>
            <p className="text-lg font-black text-slate-950">{chamberName}</p>
            <p className="text-xs font-semibold text-slate-500">Portal publico legislativo</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          <Link href="/publico" className={`rounded-md px-3 py-2 text-sm font-bold ${active === 'home' ? 'bg-slate-100 text-[var(--brand-primary)]' : 'text-slate-700 hover:bg-slate-100'}`}>Home</Link>
          {sections.map(({ id, label }) => (
            <Link key={id} href={`/publico/${id}`} className={`rounded-md px-3 py-2 text-sm font-bold ${active === id ? 'bg-slate-100 text-[var(--brand-primary)]' : 'text-slate-700 hover:bg-slate-100'}`}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Home({ data, chamberName }: { data: ReturnType<typeof usePublicPortalData>; chamberName: string }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const matters = data.matters.data ?? [];
  const sessions = data.sessions.data ?? [];
  const councilMembers = data.councilMembers.data ?? [];
  const slides = useMemo(() => [
    ['Portal oficial', `${chamberName} mais perto de voce`, 'Acompanhe noticias, sessoes, leis, vereadores e transparencia em telas integradas.', '/publico/noticias'],
    ['Atividade legislativa', 'Sessoes, pautas e votacoes em destaque', 'Consulte materias, sessoes recentes e resultados publicados.', '/publico/sessoes'],
    ['Transparencia', 'Informacao publica organizada e acessivel', 'Encontre documentos, relatórios e canais de controle social.', '/publico/transparencia']
  ], [chamberName]);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[activeSlide];
  return (
    <main>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <img src="/brand/smartlegis-board.png" alt="Painel legislativo digital" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-[var(--brand-primary)]/80" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:min-h-[520px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--brand-accent)]">{slide[0]}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">{slide[1]}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">{slide[2]}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={slide[3]} className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5" style={{ backgroundColor: 'var(--brand-accent)' }}>
                Acessar tela <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/publico/leis" className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
                Consultar leis <Search className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <button className="rounded-full border border-white/25 p-2 transition hover:bg-white/10" onClick={() => setActiveSlide((activeSlide + slides.length - 1) % slides.length)} aria-label="Slide anterior"><ChevronLeft className="h-5 w-5" /></button>
              {slides.map((item, index) => <button key={item[1]} className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-[var(--brand-accent)]' : 'w-2.5 bg-white/35'}`} onClick={() => setActiveSlide(index)} aria-label={`Ir para slide ${index + 1}`} />)}
              <button className="rounded-full border border-white/25 p-2 transition hover:bg-white/10" onClick={() => setActiveSlide((activeSlide + 1) % slides.length)} aria-label="Proximo slide"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
          <Stats matters={matters.length} sessions={sessions.length} councilMembers={councilMembers.length} />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {sections.map(({ id, label, icon: Icon }) => <PortalCard key={id} href={`/publico/${id}`} label={label} icon={Icon} />)}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle eyebrow="Portal institucional" title="Telas integradas ao servico publico" description="Cada area do site possui uma pagina propria, ligada aos dados publicos da Camara." />
      </section>
    </main>
  );
}

function SectionPage({ section, data, chamberName }: { section: Exclude<PublicSection, 'home'>; data: ReturnType<typeof usePublicPortalData>; chamberName: string }) {
  const [query, setQuery] = useState('');
  const matters = data.matters.data ?? [];
  const sessions = data.sessions.data ?? [];
  const councilMembers = data.councilMembers.data ?? [];
  const filteredMatters = matters.filter((matter) => `${matter.type} ${matter.number} ${matter.year} ${matter.title} ${matter.summary}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <main>
      <PageHero title={sections.find((item) => item.id === section)?.label ?? 'Portal'} chamberName={chamberName} />
      {section === 'noticias' && <NewsPage />}
      {section === 'sessoes' && <SessionsPage sessions={sessions} />}
      {section === 'institucional' && <InstitutionalPage chamberName={chamberName} city={data.home.data?.tenant ? `${data.home.data.tenant.city} - ${data.home.data.tenant.state}` : 'Municipio'} />}
      {section === 'organograma' && <OrganizationPage />}
      {section === 'vereadores' && <CouncilMembersPage members={councilMembers} />}
      {section === 'leis' && <LawsPage matters={filteredMatters} query={query} onQuery={setQuery} />}
      {section === 'transparencia' && <TransparencyPage />}
    </main>
  );
}

function PageHero({ title, chamberName }: { title: string; chamberName: string }) {
  return (
    <section className="bg-slate-950 px-4 py-14 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--brand-accent)]">{chamberName}</p>
        <h1 className="mt-3 text-4xl font-black">{title}</h1>
      </div>
    </section>
  );
}

function NewsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionTitle eyebrow="Comunicacao" title="Noticias da Camara" description="Informativos, avisos e destaques da atividade legislativa municipal." />
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {news.map(([category, title, summary]) => <ContentCard key={title} icon={Newspaper} eyebrow={category} title={title} text={summary} />)}
      </div>
    </section>
  );
}

function SessionsPage({ sessions }: { sessions: Array<{ id: string; type: string; number: number; date: string; status: string }> }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionTitle eyebrow="Plenario" title="Sessoes legislativas" description="Agenda, situacao e historico das sessoes publicadas pela API." />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {sessions.map((session) => <ContentCard key={session.id} icon={CalendarDays} eyebrow={session.status} title={`${session.type} ${session.number}/${new Date(session.date).getFullYear()}`} text={new Date(session.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} />)}
      </div>
    </section>
  );
}

function InstitutionalPage({ chamberName, city }: { chamberName: string; city: string }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl bg-slate-950 p-8 text-white shadow-xl">
        <Landmark className="h-10 w-10 text-[var(--brand-accent)]" />
        <h2 className="mt-5 text-3xl font-black">{chamberName}</h2>
        <p className="mt-4 leading-8 text-white/75">Poder Legislativo municipal comprometido com publicidade dos atos, participacao social, fiscalizacao e acesso simples a informacao.</p>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold"><MapPin className="h-4 w-4" /> {city}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ['Missao', 'Representar a sociedade, legislar e fiscalizar com responsabilidade.'],
          ['Visao', 'Ser referencia em transparencia, atendimento e modernizacao legislativa.'],
          ['Valores', 'Etica, publicidade, respeito institucional e compromisso publico.'],
          ['Atendimento', 'Canais digitais e presenciais para aproximar o cidadao da Camara.']
        ].map(([title, text]) => <ContentCard key={title} icon={Landmark} eyebrow="Institucional" title={title} text={text} />)}
      </div>
    </section>
  );
}

function OrganizationPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionTitle eyebrow="Estrutura" title="Organograma institucional" description="Visao simples da organizacao administrativa e legislativa." />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {organization.map(([title, ...people]) => (
          <article key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <Building2 className="h-8 w-8 text-[var(--brand-primary)]" />
            <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
            <div className="mt-4 space-y-2">{people.map((person) => <p key={person} className="rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{person}</p>)}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CouncilMembersPage({ members }: { members: Array<{ id: string; name: string; party: string; photoUrl: string | null }> }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionTitle eyebrow="Representantes" title="Mural de vereadores" description="Parlamentares ativos no Legislativo municipal, carregados da API publica." />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {members.map((member) => (
          <article key={member.id} className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            {member.photoUrl ? <img src={member.photoUrl} alt={member.name} className="mx-auto h-24 w-24 rounded-full object-cover" /> : <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand-primary)] text-3xl font-black text-white">{member.name.slice(0, 1)}</div>}
            <h2 className="mt-4 font-black text-slate-950">{member.name}</h2>
            <p className="mt-1 text-sm font-bold text-[var(--brand-primary)]">{member.party}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-black text-slate-500"><UserRound className="h-4 w-4" /> Perfil parlamentar</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LawsPage({ matters, query, onQuery }: { matters: Array<{ id: string; type: string; number: number; year: number; title: string; summary: string; status: string; author: { name: string } }>; query: string; onQuery: (value: string) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle eyebrow="Legislacao" title="Leis e materias" description="Pesquise proposicoes, leis e documentos legislativos publicados pela API." />
        <div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Buscar por palavra-chave" className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none ring-[var(--brand-primary)]/15 focus:ring-4" /></div>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {matters.map((matter) => <ContentCard key={matter.id} icon={BookOpen} eyebrow={`${matter.type} ${matter.number}/${matter.year}`} title={matter.title} text={`${matter.summary} Autor: ${matter.author.name}. Status: ${matter.status}`} />)}
      </div>
    </section>
  );
}

function TransparencyPage() {
  const items = [
    ['Receitas e despesas', 'Publicacoes financeiras e relatorios fiscais.', Banknote],
    ['Contratos e licitacoes', 'Consulta de processos administrativos.', FileSearch],
    ['Votacoes nominais', 'Resultados auditados por materia e sessao.', Vote],
    ['Auditoria legislativa', 'Rastreabilidade por eventos e hashes.', ShieldCheck],
    ['Diario legislativo', 'Publicacoes oficiais e atos normativos.', Megaphone],
    ['Leis municipais', 'Consulta de normas e materias finalizadas.', Scale]
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionTitle eyebrow="Controle social" title="Transparencia publica" description="Acesso a dados, documentos, votacoes e canais de controle social." />
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map(([title, text, Icon]) => <ContentCard key={String(title)} icon={Icon as typeof ShieldCheck} eyebrow="Transparencia" title={String(title)} text={String(text)} />)}
      </div>
    </section>
  );
}

function Stats({ matters, sessions, councilMembers }: { matters: number; sessions: number; councilMembers: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        ['Materias publicadas', matters, FileText],
        ['Sessoes encerradas', sessions, CalendarDays],
        ['Vereadores ativos', councilMembers, Users],
        ['Votacoes nominais', matters, Vote]
      ].map(([label, value, Icon]) => {
        const CardIcon = Icon as typeof FileText;
        return <div key={String(label)} className="rounded-xl border border-white/12 bg-white/10 p-5 shadow-2xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/14"><CardIcon className="h-6 w-6 text-[var(--brand-accent)]" /><p className="mt-4 text-4xl font-black">{value as number}</p><p className="mt-1 text-sm font-semibold text-white/75">{label as string}</p></div>;
      })}
    </div>
  );
}

function PortalCard({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Newspaper }) {
  return <Link href={href} className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-[var(--brand-primary)] hover:shadow-md"><Icon className="h-6 w-6 text-[var(--brand-primary)]" /><p className="mt-3 text-sm font-black text-slate-950">{label}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-slate-500 group-hover:text-[var(--brand-primary)]">Acessar <ArrowRight className="h-3.5 w-3.5" /></span></Link>;
}

function ContentCard({ icon: Icon, eyebrow, title, text }: { icon: typeof Newspaper; eyebrow: string; title: string; text: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><Icon className="h-7 w-7 text-[var(--brand-primary)]" /><p className="mt-5 text-xs font-black uppercase tracking-wide text-[var(--brand-primary)]">{eyebrow}</p><h2 className="mt-2 text-xl font-black leading-tight text-slate-950">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>;
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div><p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]">{eyebrow}</p><h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p></div>;
}

function Footer({ chamberName, city, footerText }: { chamberName: string; city: string; footerText?: string | null }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div><p className="text-lg font-black text-slate-950">{chamberName}</p><p className="mt-3 text-sm leading-6 text-slate-600">{footerText ?? 'Portal publico de transparencia legislativa municipal.'}</p></div>
        <div><p className="font-black text-slate-950">Localizacao</p><p className="mt-3 inline-flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {city}</p></div>
        <div><p className="font-black text-slate-950">Atendimento</p><p className="mt-3 text-sm text-slate-600">Segunda a sexta, das 8h as 17h.</p></div>
      </div>
    </footer>
  );
}

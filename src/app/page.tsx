import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Target, Users, BarChart3, Clock, Database, ShieldCheck, Headset } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-sm">
              F
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">FocusBoard</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Fonctionnalités</a>
            <a href="#methodology" className="hover:text-indigo-600 transition-colors">Méthodologie</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
              Se connecter
            </Link>
            <Link href="/register">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm rounded-full px-6">
                Créer mon espace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="absolute top-0 left-1/2 -ml-[40rem] w-[80rem] h-[40rem] bg-gradient-to-br from-indigo-100 to-purple-50 rounded-full blur-3xl opacity-50 -z-10 animate-pulse-slow"></div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-8 mx-auto">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Le futur du management
          </div>

          <h1 className="mx-auto max-w-4xl font-extrabold tracking-tight text-slate-900 text-5xl sm:text-7xl mb-8 leading-[1.1]">
            Transformez le travail de votre équipe en <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">pur focus.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
            Fini le micro-management. FocusBoard introduit le <strong className="font-semibold text-slate-900">Morning Check-in</strong> et un système de points pour aligner vos objectifs, responsabiliser vos collaborateurs et mesurer la vraie performance.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50 rounded-full px-8 h-14 text-base font-medium transition-all hover:scale-105 active:scale-95">
                Commencer gratuitement <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" className="w-full sm:w-auto bg-white border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full px-8 h-14 text-base font-medium shadow-sm transition-all">
                Découvrir la méthode
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-xl"></div>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
              alt="Dashboard Preview"
              className="relative rounded-2xl border border-slate-200/50 shadow-2xl object-cover h-[500px] w-full object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent rounded-2xl flex items-end justify-center pb-8">
              <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-white/20 text-sm font-medium text-slate-800 flex items-center gap-3 animate-fade-in-up">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500"></span>
                Alex vient de valider 5 points de focus.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
              Pensé pour l'exécution, pas l'administration.
            </h2>
            <p className="text-lg text-slate-600">
              Notre plateforme Gamifiée remplace les to-do listes infinies par un cycle quotidien motivant orienté sur l'accomplissement réel.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Le Morning Check-in</h3>
              <p className="text-slate-600">
                Chaque matin, vos collaborateurs engagent leur focus de la journée. Un rituel simple qui aligne l'équipe et crée une clarté mentale imbattable.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Valorisation par Points</h3>
              <p className="text-slate-600">
                Fini les petites tâches invisibles. Chaque tâche rapporte de 1 à 5 points. Le performance index permet d'évaluer concrètement l'impact, pas le temps de présence.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Flux Social Positif</h3>
              <p className="text-slate-600">
                Tirez parti de l'émulation collective. Le flux de l'entreprise célèbre chaque objectif atteint en temps réel, boostant la culture de l'exécution.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Split Method Section */}
      <section id="methodology" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                Gérez l'impossible en le subdivisant.
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Les tâches massives ("Refaire le site web", "Lancer la campagne") paralysent les équipes. FocusBoard intègre un outil unique de <strong>Subdivision Intelligente</strong>.
                <br /><br />
                Découpez une tâche de 5 points en micro-livrables digestes, planifiables sur la semaine. C'est le secret d'une avancée méthodique sans burn-out.
              </p>

              <ul className="space-y-4">
                {['Réduit la procrastination', 'Améliore la visibilité du manager', 'Maintient un score d\'accomplissement quotidien élevé'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="inline-block mt-10">
                <Button className="bg-white hover:bg-slate-100 text-slate-900 rounded-full px-6 h-12 shadow-md">
                  Essayer gratuitement
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop"
                  alt="Methodology"
                  className="rounded-xl object-cover h-[400px] w-full"
                />
              </div>
              {/* Abstract floaters */}
              <div className="absolute -right-6 top-10 bg-indigo-600 text-white p-4 rounded-xl shadow-xl z-20 animate-bounce-slow border border-indigo-400">
                <div className="text-xs uppercase font-bold tracking-wider mb-1 opacity-80">Tâche divisée</div>
                <div className="font-semibold">+ 2 Points gagnés</div>
              </div>
              <div className="absolute -left-6 bottom-10 bg-emerald-500 text-white p-4 rounded-xl shadow-xl z-20 animate-bounce-slow delay-150 border border-emerald-400">
                <div className="text-xs uppercase font-bold tracking-wider mb-1 opacity-80">Dashboard</div>
                <div className="font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4" /> 100% complétion</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Center Section */}
      <section id="datacenter" className="py-24 bg-indigo-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-200/50 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-6 mx-auto">
              <Database className="w-4 h-4" /> Le Tableur Repensé
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-6">
              Votre Base de Données interne, simplifiée.
            </h2>
            <p className="text-lg text-slate-600">
              Transformez vos fichiers Excel éparpillés, lents et non-sécurisés en un <strong>Data Center</strong> centralisé. Éditez vos données à la volée, créez des colonnes personnalisées, et collaborez en temps réel en toute sécurité.
            </p>
          </div>

          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-500 opacity-20 blur-xl"></div>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
              alt="Data Center Preview"
              className="relative rounded-2xl border border-white shadow-2xl object-cover h-[450px] w-full object-center"
            />
            {/* Contextual float elements to bring it to life */}
            <div className="absolute top-10 -left-8 bg-white p-3 shadow-xl rounded-lg border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">OK</div>
              <div>
                <p className="text-xs font-bold text-slate-900">Champ mis à jour</p>
                <p className="text-[10px] text-slate-500">Colonne "Statut Client"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Features Section */}
      <section id="more-features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
              Un pilotage opérationnel à 360°.
            </h2>
            <p className="text-lg text-slate-600">
              FocusBoard ne se limite pas aux tâches. Il rassemble chaque dimension de collaboration sous le même toit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">RBAC & Suivi Équipe</h3>
              <p className="text-slate-600">
                Des rôles précis (Admin, Manager, User) et des profils détaillés pour analyser le Performance Index (PI) et les tâches de votre équipe.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Headset className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Support Interne</h3>
              <p className="text-slate-600">
                Gérez les demandes internes (IT, RH, QSE) via un système de tickets intégré avec vue Master-Detail pour une résolution express.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Vues Kanban Flexibles</h3>
              <p className="text-slate-600">
                Déplacez vos projets étape par étape avec une expérience Drag & Drop ultra-fluide pour repérer les goulots d'étranglement instantanément.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-32 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/30 rounded-full blur-[120px]"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm font-medium text-white mb-8 shadow-xl">
            <Zap className="w-4 h-4 text-amber-400" /> Rejoignez les équipes d'élite
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Prêt à <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-300">débloquer le potentiel</span> de votre entreprise ?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light">
            Démarrez avec FocusBoard aujourd'hui. L'inscription prend 30 secondes chrono, et l'impact sur votre productivité est immédiat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-2xl shadow-indigo-500/40 rounded-full px-12 h-16 text-xl font-bold transition-all hover:scale-105 active:scale-95 border border-indigo-400/50">
                Créer mon espace gratuitement
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Béta privée (100% Gratuit)</div>
            <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Pas de carte bleue</div>
            <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Setup en 30 secondes</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-400 rounded flex items-center justify-center font-bold text-white text-xs">
              F
            </div>
            <span className="font-bold tracking-tight text-slate-500">FocusBoard</span>
          </div>
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} FocusBoard Inc. Construit avec passion pour les équipes exigeantes.
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Conditions</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

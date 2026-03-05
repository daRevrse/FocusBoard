"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  Target,
  ShieldCheck,
  Zap
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Smooth scrolling with Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Initial GSAP animations
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.fromTo(
        ".hero-text",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out" }
      );

      gsap.fromTo(
        ".hero-image",
        { scale: 0.95, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: "power2.out" }
      );

      // Scroll animations for sections
      gsap.utils.toArray(".fade-up").forEach((element: any) => {
        gsap.fromTo(
          element,
          { y: 60, opacity: 0 },
          {
            scrollTrigger: {
              trigger: element,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
          }
        );
      });

      // Stagger for grid items
      gsap.utils.toArray(".stagger-grid").forEach((grid: any) => {
        const items = grid.querySelectorAll(".stagger-item");
        gsap.fromTo(
          items,
          { y: 40, opacity: 0 },
          {
            scrollTrigger: {
              trigger: grid,
              start: "top 80%",
            },
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
          }
        );
      });
    }, containerRef);

    return () => {
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDFBF7] selection:bg-slate-200 selection:text-black font-sans text-[#111827] overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#FDFBF7]/95 backdrop-blur-sm border-b border-[#EBE6E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#111827] rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-sm">
              <Target className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#111827]">Faucus</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 uppercase tracking-wide">
            <a href="#problem" className="hover:text-[#111827] transition-colors">Le Problème</a>
            <a href="#solution" className="hover:text-[#111827] transition-colors">La Solution</a>
            <a href="#method" className="hover:text-[#111827] transition-colors">Méthode</a>
            <a href="#pricing" className="hover:text-[#111827] transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-[#111827] transition-colors uppercase tracking-wide hidden sm:block">
              Connexion
            </Link>
            <Link href="/register">
              <Button className="bg-[#111827] hover:bg-black text-white rounded-full px-6 py-5 h-auto text-sm font-bold transition-all shadow-md hover:shadow-lg">
                Essai gratuit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <main className="pt-36 pb-20 sm:pt-48 sm:pb-32 overflow-hidden bg-[#FDFBF7]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="hero-text inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EEF7F2] text-[#2E8B57] text-xs font-bold uppercase tracking-widest mb-8">
              L'Execution Measurement System
            </div>

            <h1 className="hero-text font-extrabold tracking-tight text-[#111827] text-5xl sm:text-[5.5rem] mb-8 leading-[1.05] -mt-2">
              Ne gérez plus des tâches.<br />
              <span className="text-[#111827]">Mesurez l'exécution.</span>
            </h1>

            <p className="hero-text text-xl sm:text-2xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              Arrêtez de vous demander sur quoi vos équipes travaillent abord. Faucus remplace les listes infinies par un Index de Performance clair et prévisible. Sans micro-management.
            </p>

            <div className="hero-text flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Link href="/register">
                <Button className="w-full sm:w-auto bg-[#111827] hover:bg-black text-white rounded-full px-10 py-7 h-auto text-lg font-bold transition-transform hover:-translate-y-1 shadow-xl">
                  Calculer mon Index de Performance
                </Button>
              </Link>
            </div>
            <p className="hero-text text-sm text-slate-500 font-medium tracking-wide">
              Sans carte bancaire • Déploiement en 2 minutes • Annulation à tout moment
            </p>

            {/* Visual Hero */}
            <div className="hero-image mt-20 relative mx-auto max-w-5xl">
              <div className="relative bg-white rounded-[32px] p-4 shadow-2xl border border-slate-100/50">
                {/* Abstract UI representation of Performance Index instead of standard Kanban */}
                <div className="bg-[#F8FAFC] rounded-[24px] h-[400px] sm:h-[500px] w-full flex flex-col items-center justify-center relative overflow-hidden">

                  {/* Decorative faint background grid */}
                  <div className="absolute inset-0 z-0" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }}></div>

                  {/* Main Metric UI Display */}
                  <div className="z-10 bg-white p-8 sm:p-12 rounded-[32px] shadow-xl border border-slate-100 flex flex-col items-center max-w-md w-full relative">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Performance Index (PI)</p>
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                      {/* SVG Donut Chart */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="8" fill="none" />
                        <circle cx="50" cy="50" r="40" stroke="#2E8B57" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset="40" className="transition-all duration-1000 ease-out" />
                      </svg>
                      {/* Center Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl sm:text-6xl font-black text-[#111827]">84<span className="text-3xl">%</span></span>
                        <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded-full mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> +12%
                        </span>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-between w-full border-t border-slate-100 pt-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Points Engagés</p>
                        <p className="text-2xl font-black text-[#111827]">120</p>
                      </div>
                      <div className="w-px bg-slate-100"></div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Points Achevés</p>
                        <p className="text-2xl font-black text-[#2E8B57]">101</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating elements indicating real-time updates */}
                  <div className="absolute top-12 left-12 bg-white/90 backdrop-blur px-4 py-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 animate-pulse origin-center">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-bold text-slate-700">Marie a validé 5 pts</span>
                  </div>
                  <div className="absolute bottom-16 right-12 bg-white/90 backdrop-blur px-4 py-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 delay-150">
                    <div className="w-8 h-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                      <Zap className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Quête "Refonte" achevée</span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 2. PROBLEM (Agitation) */}
      <section id="problem" className="py-24 sm:py-32 bg-[#111827] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="fade-up text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-8 leading-tight">
            Vous payez pour du temps.<br />Vous attendez de l'exécution.
          </h2>
          <p className="fade-up text-xl text-slate-400 mb-16 leading-relaxed font-medium">
            Les outils de gestion classiques vous disent "quoi" faire, mais ne vous disent jamais "à quelle vitesse" ni avec "quelle efficacité" le travail est accompli. Résultat : vous vous tournez vers le time-tracking. Une culture toxique, des heures de réunions, et au final : <strong className="text-white">si vous ne mesurez que le temps, vous perdez en vélocité.</strong>
          </p>

          <div className="stagger-grid grid sm:grid-cols-3 gap-8">
            <div className="stagger-item text-center">
              <Clock className="w-12 h-12 text-[#FFA07A] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">Time-Tracking Toxique</h3>
              <p className="text-slate-400 font-medium">Présentéisme virtuel et heures pointées sans vérification de la valeur ajoutée réelle.</p>
            </div>
            <div className="stagger-item text-center">
              <Activity className="w-12 h-12 text-[#FFD700] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">Réunions Inutiles</h3>
              <p className="text-slate-400 font-medium">Points de synchronisation quotidiens juste pour pallier le manque de visibilité.</p>
            </div>
            <div className="stagger-item text-center">
              <BarChart3 className="w-12 h-12 text-[#98FF98] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">Zéro Métrique Fiable</h3>
              <p className="text-slate-400 font-medium">Impossible de connaître la rentabilité opérationnelle avant la fin du trimestre.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE NEW STANDARD (Solution) */}
      <section id="solution" className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="fade-up max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest mb-6">
              Le changement de paradigme
            </div>
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#111827] mb-8 leading-tight">
              Voici le Performance Index.<br />La nouvelle norme d'exécution.
            </h2>
            <p className="text-xl text-slate-600 font-medium leading-relaxed">
              Faucus ne liste pas vos problèmes dans un tableau Kanban de plus. Il calcule scientifiquement l'efficacité de votre équipe. Le PI (Performance Index) est le ratio mathématique incontestable entre ce que votre équipe s'engage à faire, et ce qu'elle livre réellement.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (3 Steps) */}
      <section id="method" className="py-24 sm:py-32 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111827] mb-6">
              L'exécution, transformée en science exacte.
            </h2>
          </div>

          <div className="space-y-32">
            {/* Step 1 */}
            <div className="fade-up grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#EEF7F2] mb-6">
                    <Target className="w-10 h-10 text-[#2E8B57]" />
                  </div>
                  <h4 className="text-2xl font-black text-[#111827] mb-2">Morning Check-In</h4>
                  <p className="text-slate-500 font-medium">Temps estimé : 2 minutes/jour</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="text-sm font-bold text-[#2E8B57] uppercase tracking-widest mb-4">Étape 1</div>
                <h3 className="text-4xl font-black text-[#111827] mb-6">L'Engagement</h3>
                <p className="text-xl text-slate-600 leading-relaxed font-medium">
                  Chaque matin, chaque collaborateur sélectionne ses missions de la journée et s'engage sur une valeur de "points d'effort". Fini le travail fantôme. Les engagements sont clairs et publics.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="fade-up grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Étape 2</div>
                <h3 className="text-4xl font-black text-[#111827] mb-6">Le Focus</h3>
                <p className="text-xl text-slate-600 leading-relaxed font-medium">
                  L'équipe travaille sans interruption. Lorsqu'une mission est achevée sur le Kanban Faucus, elle convertit instantanément les points engagés en points gagnés. La data s'actualise seule, sans saisie de temps supplémentaire.
                </p>
              </div>
              <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                    <Zap className="w-10 h-10 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-black text-[#111827] mb-2">Exécution Validée</h4>
                  <p className="text-slate-500 font-medium">Conversion automatique PI</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="fade-up grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FEF9E7] mb-6">
                    <TrendingUp className="w-10 h-10 text-[#D4AF37]" />
                  </div>
                  <h4 className="text-2xl font-black text-[#111827] mb-2">Analyse & Dashboard</h4>
                  <p className="text-slate-500 font-medium">Visibilité en temps réel</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mb-4">Étape 3</div>
                <h3 className="text-4xl font-black text-[#111827] mb-6">La Clarté</h3>
                <p className="text-xl text-slate-600 leading-relaxed font-medium">
                  Le Performance Index de l'entreprise s'ajuste en direct. Les collaborateurs motivés peuvent piocher dans le "Bac à faire" (tâches orphelines) pour booster leur PI. C'est motivant pour eux, ultra-rentable pour vous.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CONCRETE RESULTS */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="fade-up text-3xl font-extrabold text-[#111827] mb-16">L'impact d'une exécution mesurée.</h2>
          <div className="stagger-grid grid sm:grid-cols-3 gap-12 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="stagger-item pt-8 sm:pt-0">
              <div className="text-6xl font-black text-[#2E8B57] mb-4">+32%</div>
              <p className="text-lg text-slate-600 font-medium">Vélocité d'équipe constatée<br />en 30 jours.</p>
            </div>
            <div className="stagger-item pt-8 sm:pt-0">
              <div className="text-6xl font-black text-[#111827] mb-4">100%</div>
              <p className="text-lg text-slate-600 font-medium">Abandon du time-tracking<br />par nos clients.</p>
            </div>
            <div className="stagger-item pt-8 sm:pt-0">
              <div className="text-6xl font-black text-[#111827] mb-4">0</div>
              <p className="text-lg text-slate-600 font-medium">Réunion de synchronisation<br />quotidienne nécessaire.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. OBJECTION */}
      <section className="py-24 sm:py-32 bg-[#FDFBF7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-[#EEF7F2] rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldCheck className="w-8 h-8 text-[#2E8B57]" />
          </div>
          <h2 className="fade-up text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111827] mb-8 leading-tight">
            Le contrôle infantilise.<br />La mesure responsabilise.
          </h2>
          <p className="fade-up text-xl text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto">
            Faucus a été conçu pour les talents, pas pour les micro-managers. Nous ne mesurons pas les heures passées devant un écran, nous mesurons <strong>l'accomplissement des engagements</strong>. Si un collaborateur atteint son engagement de points à 14h, sa journée est réussie. La culture du résultat, enfin appliquée.
          </p>
        </div>
      </section>

      {/* 7. SOCIAL PROOF */}
      <section className="py-24 sm:py-32 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center mb-20 max-w-4xl mx-auto">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#111827] leading-tight mb-4">
              Des équipes qui ont arrêté de deviner, et commencé à mesurer.
            </h2>
          </div>

          <div className="stagger-grid grid lg:grid-cols-3 gap-8">
            <div className="stagger-item bg-[#FDFBF7] rounded-[32px] p-10 border border-[#EBE6E0]">
              <p className="text-lg text-slate-700 font-medium leading-relaxed mb-10">
                "Avant, je savais qu'on était occupés, mais je n'avais aucune idée de notre rentabilité quotidienne. L'Index de Performance a changé notre trajectoire financière dès la deuxième semaine."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=CEO" alt="avatar" />
                </div>
                <div>
                  <div className="font-extrabold text-[#111827]">Marc D.</div>
                  <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">CEO, Agence Digitale</div>
                </div>
              </div>
            </div>

            <div className="stagger-item bg-[#FDFBF7] rounded-[32px] p-10 border border-[#EBE6E0]">
              <p className="text-lg text-slate-700 font-medium leading-relaxed mb-10">
                "L'équipe produit a adopté le Check-In immédiatement. Le système de quêtes transforme les tâches ingrates en vrais défis. La vélocité a explosé, et les développeurs adorent l'autonomie."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ops" alt="avatar" />
                </div>
                <div>
                  <div className="font-extrabold text-[#111827]">Sophie L.</div>
                  <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">Head of Operations</div>
                </div>
              </div>
            </div>

            <div className="stagger-item bg-[#FDFBF7] rounded-[32px] p-10 border border-[#EBE6E0]">
              <p className="text-lg text-slate-700 font-medium leading-relaxed mb-10">
                "On a supprimé nos fichiers de reporting. L'exécution est claire, mesurable, et mon équipe adore ne plus avoir à justifier son emploi du temps aux managers."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sales" alt="avatar" />
                </div>
                <div>
                  <div className="font-extrabold text-[#111827]">Julien P.</div>
                  <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">Directeur Commercial</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Secondary features */}
      <section className="py-16 sm:py-24 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest mb-12">
            Inclus Nativement
          </div>
          <div className="fade-up max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-[#111827] mb-6">Centralisez l'opérationnel. Sans quitter le framework.</h2>
            <p className="text-lg text-slate-600 font-medium">FocusBoard inclut des accélérateurs puissants pour éviter de payer 4 logiciels différents.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 fade-up">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-left">
              <h3 className="text-xl font-black text-[#111827] mb-3">Messagerie Privée</h3>
              <p className="text-sm text-slate-500 font-medium">Canaux par projets et DM. Remplace vos abonnements Slack complexes.</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-left">
              <h3 className="text-xl font-black text-[#111827] mb-3">Data Center Interne</h3>
              <p className="text-sm text-slate-500 font-medium">Bases de données hébergées type Airtable. Structurez le savoir.</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-left">
              <h3 className="text-xl font-black text-[#111827] mb-3">Billetterie Support</h3>
              <p className="text-sm text-slate-500 font-medium">Tickets RH & IT internes gérés directement par les managers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING */}
      <section id="pricing" className="py-24 sm:py-32 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center mb-20 max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111827] leading-tight mb-6">
              Investissez dans la clarté.
            </h2>
            <p className="text-xl text-slate-600 font-medium">Des tarifs structurés par niveau d'intelligence analytique.</p>
          </div>

          <div className="stagger-grid grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* Basic */}
            <div className="stagger-item bg-[#FDFBF7] border border-[#EBE6E0] rounded-[40px] p-10 flex flex-col items-center text-center">
              <h3 className="text-2xl font-black text-[#111827] mb-2 uppercase tracking-wide">Exécution</h3>
              <p className="text-slate-500 font-medium mb-8 text-sm h-10">L'essentiel pour structurer la culture du résultat.</p>
              <div className="text-5xl font-black text-[#111827] mb-1">3€</div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-8">/utilisateur/mois</p>
              <ul className="text-left space-y-4 w-full mb-10 text-slate-700 flex-1 font-medium text-sm">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#111827]" /> Morning Check-In</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#111827]" /> Vue Kanban d'Exécution</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#111827]" /> PI Individuel</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#111827]" /> Messagerie Native</li>
              </ul>
              <Button className="w-full bg-white border-2 border-[#111827] text-[#111827] hover:bg-slate-50 rounded-full py-6 font-bold uppercase tracking-widest text-xs">Commencer</Button>
            </div>

            {/* Pro */}
            <div className="stagger-item bg-[#111827] text-white rounded-[40px] p-10 flex flex-col items-center text-center shadow-2xl relative lg:-translate-y-4">
              <div className="absolute top-0 transform -translate-y-1/2 bg-[#EEF7F2] text-[#2E8B57] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">Le standard PME</div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Performance</h3>
              <p className="text-slate-400 font-medium mb-8 text-sm h-10">Pour optimiser la rentabilité.</p>
              <div className="text-5xl font-black text-white mb-1">8€</div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-8">/utilisateur/mois</p>
              <ul className="text-left space-y-4 w-full mb-10 text-slate-300 flex-1 font-medium text-sm">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#2E8B57]" /> <span className="text-white">Tout le plan Exécution</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#2E8B57]" /> PI Collectif & Analytics</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#2E8B57]" /> Bac à faire (Quêtes)</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#2E8B57]" /> Data Center Interne</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#2E8B57]" /> Rapports Mensuels</li>
              </ul>
              <Button className="w-full bg-[#2E8B57] hover:bg-[#236e44] text-white rounded-full py-6 font-bold uppercase tracking-widest text-xs">Essai Gratuit</Button>
            </div>

            {/* Analytics */}
            <div className="stagger-item bg-[#FDFBF7] border border-[#EBE6E0] rounded-[40px] p-10 flex flex-col items-center text-center">
              <h3 className="text-2xl font-black text-[#111827] mb-2 uppercase tracking-wide">Intelligence</h3>
              <p className="text-slate-500 font-medium mb-8 text-sm h-10">Pour les directions générales exigeantes.</p>
              <div className="text-5xl font-black text-[#111827] mb-1">15€</div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-8">/utilisateur/mois</p>
              <ul className="text-left space-y-4 w-full mb-10 text-slate-700 flex-1 font-medium text-sm">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#111827]" /> <strong>Tout le plan Performance</strong></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#111827]" /> RBAC Avancé (Rôles)</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#111827]" /> Métriques sur-mesure</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-[#111827]" /> Billetterie Support (IT/RH)</li>
              </ul>
              <Button className="w-full bg-white border-2 border-[#111827] text-[#111827] hover:bg-slate-50 rounded-full py-6 font-bold uppercase tracking-widest text-xs">Contacter</Button>
            </div>

          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-32 bg-[#FDFBF7] text-center border-t border-slate-100">
        <div className="fade-up max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight text-[#111827] mb-8 leading-[1.05]">
            Prêt à transformer<br />l'effort en certitude ?
          </h2>
          <p className="text-2xl text-slate-600 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Arrêtez de deviner. Commencez à mesurer l'exécution.
          </p>

          <div className="flex justify-center mb-6">
            <Link href="/register">
              <Button className="bg-[#111827] hover:bg-black text-white rounded-full px-12 py-8 h-auto text-lg font-black uppercase tracking-widest shadow-2xl transition-transform hover:-translate-y-1">
                Lancer mon premier Check-In
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-500 font-bold tracking-wide uppercase">
            Essai de 14 Jours • 100% Sans Risque
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Target className="w-6 h-6 text-[#111827]" />
            <span className="font-black text-xl tracking-tight text-[#111827] uppercase">Faucus</span>
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center md:text-left">
            &copy; {new Date().getFullYear()} Faucus Inc. L'Execution Measurement System.
          </div>
          <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-[#111827] transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-[#111827] transition-colors">Conditions</a>
            <a href="#" className="hover:text-[#111827] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

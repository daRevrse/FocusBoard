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
  EyeOff,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Database,
  MessageCircle,
  Headset,
  Target
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
        { scale: 0.95, opacity: 0, rotate: -3 },
        { scale: 1, opacity: 1, rotate: 3, duration: 1.2, delay: 0.3, ease: "back.out(1.2)" }
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
    <div ref={containerRef} className="min-h-screen bg-[#FDFBF7] selection:bg-slate-200 selection:text-black font-sans text-black overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#FDFBF7]/95 backdrop-blur-sm border-b border-[#EBE6E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-bold text-white text-xl">
              <Target className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-black">FocusBoard</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-base font-bold text-slate-700">
            <a href="#how-it-works" className="hover:text-black transition-colors">Méthode</a>
            <a href="#benefits" className="hover:text-black transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-black transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-base font-bold text-slate-700 hover:text-black transition-colors hidden sm:block">
              Se connecter
            </Link>
            <Link href="/register">
              <Button className="bg-black hover:bg-slate-800 text-white rounded-full px-6 py-6 h-auto text-base font-bold transition-all">
                Essai gratuit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <main className="pt-36 pb-20 sm:pt-48 sm:pb-32 overflow-hidden bg-[#FDFBF7]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">

            {/* Left : Text */}
            <div className="text-left max-w-2xl">
              <div className="hero-text inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FEF9E7] text-[#9A7D18] text-sm font-bold tracking-wide mb-8">
                Le framework d'exécution
              </div>

              <h1 className="hero-text font-extrabold tracking-tight text-black text-5xl sm:text-[5.5rem] mb-8 leading-[1.05]">
                Ne gérez plus <br />des tâches. <br />
                <span className="text-black">Optimisez l'exécution.</span>
              </h1>

              <p className="hero-text text-xl sm:text-2xl text-slate-700 mb-10 leading-relaxed max-w-xl font-medium">
                FocusBoard n'est pas une simple to-do list. C'est l'unique plateforme combinant gestion de projet, check-in quotidien par points et un index de performance en temps réel pour garantir que votre entreprise avance vraiment.
              </p>

              <div className="hero-text flex flex-col sm:flex-row gap-4 mb-4">
                <Link href="/register">
                  <Button className="w-full sm:w-auto bg-black hover:bg-slate-800 text-white rounded-full px-10 py-7 h-auto text-lg font-bold transition-transform hover:-translate-y-1">
                    Démarrer l'essai gratuit (14 jours) <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right : Visual */}
            <div className="hero-image relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="relative bg-slate-100 rounded-[48px] p-4 lg:p-8 transform rotate-3">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                  alt="FocusBoard Dashboard"
                  className="rounded-[32px] object-cover h-[450px] w-full object-top shadow-md transform -rotate-3"
                />
                {/* Floating element */}
                <div className="absolute -left-8 top-24 bg-white p-6 rounded-[24px] shadow-xl border-none transform rotate-[-6deg]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#EEF7F2] flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-[#2E8B57]" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Performance Index</p>
                      <p className="text-2xl font-black text-black">+12% cette semaine</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 2. PROBLEM & AGITATION */}
      <section className="py-24 sm:py-32 bg-black text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="fade-up text-4xl font-extrabold tracking-tight text-white mb-8 leading-tight">
            Vos équipes travaillent dur,<br />mais sur quoi exactement ?
          </h2>
          <p className="fade-up text-xl text-slate-400 mb-16 leading-relaxed max-w-3xl mx-auto font-medium">
            La plupart des outils de gestion de projet se transforment vite en cimetières de tâches illisibles. Résultat ? Vous passez des heures en réunions de synchronisation, vous jonglez entre trois logiciels, et à la fin du mois, vous n'avez <strong className="text-white">aucune métrique fiable</strong>.
          </p>

          <div className="stagger-grid grid sm:grid-cols-3 gap-6">
            <div className="stagger-item bg-slate-900 rounded-[32px] p-10">
              <EyeOff className="w-12 h-12 text-[#FFA07A] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Visibilité Zéro</h3>
              <p className="text-slate-400 font-medium">Impossible de savoir si le temps est alloué aux tâches à forte valeur ajoutée.</p>
            </div>
            <div className="stagger-item bg-slate-900 rounded-[32px] p-10">
              <AlertCircle className="w-12 h-12 text-[#FFD700] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Réunions Inutiles</h3>
              <p className="text-slate-400 font-medium">Des points de synchro épuisants juste pour savoir "qui fait quoi" aujourd'hui.</p>
            </div>
            <div className="stagger-item bg-slate-900 rounded-[32px] p-10">
              <BarChart3 className="w-12 h-12 text-[#98FF98] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">KPIs Inexistants</h3>
              <p className="text-slate-400 font-medium">Oubliez la rentabilité. La simple clôture d'un ticket ne reflète pas l'effort réel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 & 4. SOLUTION / HOW IT WORKS */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-black mb-8 leading-tight">
              Voici FocusBoard. <br />Le framework d'exécution.
            </h2>
            <p className="text-xl text-slate-700 font-medium leading-relaxed">
              Nous avons supprimé l'inutile pour nous concentrer sur la discipline. FocusBoard lie la gestion de projet robuste à une méthodologie de responsabilisation unique au monde, basée sur une devise simple : la prévisibilité d'abord.
            </p>
          </div>

          <div className="space-y-32">

            {/* Step 1 */}
            <div className="fade-up grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 bg-[#EEF7F2] p-8 sm:p-12 rounded-[48px]">
                <img src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=2000&auto=format&fit=crop" alt="Morning Check In" className="rounded-[32px] shadow-lg" />
              </div>
              <div className="order-1 lg:order-2">
                <div className="w-16 h-16 bg-[#2E8B57] text-white font-black text-3xl flex items-center justify-center rounded-full mb-8">1</div>
                <h3 className="text-4xl font-extrabold text-black mb-6">Le Morning Check-In</h3>
                <p className="text-xl text-slate-700 leading-relaxed font-medium">
                  Chaque matin, chaque équipier s'engage sur son ambition de la journée. Ils estiment eux-mêmes leur charge en sélectionnant précisément les points de valeur qu'ils comptent accomplir. <strong>Aucun travail fantôme.</strong>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="fade-up grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="w-16 h-16 bg-black text-white font-black text-3xl flex items-center justify-center rounded-full mb-8">2</div>
                <h3 className="text-4xl font-extrabold text-black mb-6">L'Exécution Disciplinée</h3>
                <p className="text-xl text-slate-700 leading-relaxed font-medium">
                  L'équipe collabore dans un espace centralisé (Tâches Kanban et Chat global lié). Lorsqu'une tâche est achevée, elle se valide instantanément en temps réel. Pas de double saisie dans d'autres fenêtres interminables.
                </p>
              </div>
              <div className="bg-slate-100 p-8 sm:p-12 rounded-[48px]">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop" alt="Kanban Execution" className="rounded-[32px] shadow-lg" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="fade-up grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 bg-[#FEF9E7] p-8 sm:p-12 rounded-[48px]">
                <img src="/gamification.png" alt="Gamification" className="rounded-[32px] shadow-lg object-cover h-[450px] w-full" />
              </div>
              <div className="order-1 lg:order-2">
                <div className="w-16 h-16 bg-[#DAA520] text-white font-black text-3xl flex items-center justify-center rounded-full mb-8">3</div>
                <h3 className="text-4xl font-extrabold text-black mb-6">Performance Index & Quêtes</h3>
                <p className="text-xl text-slate-700 leading-relaxed font-medium">
                  Fini le fliquage horaire désuet. FocusBoard calcule le <strong>PI</strong> (Points achevés / Points engagés). L'équipe est poussée vers l'excellence avec le « Bac à faire » : accomplissez des missions orphelines pour de gros bonus (+50%).
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. BENEFITS (Bento Grid) */}
      <section id="benefits" className="py-24 sm:py-32 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-black mb-8 leading-tight">
              Un QG unique pour remplacer la cacophonie.
            </h2>
            <p className="text-xl text-slate-700 font-medium leading-relaxed">
              Arrêtez de payer pour 5 outils différents. FocusBoard centralise toute la productivité et les données de votre PME avec une clarté absolue.
            </p>
          </div>

          <div className="stagger-grid grid lg:grid-cols-2 gap-8">
            {/* Bento Box 1 */}
            <div className="stagger-item bg-white rounded-[40px] p-10 sm:p-12 shadow-sm">
              <div className="w-16 h-16 bg-[#EEF7F2] rounded-full flex items-center justify-center mb-8">
                <BarChart3 className="w-8 h-8 text-[#2E8B57]" />
              </div>
              <h3 className="text-3xl font-extrabold text-black mb-4">Rapports Mensuels Exhaustifs</h3>
              <p className="text-lg text-slate-700 font-medium leading-relaxed">
                Ne devinez plus qui excelle. Obtenez instantanément les graphiques de performances individuelles et analysez sur quelles catégories de travail (Design, Vente, Dev) votre équipe brûle le plus de points.
              </p>
            </div>

            {/* Bento Box 2 */}
            <div className="stagger-item bg-white rounded-[40px] p-10 sm:p-12 shadow-sm">
              <div className="w-16 h-16 bg-[#FDFBF7] border border-[#EBE6E0] rounded-full flex items-center justify-center mb-8">
                <Database className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-3xl font-extrabold text-black mb-4">Data Center Privé</h3>
              <p className="text-lg text-slate-700 font-medium leading-relaxed">
                Débarrassez-vous de Google Drive et des excels volants. FocusBoard inclut un Data Center cloud privé structuré façon Airtable, éditable à la volée avec gestion poussée des privilèges (RBAC).
              </p>
            </div>

            {/* Bento Box 3 */}
            <div className="stagger-item bg-white rounded-[40px] p-10 sm:p-12 shadow-sm">
              <div className="w-16 h-16 bg-[#FEF9E7] rounded-full flex items-center justify-center mb-8">
                <MessageCircle className="w-8 h-8 text-[#DAA520]" />
              </div>
              <h3 className="text-3xl font-extrabold text-black mb-4">Messagerie & Équipes</h3>
              <p className="text-lg text-slate-700 font-medium leading-relaxed">
                Coupez les fenêtres Slack ou Teams. Vos équipes de projet disposent nativement de canaux de discussions sécurisés avec notifications (Bulle & Badge). L'information et la tâche sont enfin sur le même écran.
              </p>
            </div>

            {/* Bento Box 4 */}
            <div className="stagger-item bg-white rounded-[40px] p-10 sm:p-12 shadow-sm">
              <div className="w-16 h-16 bg-[#FCF0F3] rounded-full flex items-center justify-center mb-8">
                <Headset className="w-8 h-8 text-[#D87093]" />
              </div>
              <h3 className="text-3xl font-extrabold text-black mb-4">Support Interne (Billetterie)</h3>
              <p className="text-lg text-slate-700 font-medium leading-relaxed">
                L'ordinateur d'un employé plante ? Besoin de recruter ? Ouvrez un ticket interne. Fini la perte d'informations dans les e-mails. Résolution organisée par les managers via une vue "Split" ultra productiviste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5 PRICING */}
      <section id="pricing" className="py-24 sm:py-32 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center mb-20 max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black leading-tight mb-6">
              Des tarifs clairs, pensés pour vous.
            </h2>
            <p className="text-xl text-slate-700 font-medium">Choisissez le plan adapté à la taille de votre équipe.</p>
          </div>

          <div className="stagger-grid grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">

            {/* Basic */}
            <div className="stagger-item bg-white border border-[#EBE6E0] rounded-[40px] p-10 flex flex-col items-center text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Basic</h3>
              <p className="text-slate-500 font-medium mb-6">PME & petites équipes</p>
              <div className="text-5xl font-black text-black mb-1">3€</div>
              <p className="text-sm text-slate-500 font-medium mb-8">/utilisateur/mois</p>
              <ul className="text-left space-y-4 w-full mb-10 text-slate-700 flex-1 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-black" /> Morning Check-in</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-black" /> Messagerie simplifiée</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-black" /> Support communautaire</li>
              </ul>
              <Button className="w-full bg-[#FDFBF7] border border-[#EBE6E0] text-black hover:bg-slate-50 rounded-full py-6 font-bold">Commencer</Button>
            </div>

            {/* Pro */}
            <div className="stagger-item bg-black text-white rounded-[40px] p-10 flex flex-col items-center text-center shadow-xl transform lg:-translate-y-4">
              <div className="bg-[#FEF9E7] text-[#9A7D18] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">Le plus populaire</div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-slate-400 font-medium mb-6">PME structurées</p>
              <div className="text-5xl font-black text-white mb-1">8€</div>
              <p className="text-sm text-slate-400 font-medium mb-8">/utilisateur/mois</p>
              <ul className="text-left space-y-4 w-full mb-10 text-slate-300 flex-1 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#98FF98]" /> Tout le plan Basic</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#98FF98]" /> Index de Performance</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#98FF98]" /> Data Center (50 Go)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#98FF98]" /> Rapports Mensuels</li>
              </ul>
              <Button className="w-full bg-white text-black hover:bg-slate-200 rounded-full py-6 font-bold">Essai gratuit de 14j</Button>
            </div>

            {/* Analytics */}
            <div className="stagger-item bg-white border border-[#EBE6E0] rounded-[40px] p-10 flex flex-col items-center text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Analytics</h3>
              <p className="text-slate-500 font-medium mb-6">Orientées performance</p>
              <div className="text-5xl font-black text-black mb-1">15€</div>
              <p className="text-sm text-slate-500 font-medium mb-8">/utilisateur/mois</p>
              <ul className="text-left space-y-4 w-full mb-10 text-slate-700 flex-1 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-black" /> Tout le plan Pro</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-black" /> Bac à faire & Quêtes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-black" /> RBAC (Rôles Avancés)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-black" /> Support dédié 24/7</li>
              </ul>
              <Button className="w-full bg-[#FDFBF7] border border-[#EBE6E0] text-black hover:bg-slate-50 rounded-full py-6 font-bold">Commencer</Button>
            </div>

          </div>

          {/* Enterprise */}
          <div className="fade-up max-w-5xl mx-auto mt-8 bg-black rounded-[40px] p-10 md:p-12 flex flex-col md:flex-row items-center md:items-start justify-between text-center md:text-left text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

            <div className="relative z-10 md:pr-8 mb-8 md:mb-0">
              <div className="bg-white/10 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">Sur Mesure</div>
              <h3 className="text-3xl font-bold text-white mb-3">Licence Entreprise</h3>
              <p className="text-slate-300 font-medium text-lg mb-6 max-w-md">
                Déploiement à grande échelle avec un nombre d'utilisateurs sur mesure, une facturation annuelle et des avantages illimités.
              </p>
              <ul className="text-left space-y-3 w-full text-slate-300 font-medium grid sm:grid-cols-2 gap-x-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-white" /> Utilisateurs illimités</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-white" /> Data Center sans limite</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-white" /> Account Manager dédié</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-white" /> SLA garanti 99.9%</li>
              </ul>
            </div>

            <div className="relative z-10 flex flex-col items-center md:items-end flex-shrink-0 min-w-[200px]">
              <div className="text-5xl font-black text-white mb-2">Sur devis</div>
              <p className="text-sm text-slate-400 font-medium mb-8">Facturation annuelle</p>
              <Button className="w-full bg-white text-black hover:bg-slate-200 rounded-full py-6 font-bold text-lg">Contacter les ventes</Button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF */}
      <section className="py-24 sm:py-32 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center mb-20 max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black leading-tight">
              Des fondateurs et managers qui dorment enfin sur leurs deux oreilles.
            </h2>
          </div>

          <div className="stagger-grid grid lg:grid-cols-3 gap-8">
            <div className="stagger-item bg-[#FEF9E7] rounded-[40px] p-10 relative">
              <p className="text-xl text-black font-medium leading-relaxed mb-10">
                "Avant FocusBoard, je passais mon vendredi après-midi à traquer ce qui avait été livré. Aujourd'hui, avec le Performance Index, la rentabilité de l'agence a gagné en transparence dès le 1er mois."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-[#FEF9E7]">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marc" alt="avatar" />
                </div>
                <div>
                  <div className="font-extrabold text-black text-lg">Marc D.</div>
                  <div className="text-[#9A7D18] font-bold">CEO, Agence Digitale</div>
                </div>
              </div>
            </div>

            <div className="stagger-item bg-[#EEF7F2] rounded-[40px] p-10 relative">
              <p className="text-xl text-black font-medium leading-relaxed mb-10">
                "L'adoption par l'équipe produit a été instantanée. Le Morning Check-In est devenu notre rituel de 9h. Les tâches ne traînent plus pendant des semaines et il y a une vraie émulation avec le Bac à faire !"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-[#EEF7F2]">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie" alt="avatar" />
                </div>
                <div>
                  <div className="font-extrabold text-black text-lg">Sophie L.</div>
                  <div className="text-[#2E8B57] font-bold">Directrice Opérations</div>
                </div>
              </div>
            </div>

            <div className="stagger-item bg-[#FCF0F3] rounded-[40px] p-10 relative">
              <p className="text-xl text-black font-medium leading-relaxed mb-10">
                "Le couteau suisse absolu de la PME. On a dégagé Asana, Airtable et Discord. FocusBoard centralise le Data Center, les tickets internes et le projet. C'est l'outil qui responsabilise tout le monde."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-[#FCF0F3]">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Julien" alt="avatar" />
                </div>
                <div>
                  <div className="font-extrabold text-black text-lg">Julien P.</div>
                  <div className="text-[#D87093] font-bold">Fondateur Startup Tech</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="py-24 sm:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="fade-up text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black mb-6">Questions Fréquentes</h2>
            <p className="text-xl text-slate-700 font-medium">Tout ce que vous devez savoir avant de lancer votre équipe.</p>
          </div>

          <div className="stagger-grid space-y-6">
            <div className="stagger-item bg-[#FDFBF7] rounded-[32px] p-8 sm:p-10">
              <h3 className="text-2xl font-extrabold text-black mb-4">FocusBoard est-il un outil de "flicage" (time-tracking) ?</h3>
              <p className="text-lg text-slate-700 font-medium leading-relaxed">Absolument pas. Au contraire, FocusBoard prône les résultats plutôt que le temps de présence. L'évaluation s'effectue via un système de "Points d'effort" décidés collectivement. Cela favorise l'auto-discipline et donne énormément d'autonomie à chaque membre sans micro-management de leurs horaires.</p>
            </div>
            <div className="stagger-item bg-[#FDFBF7] rounded-[32px] p-8 sm:p-10">
              <h3 className="text-2xl font-extrabold text-black mb-4">L'adoption de l'outil est-elle compliquée pour l'équipe ?</h3>
              <p className="text-lg text-slate-700 font-medium leading-relaxed">Le design de FocusBoard (SaaS Premium) est pensé de manière ultra linéaire. Une fois le "Morning Check-In" pris en main la première matinée, l'équipe s'investira naturellement pour faire grimper son Index de Performance avec le système ludique de "Quêtes".</p>
            </div>
            <div className="stagger-item bg-[#FDFBF7] rounded-[32px] p-8 sm:p-10">
              <h3 className="text-2xl font-extrabold text-black mb-4">Est-ce adapté à mon type d'entreprise ?</h3>
              <p className="text-lg text-slate-700 font-medium leading-relaxed">Conçu spécifiquement pour la tranche des 5 à 50 collaborateurs. Si vous êtes une agence, une startup tech, une équipe commerciale back-office, ou que vous cherchez tout simplement à lier la liberté d'exécution à la responsabilité des résultats, c'est l'outil qu'il vous faut.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Premium CTA Section */}
      <section className="py-32 bg-black text-center">
        <div className="fade-up max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl md:text-[5.5rem] font-black tracking-tight text-white mb-8 leading-[1.05]">
            Reprenez le contrôle <br />sur l'exécution.
          </h2>
          <p className="text-2xl text-slate-300 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Amenez plus de clarté, de responsabilité et de résultats durables au sein de vos équipes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="bg-[#FDFBF7] hover:bg-white text-black rounded-full px-12 py-8 h-auto text-xl font-extrabold transition-transform hover:-translate-y-1 shadow-xl">
                Démarrer l'essai gratuit (14 jours)
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FDFBF7] py-16 border-t border-[#EBE6E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-bold text-white text-xl">
              <Target className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-black">FocusBoard</span>
          </div>
          <div className="text-base text-slate-500 font-medium text-center md:text-left">
            &copy; {new Date().getFullYear()} FocusBoard Inc. Le framework d'exécution.
          </div>
          <div className="flex gap-8 text-base font-bold text-slate-700">
            <a href="#" className="hover:text-black transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-black transition-colors">Conditions</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

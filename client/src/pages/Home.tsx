/*
 * Signal / Noise — Home Page
 * Design: Analytical instrument panel aesthetic
 * Dark navy background, luminous cyan accents, precision typography
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Activity, Target, TrendingUp, Zap, ChevronRight, BarChart3, Clock } from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663361461713/98UuH5CAArJboW7zFiG9Jf/hero-bg-mQnMxxC4o5u54FBjgrpBvR.webp";
const GAUGE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663361461713/98UuH5CAArJboW7zFiG9Jf/gauge-pattern-5rg4TUmaGwWpee8NdZ8Us2.webp";

const attributes = [
  { icon: Target, name: "Problem Framing", desc: "How you define problems before generating solutions" },
  { icon: Zap, name: "Architecture Selection", desc: "How you choose stacks, patterns, and approaches" },
  { icon: BarChart3, name: "Scope Discipline", desc: "How you manage what gets built vs. what doesn't" },
  { icon: Activity, name: "Iteration Methodology", desc: "How you identify, analyze, and fix problems" },
];

const tiers = [
  { level: 1, label: "Novice", signal: "Prompt → paste → ship", range: "8-13" },
  { level: 2, label: "Practitioner", signal: "Prompt → review → iterate", range: "14-19" },
  { level: 3, label: "Senior", signal: "Architect first, then prompt", range: "20-25" },
  { level: 4, label: "Principal", signal: "Shapes the paradigm", range: "26-32" },
];

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="relative z-10 container py-20">
          <div className="grid lg:grid-cols-[1fr_380px] gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono tracking-wider text-primary uppercase">
                  Diagnostic Instrument v1.0
                </span>
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                <span className="text-foreground">Calibrate Your</span>
                <br />
                <span className="text-primary glow-text-cyan">Vibe Coding</span>
                <br />
                <span className="text-foreground">Signal</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
                A structured self-assessment across 8 core competency attributes
                and 4 maturity tiers. Get your numeric benchmark, identify growth
                edges, and receive a personalized 30-60-90 day scaling plan with
                concrete projects.
              </p>

              <div className="flex flex-wrap gap-4 items-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/chat-assess")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-display text-base px-8 h-12"
                >
                  Start Interview Assessment
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/assess")}
                  className="font-display text-base px-6 h-12 border-primary/30 text-primary hover:bg-primary/10"
                >
                  Quick Self-Score
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                <Clock className="w-4 h-4" />
                <span className="font-mono">15-25 min</span>
                <span className="mx-2 text-border">|</span>
                <span className="font-mono">8 attributes</span>
                <span className="mx-2 text-border">|</span>
                <span className="font-mono">Score 8-32</span>
              </div>
            </motion.div>

            {/* Gauge illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="hidden lg:block"
            >
              <div className="relative">
                <img
                  src={GAUGE_IMG}
                  alt="Assessment gauge"
                  className="w-full rounded-xl opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent rounded-xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="font-display text-3xl font-bold mb-3">
              How the Instrument Works
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Read all four tier descriptions for each attribute, then select the
              tier that best matches your typical behavior across your last 3-5
              projects. Score yourself honestly — maturity is about reliable,
              repeatable behavior.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Assess", desc: "Score yourself 1-4 on each of 8 competency attributes" },
              { step: "02", title: "Calibrate", desc: "Get your composite maturity tier and attribute breakdown" },
              { step: "03", title: "Plan", desc: "Receive a personalized 30-60-90 day growth roadmap" },
              { step: "04", title: "Build", desc: "Execute concrete projects designed for your current level" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative"
              >
                <div className="instrument-border rounded-lg p-6 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 h-full">
                  <span className="font-mono text-xs text-primary/60 tracking-widest">
                    {item.step}
                  </span>
                  <h3 className="font-display text-xl font-semibold mt-2 mb-2 text-card-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Attributes Preview */}
      <section className="py-24 bg-card/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="font-display text-3xl font-bold mb-3">
              8 Competency Attributes
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Each attribute measures a distinct dimension of vibe coding maturity.
              Your score profile reveals both strengths to leverage and growth edges to develop.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {attributes.map((attr, i) => (
              <motion.div
                key={attr.name}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="instrument-border rounded-lg p-5 bg-card/50 backdrop-blur-sm flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <attr.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-card-foreground mb-1">
                    {attr.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{attr.desc}</p>
                </div>
              </motion.div>
            ))}
            {[
              { icon: TrendingUp, name: "Testing & Validation", desc: "How you verify that your system works correctly" },
              { icon: Activity, name: "Documentation & Artifacts", desc: "What you leave behind for others to understand your work" },
              { icon: Target, name: "Domain Grounding", desc: "How much domain expertise informs your technical decisions" },
              { icon: Zap, name: "Production Orientation", desc: "How ready your system is for use beyond your dev environment" },
            ].map((attr, i) => (
              <motion.div
                key={attr.name}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i + 4) * 0.1 }}
                className="instrument-border rounded-lg p-5 bg-card/50 backdrop-blur-sm flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <attr.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-card-foreground mb-1">
                    {attr.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{attr.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Overview */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="font-display text-3xl font-bold mb-3">
              Four Maturity Tiers
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Your composite score maps to one of four tiers, each representing a
              distinct level of vibe coding maturity with its own growth trajectory.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="instrument-border rounded-lg p-6 bg-card/50 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[2rem]" />
                <span className="font-mono text-4xl font-bold text-primary/20 group-hover:text-primary/30 transition-colors">
                  {tier.level}
                </span>
                <h3 className="font-display text-xl font-bold mt-2 text-card-foreground">
                  {tier.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  {tier.signal}
                </p>
                <div className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono">
                  Score {tier.range}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-card/30">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Ready to Calibrate?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              The interview assessment takes 15-25 minutes. Answer questions about
              a real project — your responses are evaluated against the rubric by AI.
              No self-labeling, no confirmation bias.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/chat-assess")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-display text-base px-10 h-12"
              >
                Start Interview Assessment
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/assess")}
                className="font-display text-base px-6 h-12 border-primary/30 text-primary hover:bg-primary/10"
              >
                Quick Self-Score
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-mono">
            Vibe Coder Self-Assessment Rubric: Option A (Attribute-Maturity Matrix), 2026
          </span>
          <span>Free to use, adapt, and share with attribution.</span>
        </div>
      </footer>
    </div>
  );
}

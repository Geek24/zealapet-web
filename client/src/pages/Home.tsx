import { Link } from "wouter";
import { ZealaPetLogoFull } from "@/components/ZealaPetLogo";
import { useTheme } from "@/components/ThemeProvider";
import {
  Heart, Shield, Clock, Car, Scissors, Dog, ChevronRight,
  BadgeCheck, CreditCard, CheckCircle2, AlertTriangle,
  MessageCircle, MapPin, Phone, Star, Sun, Moon, Menu, X, PawPrint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const SERVICE_CARDS = [
  { type: "wellness", icon: Heart, label: "Wellness Visit", price: "$150", desc: "Annual checkup with your local independent animal doc", color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" },
  { type: "vaccination", icon: Shield, label: "Vaccination", price: "$85", desc: "Core vaccines & boosters", color: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" },
  { type: "sick_visit", icon: AlertTriangle, label: "Sick Visit", price: "$120", desc: "For illness or injury concerns", color: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" },
  { type: "senior_care", icon: Clock, label: "Senior Care", price: "$175", desc: "Comprehensive senior wellness exam", color: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400" },
];

const ANCILLARY_SERVICES = [
  { icon: Car, label: "Pet Taxi", price: "From $35", desc: "Safe transport for your pet" },
  { icon: Scissors, label: "Grooming", price: "From $55", desc: "Bath, trim & full grooming" },
  { icon: Dog, label: "Dog Walking", price: "From $25", desc: "30 or 60 minute sessions" },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, title: "Verified Independent", desc: "Every animal doc is independently licensed and vetted in Maine" },
  { icon: MapPin, title: "Maine Local", desc: "Supporting independent veterinary professionals across Maine" },
  { icon: CreditCard, title: "Escrow Payment", desc: "Your payment is held securely until the visit is complete" },
  { icon: Phone, title: "Emergency Protocol", desc: "Immediate ER referral for critical symptoms — always prioritizing pet safety" },
];

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <ZealaPetLogoFull />
          
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection("services")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-services">Services</button>
            <button onClick={() => scrollToSection("how-it-works")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-how-it-works">How It Works</button>
            <button onClick={() => scrollToSection("trust")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-trust">Trust Center</button>
            <Link href="/pet-taxi">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="nav-pet-taxi">Pet Taxi</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Toggle theme"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/book">
              <Button size="sm" className="hidden sm:flex rounded-full font-semibold" data-testid="button-book-visit">
                Book a Visit
              </Button>
            </Link>
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
            <button onClick={() => scrollToSection("services")} className="block w-full text-left py-2 text-sm font-medium">Services</button>
            <button onClick={() => scrollToSection("how-it-works")} className="block w-full text-left py-2 text-sm font-medium">How It Works</button>
            <button onClick={() => scrollToSection("trust")} className="block w-full text-left py-2 text-sm font-medium">Trust Center</button>
            <Link href="/pet-taxi"><span className="block py-2 text-sm font-medium cursor-pointer">Pet Taxi</span></Link>
            <Link href="/book">
              <Button className="w-full rounded-full font-semibold mt-2" data-testid="button-book-visit-mobile">Book a Visit</Button>
            </Link>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-900" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                <BadgeCheck className="h-3 w-3 mr-1" /> Verified Independent
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                <MapPin className="h-3 w-3 mr-1" /> Maine Local
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                <CreditCard className="h-3 w-3 mr-1" /> Pay Only When Complete
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
              Your Local Independent Animal Doc, At Your Door
            </h1>
            <p className="text-base sm:text-lg text-white/85 mb-8 max-w-xl leading-relaxed">
              Book mobile veterinary visits with verified independent animal docs across Maine. AI-powered triage prepares your doc before they arrive.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/book">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 rounded-full font-semibold shadow-lg px-8" data-testid="button-hero-book">
                  Book a Visit <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-full font-semibold px-8"
                onClick={() => scrollToSection("how-it-works")}
                data-testid="button-hero-learn"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium mb-4">How It Works</Badge>
            <h2 className="text-xl font-bold tracking-tight">Three Simple Steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: MessageCircle, title: "Book & Chat with ZealaAI", desc: "Tell our AI triage assistant about your pet's needs. ZealaAI creates a Pre-Visit Brief for your animal doc." },
              { step: "2", icon: CreditCard, title: "Pay Upfront (Escrow)", desc: "Secure payment held in escrow. You only pay when the visit is complete and you're satisfied." },
              { step: "3", icon: Heart, title: "Animal Doc Arrives Prepared", desc: "Your local independent animal doc arrives with the Pre-Visit Brief — saving 15+ minutes of charting." },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium mb-4">Services</Badge>
            <h2 className="text-xl font-bold tracking-tight">Veterinary Services</h2>
            <p className="text-sm text-muted-foreground mt-2">Mobile visits from verified independent Maine animal docs</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICE_CARDS.map((service) => (
              <Link key={service.type} href="/book">
                <div className="group bg-card border border-card-border rounded-2xl p-5 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5" data-testid={`card-service-${service.type}`}>
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${service.color} mb-3`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-1">{service.label}</h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{service.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{service.price}</span>
                    <span className="text-xs text-muted-foreground">+ 15% platform fee</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Ancillary Services */}
          <div className="mt-12">
            <h3 className="text-center font-semibold mb-6">Additional Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ANCILLARY_SERVICES.map((service) => (
                <div key={service.label} className="bg-card border border-card-border rounded-2xl p-5 flex items-start gap-4" data-testid={`card-ancillary-${service.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <service.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{service.label}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{service.desc}</p>
                    <p className="text-sm font-bold text-primary mt-1">{service.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Center ─── */}
      <section id="trust" className="py-16 sm:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium mb-4">
              <Shield className="h-3 w-3 mr-1" /> Trust Center
            </Badge>
            <h2 className="text-xl font-bold tracking-tight">Alliance of Independent Maine Animal Docs</h2>
            <p className="text-sm text-muted-foreground mt-2">Your pet's safety and your trust are our highest priority</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="bg-card border border-card-border rounded-2xl p-5 text-center" data-testid={`card-trust-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-3">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Waiver Section ─── */}
      <section className="py-16 sm:py-20 bg-foreground text-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Shield className="h-10 w-10 mx-auto mb-4 opacity-60" />
          <h2 className="text-xl font-bold tracking-tight mb-3">Logistics Only Waiver</h2>
          <p className="text-sm opacity-70 mb-6 leading-relaxed max-w-lg mx-auto">
            ZealaPet provides logistics and scheduling services only. Medical care is provided exclusively by your independent veterinary contractor. By using our platform, you acknowledge this arrangement.
          </p>
          <Link href="/book">
            <Button variant="outline" className="border-background/30 text-background hover:bg-background/10 rounded-full font-semibold" data-testid="button-waiver-agree">
              <CheckCircle2 className="h-4 w-4 mr-2" /> I Understand — Book a Visit
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <ZealaPetLogoFull />
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                The "No-Software" mobile animal doc network for Maine. Connecting pet owners with verified independent veterinary professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Services</h4>
              <div className="space-y-2">
                <Link href="/book"><span className="block text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Book a Visit</span></Link>
                <Link href="/pet-taxi"><span className="block text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Pet Taxi</span></Link>
                <button onClick={() => scrollToSection("services")} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">All Services</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Information</h4>
              <div className="space-y-2">
                <button onClick={() => scrollToSection("trust")} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Trust Center</button>
                <button onClick={() => scrollToSection("how-it-works")} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">How It Works</button>
                <p className="text-xs text-muted-foreground">saltypaws.dog</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 ZealaPet. Logistics and scheduling only. Medical care provided by independent veterinary contractors.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ZealaPetLogoFull } from "@/components/ZealaPetLogo";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Heart, Shield, AlertTriangle, Clock, ArrowLeft, ArrowRight,
  Check, Sun, Moon, PawPrint, User, MapPin
} from "lucide-react";
import { SERVICE_PRICING, PLATFORM_FEE_RATE } from "@shared/schema";

const SERVICE_ICONS: Record<string, any> = {
  wellness: Heart,
  vaccination: Shield,
  sick_visit: AlertTriangle,
  senior_care: Clock,
  dental: Heart,
  behavioral: PawPrint,
};

type Step = "service" | "pet" | "owner" | "review";

export default function Book() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("service");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [serviceType, setServiceType] = useState("");
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const selectedService = serviceType ? SERVICE_PRICING[serviceType] : null;
  const servicePriceCents = selectedService?.priceCents || 0;
  const platformFeeCents = Math.round(servicePriceCents * PLATFORM_FEE_RATE);
  const totalCents = servicePriceCents + platformFeeCents;

  const steps: Step[] = ["service", "pet", "owner", "review"];
  const stepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case "service": return !!serviceType;
      case "pet": return petName.trim() !== "" && species !== "";
      case "owner": return ownerName.trim() !== "" && phone.trim() !== "" && address.trim() !== "";
      case "review": return true;
    }
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) setStep(steps[stepIndex + 1]);
  };
  const handleBack = () => {
    if (stepIndex > 0) setStep(steps[stepIndex - 1]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/bookings", {
        serviceType,
        ownerData: { name: ownerName, phone, email, address },
        petData: { name: petName, species, breed, ageYears: parseFloat(age) || 0, weightLbs: parseFloat(weight) || 0 },
        address,
      });
      const data = await res.json();
      toast({
        title: "Booking Confirmed!",
        description: `Booking #${data.data.booking.id} created for ${petName}. Total: $${(data.pricing.totalCents / 100).toFixed(2)}`,
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Booking Failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="cursor-pointer"><ZealaPetLogoFull /></span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted transition-colors" data-testid="button-theme-toggle-book">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-1 transition-colors ${
                  i < stepIndex ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step: Service */}
        {step === "service" && (
          <div>
            <h1 className="text-xl font-bold mb-1">Select a Service</h1>
            <p className="text-sm text-muted-foreground mb-6">Choose the type of visit for your pet</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(SERVICE_PRICING).map(([key, svc]) => {
                const Icon = SERVICE_ICONS[key] || Heart;
                const isSelected = serviceType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setServiceType(key)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-card-border bg-card hover:border-primary/30"
                    }`}
                    data-testid={`button-service-${key}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">{svc.label}</h3>
                          <span className="font-bold text-sm text-primary">${(svc.priceCents / 100).toFixed(0)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Pet Details */}
        {step === "pet" && (
          <div>
            <h1 className="text-xl font-bold mb-1">Pet Details</h1>
            <p className="text-sm text-muted-foreground mb-6">Tell us about your furry friend</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="petName">Pet Name *</Label>
                <Input id="petName" value={petName} onChange={e => setPetName(e.target.value)} placeholder="e.g., Maple" className="mt-1 rounded-xl" data-testid="input-pet-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="species">Species *</Label>
                  <Select value={species} onValueChange={setSpecies}>
                    <SelectTrigger className="mt-1 rounded-xl" data-testid="select-species">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="breed">Breed</Label>
                  <Input id="breed" value={breed} onChange={e => setBreed(e.target.value)} placeholder="e.g., Golden Retriever" className="mt-1 rounded-xl" data-testid="input-breed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age (years)</Label>
                  <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g., 4" className="mt-1 rounded-xl" data-testid="input-age" />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input id="weight" type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g., 65" className="mt-1 rounded-xl" data-testid="input-weight" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Owner Info */}
        {step === "owner" && (
          <div>
            <h1 className="text-xl font-bold mb-1">Your Information</h1>
            <p className="text-sm text-muted-foreground mb-6">We'll use this to coordinate your visit</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ownerName">Full Name *</Label>
                <Input id="ownerName" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g., Sarah Mitchell" className="mt-1 rounded-xl" data-testid="input-owner-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="207-555-0101" className="mt-1 rounded-xl" data-testid="input-phone" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" className="mt-1 rounded-xl" data-testid="input-email" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="45 Congress St, Portland, ME 04101" className="mt-1 rounded-xl" data-testid="input-address" />
              </div>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && selectedService && (
          <div>
            <h1 className="text-xl font-bold mb-1">Review Your Booking</h1>
            <p className="text-sm text-muted-foreground mb-6">Confirm the details below</p>

            <div className="space-y-4">
              <div className="bg-card border border-card-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <PawPrint className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{petName}</h3>
                    <p className="text-xs text-muted-foreground">{species}{breed ? ` · ${breed}` : ""}{age ? ` · ${age} yrs` : ""}{weight ? ` · ${weight} lbs` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{ownerName}</h3>
                    <p className="text-xs text-muted-foreground">{phone}{email ? ` · ${email}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Visit Location</h3>
                    <p className="text-xs text-muted-foreground">{address}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-card-border rounded-2xl p-5">
                <h3 className="font-semibold mb-3">Pricing Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{selectedService.label}</span>
                    <span>${(servicePriceCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform fee (15%)</span>
                    <span>${(platformFeeCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                    <span>Total (held in escrow)</span>
                    <span className="text-primary">${(totalCents / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Logistics Only Disclaimer:</strong> ZealaPet provides logistics and scheduling only. Medical care is provided by your independent veterinary contractor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <div>
            {stepIndex > 0 ? (
              <Button variant="outline" onClick={handleBack} className="rounded-full" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            ) : (
              <Link href="/">
                <Button variant="outline" className="rounded-full" data-testid="button-cancel">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </Link>
            )}
          </div>
          <div>
            {step === "review" ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-full font-semibold px-8"
                data-testid="button-confirm-booking"
              >
                {isSubmitting ? "Booking..." : "Confirm & Pay"} {!isSubmitting && <Check className="h-4 w-4 ml-2" />}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="rounded-full font-semibold px-8"
                data-testid="button-next"
              >
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { ZealaPetLogoFull } from "@/components/ZealaPetLogo";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Car, ArrowLeft, Sun, Moon, MapPin, DollarSign, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PetTaxi() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupAddress.trim() || !destinationAddress.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/pet-taxi", {
        ownerId: 1,
        pickupAddress,
        destinationAddress,
        bookingId: bookingId ? parseInt(bookingId) : null,
        estimatedCostCents: 3500,
        status: "requested",
      });
      await res.json();
      setSubmitted(true);
      toast({
        title: "Pet Taxi Requested!",
        description: "We'll match you with a driver shortly.",
      });
    } catch (err: any) {
      toast({
        title: "Request Failed",
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
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted transition-colors" data-testid="button-theme-toggle-taxi">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <Car className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Pet Taxi</h1>
          <p className="text-sm text-muted-foreground mt-1">Safe, comfortable transport for your pet</p>
        </div>

        {submitted ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-primary mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold mb-2">Request Submitted!</h2>
            <p className="text-sm text-muted-foreground mb-6">We'll match you with a pet-friendly driver shortly.</p>
            <Link href="/">
              <Button variant="outline" className="rounded-full" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-card border border-card-border rounded-2xl p-5 space-y-4">
              <div>
                <Label htmlFor="pickup" className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Pickup Address *
                </Label>
                <Input
                  id="pickup"
                  value={pickupAddress}
                  onChange={e => setPickupAddress(e.target.value)}
                  placeholder="45 Congress St, Portland, ME 04101"
                  className="mt-1.5 rounded-xl"
                  required
                  data-testid="input-pickup-address"
                />
              </div>
              <div>
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-red-500" /> Destination Address *
                </Label>
                <Input
                  id="destination"
                  value={destinationAddress}
                  onChange={e => setDestinationAddress(e.target.value)}
                  placeholder="Portland Veterinary Hospital, Portland, ME"
                  className="mt-1.5 rounded-xl"
                  required
                  data-testid="input-destination-address"
                />
              </div>
              <div>
                <Label htmlFor="bookingId">Booking ID (optional)</Label>
                <Input
                  id="bookingId"
                  value={bookingId}
                  onChange={e => setBookingId(e.target.value)}
                  placeholder="e.g., 12345"
                  className="mt-1.5 rounded-xl"
                  data-testid="input-booking-id"
                />
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Pricing
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base fare</span>
                  <span>$35.00</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Distance-based (calculated after)</span>
                  <span>TBD</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm font-bold">
                  <span>Minimum</span>
                  <span className="text-primary">$35.00</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Note:</strong> ZealaPet provides logistics only. Pet transport is provided by independent contractors.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" className="rounded-full" data-testid="button-cancel-taxi">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || !pickupAddress.trim() || !destinationAddress.trim()}
                className="flex-1 rounded-full font-semibold"
                data-testid="button-submit-taxi"
              >
                {isSubmitting ? "Submitting..." : "Request Pet Taxi"}
                {!isSubmitting && <Car className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* Obsidian Atelier: the app shell keeps the cinematic single-page journey and dark luxury theme consistent. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import { ContactPage, PrivacyPage, TermsPage } from "./pages/LegalPages";
import { SeoLandingPage } from "@/pages/SeoPages";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/services/ppf-riyadh"><SeoLandingPage slug="/services/ppf-riyadh" /></Route>
      <Route path="/services/full-body-ppf"><SeoLandingPage slug="/services/full-body-ppf" /></Route>
      <Route path="/services/auto-detailing-ppf"><SeoLandingPage slug="/services/auto-detailing-ppf" /></Route>
      <Route path="/ar/services/ppf-riyadh"><SeoLandingPage slug="/ar/services/ppf-riyadh" /></Route>
      <Route path="/ar/services/full-body-ppf"><SeoLandingPage slug="/ar/services/full-body-ppf" /></Route>
      <Route path="/blog/ppf-riyadh-guide"><SeoLandingPage slug="/blog/ppf-riyadh-guide" /></Route>
      <Route path="/blog/ppf-price-saudi-arabia"><SeoLandingPage slug="/blog/ppf-price-saudi-arabia" /></Route>
      <Route path="/blog/luxury-car-ppf"><SeoLandingPage slug="/blog/luxury-car-ppf" /></Route>
      <Route path="/ar/blog/ppf-riyadh-guide"><SeoLandingPage slug="/ar/blog/ppf-riyadh-guide" /></Route>
      <Route path="/ar/blog/ppf-price-saudi-arabia"><SeoLandingPage slug="/ar/blog/ppf-price-saudi-arabia" /></Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

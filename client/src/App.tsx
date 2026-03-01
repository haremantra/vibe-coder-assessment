import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import GrowthPlan from "./pages/GrowthPlan";
import ChatAssessment from "./pages/ChatAssessment";
import SharedResults from "./pages/SharedResults";
import History from "./pages/History";
import MilestoneTracker from "./pages/MilestoneTracker";
import CompareOverTime from "./pages/CompareOverTime";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/assess"} component={Assessment} />
      <Route path={"/chat-assess"} component={ChatAssessment} />
      <Route path={"/results"} component={Results} />
      <Route path={"/growth-plan"} component={GrowthPlan} />
      <Route path={"/share/:token"} component={SharedResults} />
      <Route path={"/history"} component={History} />
      <Route path={"/milestones"} component={MilestoneTracker} />
      <Route path={"/compare"} component={CompareOverTime} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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

export default App;

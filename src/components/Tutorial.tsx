import { useState, useEffect } from "react";
import { X, ArrowRight, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: "top" | "bottom" | "left" | "right";
  action?: string; // What the user should do
  route?: string; // Navigate to this route
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Open Builder! 👋",
    description: "Let's take a quick tour. We'll show you how to share your projects, connect with builders, and grow your network.",
    position: "bottom"
  },
  {
    id: "composer",
    title: "Share Your Progress 🚀",
    description: "Post build logs here! Share what you're working on, add images, and link to your projects.",
    target: ".composer-highlight",
    position: "bottom",
    action: "Try typing something here"
  },
  {
    id: "feed",
    title: "Discover Projects 🔥",
    description: "Your feed shows projects, build logs, and collab posts. Switch tabs to see trending work or follow builders.",
    target: ".feed-tabs",
    position: "bottom"
  },
  {
    id: "interactions",
    title: "Engage & Connect ❤️",
    description: "Like, comment, and save projects you love. Click on any card to see more details.",
    position: "top"
  },
  {
    id: "notifications",
    title: "Stay Updated 🔔",
    description: "Get notified when someone likes your work, comments, or sends a collab request.",
    target: ".notifications-icon",
    position: "bottom"
  },
  {
    id: "messages",
    title: "Direct Messages 💬",
    description: "Chat with other builders about collaborations and projects.",
    target: ".messages-icon",
    position: "bottom"
  },
  {
    id: "new-project",
    title: "Ship Full Projects 🎯",
    description: "Ready to showcase a complete project? Click here to create your first project post.",
    target: ".new-project-btn",
    position: "bottom",
    route: "/new"
  },
  {
    id: "profile",
    title: "Your Builder Profile 👤",
    description: "Edit your profile, showcase your tech stack, and set your collab status.",
    target: ".profile-menu",
    position: "left"
  },
  {
    id: "complete",
    title: "You're All Set! ✨",
    description: "Start building publicly, find your people, and ship insane things. Let's go!",
    position: "bottom"
  }
];

export function Tutorial() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true);
  const [manualStart, setManualStart] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user has completed tutorial
    const checkTutorial = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        const createdAt = new Date(profile.created_at);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        // Show tutorial if account is less than 1 hour old and hasn't been dismissed
        const tutorialDismissed = localStorage.getItem(`tutorial_dismissed_${user.id}`);

        if (hoursSinceCreation < 1 && !tutorialDismissed) {
          setHasCompletedTutorial(false);
          setTimeout(() => setIsActive(true), 1000); // Start after 1 second
        }
      }
    };

    checkTutorial();

    // Listen for manual tutorial start (from settings page)
    const handleStorageChange = () => {
      const shouldStart = localStorage.getItem(`tutorial_start_${user.id}`);
      if (shouldStart === 'true') {
        localStorage.removeItem(`tutorial_start_${user.id}`);
        setManualStart(true);
        setHasCompletedTutorial(false);
        setIsActive(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Check immediately in case it was set in same window
    handleStorageChange();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);

      // Navigate if step has a route
      const step = TUTORIAL_STEPS[currentStep + 1];
      if (step.route) {
        window.location.hash = step.route;
      }
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    if (user) {
      localStorage.setItem(`tutorial_dismissed_${user.id}`, "true");
    }
    setIsActive(false);
    setHasCompletedTutorial(true);
  };

  const restartTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  if (!isActive || hasCompletedTutorial) {
    // Show a subtle button to restart tutorial
    return user && !hasCompletedTutorial ? (
      <button
        onClick={restartTutorial}
        className="fixed bottom-4 right-4 z-40 brutal-btn brutal-btn-ghost text-xs"
      >
        <Sparkles className="w-3 h-3" /> Tutorial
      </button>
    ) : null;
  }

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // Get target element position if specified
  const getTargetPosition = () => {
    if (!step.target) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const element = document.querySelector(step.target);
    if (!element) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const rect = element.getBoundingClientRect();
    const position = step.position || "bottom";

    switch (position) {
      case "top":
        return {
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translate(-50%, -100%)"
        };
      case "bottom":
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translate(-50%, 0)"
        };
      case "left":
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 20}px`,
          transform: "translate(-100%, -50%)"
        };
      case "right":
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: "translate(0, -50%)"
        };
      default:
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translate(-50%, 0)"
        };
    }
  };

  const tooltipPosition = getTargetPosition();

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in" />

      {/* Highlight target element */}
      {step.target && (
        <div
          className="fixed z-40 pointer-events-none animate-pulse"
          style={{
            ...(() => {
              const element = document.querySelector(step.target);
              if (!element) return {};
              const rect = element.getBoundingClientRect();
              return {
                top: `${rect.top - 4}px`,
                left: `${rect.left - 4}px`,
                width: `${rect.width + 8}px`,
                height: `${rect.height + 8}px`,
                border: "4px solid var(--primary)",
                borderRadius: "4px",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)"
              };
            })()
          }}
        />
      )}

      {/* Tutorial tooltip */}
      <div
        className="fixed z-50 w-full max-w-sm px-4 animate-in slide-in-from-bottom"
        style={{
          ...tooltipPosition,
          ...(window.innerWidth < 640 ? {
            top: "auto",
            bottom: "20px",
            left: "50%",
            transform: "translate(-50%, 0)"
          } : {})
        }}
      >
        <div className="brutal-card bg-card p-6 relative">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={skipTutorial}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="pr-8">
            <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

            {step.action && (
              <div className="mt-3 px-3 py-2 bg-primary/10 border-2 border-primary/30 rounded-none">
                <p className="text-xs font-mono text-primary">👉 {step.action}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-white/10">
            <div className="text-xs font-mono text-muted-foreground">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="brutal-btn brutal-btn-ghost text-xs"
                >
                  Back
                </button>
              )}

              <button
                onClick={nextStep}
                className="brutal-btn text-xs flex items-center gap-2"
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? (
                  <>
                    <Check className="w-4 h-4" /> Get Started
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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
    title: "Welcome to Open Builder",
    description: "Let's take a quick tour to help you get started. We'll show you how to share projects, connect with builders, and grow your network.",
    position: "bottom"
  },
  {
    id: "composer",
    title: "Share Your Progress",
    description: "Post build logs here to share what you're working on. Add images and link to your projects.",
    target: ".composer-highlight",
    position: "bottom",
    action: "Type something in the composer to continue"
  },
  {
    id: "feed",
    title: "Discover Projects",
    description: "Your feed shows projects, build logs, and collab posts. Switch tabs to see trending work or follow specific builders.",
    target: ".feed-tabs",
    position: "bottom"
  },
  {
    id: "interactions",
    title: "Engage and Connect",
    description: "Like, comment, and save projects you find interesting. Click on any card to see full details and engage with the community.",
    position: "top"
  },
  {
    id: "notifications",
    title: "Stay Updated",
    description: "Get notified when someone likes your work, comments on your posts, or sends you a collab request.",
    target: ".notifications-icon",
    position: "bottom"
  },
  {
    id: "messages",
    title: "Direct Messages",
    description: "Chat directly with other builders to discuss collaborations and projects.",
    target: ".messages-icon",
    position: "bottom"
  },
  {
    id: "new-project",
    title: "Ship Full Projects",
    description: "Ready to showcase a complete project? Click here to create a detailed project post with images, description, and links.",
    target: ".new-project-btn",
    position: "bottom",
    route: "/new"
  },
  {
    id: "profile",
    title: "Your Builder Profile",
    description: "Edit your profile to showcase your tech stack, skills, and set your collaboration status.",
    target: ".profile-menu",
    position: "left"
  },
  {
    id: "complete",
    title: "You're All Set",
    description: "Start building publicly, connect with other builders, and ship amazing projects. Good luck!",
    position: "bottom"
  }
];

export function Tutorial() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true);
  const [manualStart, setManualStart] = useState(false);
  const [canProceed, setCanProceed] = useState(true); // Can always proceed by default
  const [highlightPosition, setHighlightPosition] = useState<any>({});
  const [tooltipPosition, setTooltipPosition] = useState<any>({});

  // Update positions on scroll and resize
  useEffect(() => {
    const updatePositions = () => {
      const step = TUTORIAL_STEPS[currentStep];
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });

          // Calculate tooltip position with smart positioning
          const position = step.position || "bottom";
          let tooltipPos: any = {};
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          const tooltipHeight = 400; // Approximate tooltip height
          const tooltipWidth = viewportWidth < 640 ? viewportWidth - 32 : 576; // max-w-xl

          // Check if there's enough space below
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;
          const spaceLeft = rect.left;
          const spaceRight = viewportWidth - rect.right;

          // Smart positioning - use position that has most space
          let finalPosition = position;
          if (position === "bottom" && spaceBelow < tooltipHeight && spaceAbove > spaceBelow) {
            finalPosition = "top";
          } else if (position === "top" && spaceAbove < tooltipHeight && spaceBelow > spaceAbove) {
            finalPosition = "bottom";
          } else if (position === "left" && spaceLeft < tooltipWidth && spaceRight > spaceLeft) {
            finalPosition = "right";
          } else if (position === "right" && spaceRight < tooltipWidth && spaceLeft > spaceRight) {
            finalPosition = "left";
          }

          // For profile menu (usually at bottom), always show above
          if (step.id === "profile" || rect.bottom + tooltipHeight > viewportHeight + window.scrollY) {
            finalPosition = "top";
          }

          switch (finalPosition) {
            case "top":
              tooltipPos = {
                top: rect.top + window.scrollY - 20,
                left: rect.left + window.scrollX + rect.width / 2,
                transform: "translate(-50%, -100%)"
              };
              break;
            case "bottom":
              tooltipPos = {
                top: rect.bottom + window.scrollY + 20,
                left: rect.left + window.scrollX + rect.width / 2,
                transform: "translate(-50%, 0)"
              };
              break;
            case "left":
              tooltipPos = {
                top: rect.top + window.scrollY + rect.height / 2,
                left: rect.left + window.scrollX - 20,
                transform: "translate(-100%, -50%)"
              };
              break;
            case "right":
              tooltipPos = {
                top: rect.top + window.scrollY + rect.height / 2,
                left: rect.right + window.scrollX + 20,
                transform: "translate(0, -50%)"
              };
              break;
            default:
              tooltipPos = {
                top: rect.bottom + window.scrollY + 20,
                left: rect.left + window.scrollX + rect.width / 2,
                transform: "translate(-50%, 0)"
              };
          }

          // Ensure tooltip stays within viewport bounds
          const tooltipLeft = tooltipPos.transform.includes('translate(-50%')
            ? tooltipPos.left - tooltipWidth / 2
            : tooltipPos.left;

          if (tooltipLeft < 16) {
            tooltipPos.left = tooltipWidth / 2 + 16;
          } else if (tooltipLeft + tooltipWidth > viewportWidth - 16) {
            tooltipPos.left = viewportWidth - tooltipWidth / 2 - 16;
          }

          setTooltipPosition(tooltipPos);
        }
      } else {
        // Center tooltip when no target
        setTooltipPosition({
          position: 'fixed',
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        });
      }
    };

    if (isActive) {
      updatePositions();
      window.addEventListener('scroll', updatePositions);
      window.addEventListener('resize', updatePositions);

      return () => {
        window.removeEventListener('scroll', updatePositions);
        window.removeEventListener('resize', updatePositions);
      };
    }
  }, [isActive, currentStep]);

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

  // Check if user can proceed based on current step
  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];

    if (step.id === "composer") {
      // Check if composer has text
      const checkComposer = () => {
        const composer = document.querySelector('.composer-highlight textarea');
        if (composer && (composer as HTMLTextAreaElement).value.trim().length > 0) {
          setCanProceed(true);
        } else {
          setCanProceed(false);
        }
      };

      // Check immediately
      checkComposer();

      // Listen for input changes
      const composer = document.querySelector('.composer-highlight textarea');
      if (composer) {
        composer.addEventListener('input', checkComposer);
        return () => composer.removeEventListener('input', checkComposer);
      }
    } else {
      // All other steps can proceed immediately
      setCanProceed(true);
    }
  }, [currentStep, isActive]);

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setCanProceed(true); // Reset for next step

      // Navigate if step has a route
      const step = TUTORIAL_STEPS[currentStep + 1];
      if (step.route) {
        window.location.hash = step.route;
      }
    } else {
      completeTutorial();
    }
  };

  const skipCurrentStep = () => {
    // Just skip to next step, don't exit tutorial
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setCanProceed(true);
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    // Exit entire tutorial
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

  return (
    <>
      {/* Dark backdrop - everything except highlighted element */}
      <div className="fixed inset-0 bg-black/70 z-40 animate-in fade-in pointer-events-none" />

      {/* Spotlight cutout for highlighted element - scrolls with page */}
      {step.target && highlightPosition.width && (
        <>
          {/* Bright highlight overlay on target */}
          <div
            className="absolute z-45 pointer-events-none transition-all duration-200"
            style={{
              top: `${highlightPosition.top}px`,
              left: `${highlightPosition.left}px`,
              width: `${highlightPosition.width}px`,
              height: `${highlightPosition.height}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
              borderRadius: '4px'
            }}
          />
          {/* Animated border around target */}
          <div
            className="absolute z-50 pointer-events-none transition-all duration-200"
            style={{
              top: `${highlightPosition.top - 4}px`,
              left: `${highlightPosition.left - 4}px`,
              width: `${highlightPosition.width + 8}px`,
              height: `${highlightPosition.height + 8}px`,
              border: "3px solid var(--primary)",
              borderRadius: "6px",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
            }}
          />
        </>
      )}

      {/* Tutorial tooltip - scrolls with page */}
      <div
        className="absolute z-50 w-full px-4 animate-in slide-in-from-bottom"
        style={{
          maxWidth: window.innerWidth < 640 ? 'calc(100% - 2rem)' : '36rem',
          ...(window.innerWidth < 640 ? {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translate(-50%, 0)'
          } : tooltipPosition.position === 'fixed' ? {
            position: 'fixed',
            ...tooltipPosition
          } : {
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: tooltipPosition.transform
          })
        }}
      >
        <div className="brutal-card bg-card p-8 relative shadow-2xl">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={skipTutorial}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Exit tutorial"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="pr-8">
            <h3 className="font-display font-bold text-2xl mb-3">{step.title}</h3>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">{step.description}</p>

            {step.action && (
              <div className="mt-4 px-4 py-3 bg-primary/10 border-2 border-primary/30 rounded-none">
                <p className="text-sm font-mono text-primary flex items-start gap-2">
                  <span className="text-lg">→</span>
                  <span>{step.action}</span>
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-white/10">
            <div className="flex items-center gap-4">
              <div className="text-sm font-mono text-muted-foreground">
                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </div>
              <button
                onClick={skipCurrentStep}
                className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Skip this step
              </button>
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="brutal-btn brutal-btn-ghost"
                >
                  Back
                </button>
              )}

              <button
                onClick={nextStep}
                disabled={!canProceed}
                className="brutal-btn flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? (
                  <>
                    <Check className="w-4 h-4" /> Get Started
                  </>
                ) : !canProceed ? (
                  <>Complete Action</>
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

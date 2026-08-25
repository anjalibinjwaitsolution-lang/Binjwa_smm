import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

async function getPlans() {
  try {
    const res = await fetch(`${API_URL}/plans/public`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch plans:", e);
    return [];
  }
}

export async function LandingPricing() {
  const backendPlans = await getPlans();
  
  const plans = backendPlans.map((p: any) => {
    const features = [];
    if (p.limits) {
      if (p.limits.maxAccounts > 0) features.push(`${p.limits.maxAccounts.toLocaleString()} social accounts`);
      else features.push("Unlimited social accounts");

      if (p.limits.maxPostsPerMonth > 0) features.push(`${p.limits.maxPostsPerMonth.toLocaleString()} posts / month`);
      else features.push("Unlimited posts (fair use)");

      if (p.limits.aiCredits > 0) features.push(`${p.limits.aiCredits.toLocaleString()} AI credits`);
      if (p.limits.aiImageGenerations > 0) features.push(`${p.limits.aiImageGenerations.toLocaleString()} AI images / month`);
      if (p.limits.storageLimitMB > 0) features.push(`${p.limits.storageLimitMB.toLocaleString()} MB storage`);
    }

    if (p.enabledFeatures?.includes('REPORTS') || p.enabledFeatures?.includes('EXPORT_REPORTS')) features.push("White-label reports");
    if (p.enabledFeatures?.includes('AI_CONTENT') || p.enabledFeatures?.includes('AI_CAPTION')) features.push("AI Content & Captions");
    if (p.enabledFeatures?.includes('DASHBOARD')) features.push("Unified inbox + analytics");

    let period = "";
    if (p.durationDays === 30) period = "/ month";
    else if (p.durationDays === 90) period = "/ quarter";
    else if (p.durationDays === 180) period = "/ 6 months";
    else if (p.durationDays === 365) period = "/ year";
    else period = `/ ${p.durationDays} days`;

    return {
      name: p.name,
      price: `$${p.price}`,
      period,
      subtext: p.subtext || "",
      badge: p.badge || "",
      features,
      cta: p.cta || "Get Started",
      highlighted: p.highlighted || false,
      bestValue: p.bestValue || false
    };
  });

  if (plans.length === 0) {
    return null;
  }
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Three plans.{" "}
            <span className="text-[#F16522]">Same team-friendly promise.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan: any) => (
            <div
              key={plan.name}
              className={`group relative flex flex-col h-full rounded-3xl p-8 shadow-xl transition-transform duration-300 hover:-translate-y-1 ${
                plan.highlighted
                  ? "bg-[#111] border-2 border-[#F16522] shadow-[0_0_40px_rgba(241,101,34,0.2)] scale-[1.02] z-10"
                  : "bg-[#111] border border-white/10"
              }`}
            >
              {/* Border Draw SVG for non-highlighted cards */}
              {!plan.highlighted && (
                <div className="absolute inset-0 pointer-events-none z-10 rounded-3xl overflow-hidden">
                  <svg className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
                    <rect
                      x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="24" ry="24"
                      fill="none"
                      stroke="#F16522"
                      strokeWidth="2"
                      pathLength="100"
                      strokeDasharray="100 100"
                      className="[stroke-dashoffset:100] group-hover:[stroke-dashoffset:0] transition-all duration-[2500ms] ease-in-out"
                    />
                  </svg>
                </div>
              )}

              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-[#F16522] text-white px-5 py-1.5 rounded-full text-xs font-bold tracking-widest shadow-lg uppercase">
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col relative z-20">
                {/* Plan Name */}
                <div className="text-center mb-6">
                  <h3
                    className={`text-xl font-bold tracking-widest mb-4 uppercase ${
                      plan.highlighted ? "text-[#F16522]" : "text-white"
                    }`}
                  >
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span
                      className={`text-6xl font-bold ${
                        plan.highlighted ? "text-[#F16522]" : "text-white"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-white/50 text-lg">{plan.period}</span>
                  </div>

                  {/* Subtext */}
                  <p
                    className={`text-sm italic ${
                      plan.highlighted
                        ? "text-[#F16522]/80"
                        : plan.bestValue
                        ? "text-green-400"
                        : "text-green-400"
                    }`}
                  >
                    {plan.subtext}
                  </p>
                </div>

                <div className="border-t border-white/10 my-4" />

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature: any) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-white/70 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="relative z-20 mt-auto">
                <Button
                  className={`w-full h-13 rounded-xl text-base font-semibold transition-all duration-300 active:scale-95 ${
                    plan.highlighted
                      ? "bg-[#F16522] text-white hover:bg-[#E05A1A] hover:shadow-[0_0_25px_rgba(241,101,34,0.5)] border-0"
                      : "bg-white text-gray-900 hover:bg-[#F16522] hover:text-white hover:shadow-[0_0_25px_rgba(241,101,34,0.5)] border-0"
                  }`}
                  asChild
                >
                  <Link href={`/onboarding/register?plan=${encodeURIComponent(plan.name)}`}>{plan.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-white/40 text-sm">
            Need a custom plan?{" "}
            <Link href="#" className="text-[#F16522] hover:underline font-medium">
              Contact Sales →
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

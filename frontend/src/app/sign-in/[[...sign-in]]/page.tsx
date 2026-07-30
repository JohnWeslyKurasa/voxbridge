import { SignIn } from "@clerk/nextjs";

/**
 * Sign In Page with Clerk integration
 * 
 * Why it is needed:
 * - Directs users to log in securely using Clerk authentication.
 */
export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-brand-bg px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative gradient glowing backgrounds */}
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-300/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full bg-purple-300/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 flex flex-col items-center">
        <SignIn
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: "glass-card border border-[#F2E8DC] shadow-2xl rounded-[20px] p-2 bg-white",
              headerTitle: "text-[#2B1B1B] font-extrabold text-xl",
              headerSubtitle: "text-[#7A6B6B] text-xs",
              socialButtonsBlockButton: "border-[#F2E8DC] text-[#2B1B1B] hover:bg-[#FFF8F0] font-bold rounded-xl",
              formButtonPrimary: "bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] text-white font-bold rounded-xl shadow-md",
              formFieldLabel: "text-xs font-bold text-[#7A6B6B] uppercase tracking-wider",
              formFieldInput: "glass-input rounded-xl text-sm border-[#F2E8DC]",
              footerActionLink: "text-[#7B1E3A] hover:text-[#A23B5A] font-bold",
            },
          }}
        />
      </div>
    </div>
  );
}

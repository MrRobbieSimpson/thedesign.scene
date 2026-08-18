import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-16">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border border-border/70 bg-card",
          },
        }}
      />
    </div>
  );
}

// src/app/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="w-full bg-black text-white py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
        {/* Left: Logo or Name */}
        <div className="flex items-center gap-2">
          <img src="/assets/SHWordsOnlyWhite.svg" alt="Logo" className="h-10 w-auto" />
          {/* <span>© {new Date().getFullYear()} SmashHaus. All rights reserved.</span> */}
        </div>

        {/* Right: Links or Socials */}
        <div className="flex gap-4">
          {/* <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms</a>
          <a href="mailto:contact@smashhaus.com" className="hover:underline">Contact</a> */}
          <img src="/assets/Socials.svg" alt="Socials" className="h-10 w-auto" />
        </div>
      </div>
    </footer>
  );
}
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 text-center bg-black text-white">
      <img src="/assets/SmashHausIconBlack.svg" alt="SmashHaus" className="" />

      <div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Amplify Your Music. Get Heard.
        </h1>
        <p className="text-lg max-w-xl mx-auto text-gray-300">
          SmashHaus connects artists with real listeners to get authentic reviews and feedback — powered by AI and human insight.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <a href="/payer/dashboard" className="bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-200">
          I'm an Artist
        </a>
        <a href="/worker/dashboard" className="border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-black">
          I'm a Listener
        </a>
      </div>
    </main>
  );
}
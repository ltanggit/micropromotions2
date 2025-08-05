export default function UploadPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🎵 Upload a Track</h1>
        <form className="space-y-6">
        <div>
            <label className="block text-sm font-medium mb-1">Track Title</label>
            <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="e.g. New York Summer" />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Track Link</label>
            <input type="url" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="https://soundcloud.com/..." />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="pop, summer, chill" />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1"># of Reviewers</label>
            <input type="number" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="10" />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1">Genre</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option>Select a genre</option>
            <option>Pop</option>
            <option>Hip-Hop</option>
            <option>Electronic</option>
            <option>Indie</option>
            <option>Jazz</option>
            </select>
        </div>

        <div className="flex justify-between pt-4">
            <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Back</button>
            <button type="submit" className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800">Next</button>
        </div>
        </form>

    </main>
  );
}
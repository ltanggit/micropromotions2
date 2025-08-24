// frontend/src/types/spotify-web-playback.d.ts
// make this a module so it doesn't pollute the global scope incorrectly
export {};

declare global {
  interface Window {
    /** Called by Spotify’s script when the SDK is ready */
    onSpotifyWebPlaybackSDKReady?: () => void;

    /** Spotify SDK is attached here once the script loads */
    Spotify?: any; // or a more specific type if you prefer
  }
}

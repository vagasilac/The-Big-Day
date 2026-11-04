/** Browser preview stores everything in localStorage. Unset or "firebase" uses Cloud Firestore. */
export function isLocalMode(): boolean {
  return process.env.NEXT_PUBLIC_DATA_MODE === 'local';
}

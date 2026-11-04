import { storage } from '@/lib/firebase-config';
import { getDownloadURL, ref, uploadBytesResumable } from '@/lib/backend/storage';

export async function uploadImage(path: string, file: File): Promise<string> {
  const fileRef = ref(storage, path);
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, file);
    task.on('state_changed', () => undefined, reject, () => resolve());
  });
  return getDownloadURL(fileRef);
}

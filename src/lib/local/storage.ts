import { loadStore, notifyStore, persistStore } from './shared';

export interface LocalStorageRef {
  path: string;
  _url?: string;
}

export function ref(_storage: unknown, path: string): LocalStorageRef {
  return { path };
}

function readBlob(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function downscaleImage(file: Blob, maxEdge = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not process image'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    image.src = url;
  });
}

async function fileToStoredUrl(file: Blob): Promise<string> {
  if (typeof document !== 'undefined' && file.type.startsWith('image/')) {
    try {
      return await downscaleImage(file);
    } catch {
      return readBlob(file);
    }
  }
  return readBlob(file);
}

export function uploadBytesResumable(fileRef: LocalStorageRef, file: Blob) {
  const task = {
    snapshot: {
      ref: fileRef,
      bytesTransferred: 0,
      totalBytes: file.size,
    },
    on(
      _event: string,
      _progress?: (snapshot: { bytesTransferred: number; totalBytes: number }) => void,
      onError?: (error: Error) => void,
      onComplete?: () => void,
    ) {
      fileToStoredUrl(file)
        .then((url) => {
          const store = loadStore();
          store.files[fileRef.path] = url;
          fileRef._url = url;
          persistStore();
          notifyStore();
          task.snapshot.bytesTransferred = file.size;
          onComplete?.();
        })
        .catch((error) => onError?.(error instanceof Error ? error : new Error(String(error))));
      return () => undefined;
    },
  };
  return task;
}

export async function getDownloadURL(fileRef: LocalStorageRef): Promise<string> {
  if (fileRef._url) return fileRef._url;
  const store = loadStore();
  const byPath = store.files[fileRef.path];
  if (byPath) return byPath;
  const byUrl = Object.values(store.files).find((url) => url === fileRef.path);
  if (byUrl) return byUrl;
  if (fileRef.path.startsWith('data:') || fileRef.path.startsWith('http') || fileRef.path.startsWith('blob:')) {
    return fileRef.path;
  }
  throw new Error('File not found in this browser.');
}

export async function deleteObject(fileRef: LocalStorageRef) {
  const store = loadStore();
  if (store.files[fileRef.path]) {
    delete store.files[fileRef.path];
  } else {
    for (const [path, url] of Object.entries(store.files)) {
      if (url === fileRef.path) delete store.files[path];
    }
  }
  persistStore();
  notifyStore();
}

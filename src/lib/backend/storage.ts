import { isLocalMode } from '@/lib/data-mode';
import * as local from '@/lib/local/storage';
import {
  deleteObject as remoteDelete,
  getDownloadURL as remoteGetUrl,
  ref as remoteRef,
  uploadBytesResumable as remoteUpload,
} from 'firebase/storage';

export const ref = ((...args: never[]) => (isLocalMode() ? local.ref : remoteRef)(...args)) as typeof remoteRef;
export const uploadBytesResumable = ((...args: never[]) =>
  (isLocalMode() ? local.uploadBytesResumable : remoteUpload)(...args)) as typeof remoteUpload;
export const getDownloadURL = ((...args: never[]) =>
  (isLocalMode() ? local.getDownloadURL : remoteGetUrl)(...args)) as typeof remoteGetUrl;
export const deleteObject = ((...args: never[]) =>
  (isLocalMode() ? local.deleteObject : remoteDelete)(...args)) as typeof remoteDelete;

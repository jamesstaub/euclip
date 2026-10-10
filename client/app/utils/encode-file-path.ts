// Percent-encode each segment of a file path (folders/file names can contain
// '#', '?', '%', '+', spaces...) while keeping the '/' separators.
export default function encodeFilePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

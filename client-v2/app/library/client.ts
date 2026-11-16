/**
 * The sound library: everything Euclip offers, on the server. This module is the only thing that knows
 * how it is asked for; the rest of the app sees folders, files and search results. It reads the v1 API
 * (the Rails app's `/v1/files`), which a later `/v2` would replace here and nowhere else.
 *
 * What v1 gives:
 *   GET {api}/files/{path}             the folder at `path` (each part URL-encoded): its sub-folders and
 *                                      audio files by name, and the same for each of its ancestors
 *   GET {api}/files/search?q=&page=    files whose path contains `q`, grouped by top-level folder, 500 to
 *                                      a page, pages counted from 0. It does not say how many there are:
 *                                      a full page means there may be another.
 * and the audio itself is at {audio}{path} in a storage bucket.
 *
 * Read-only and public: nothing of the person's is sent.
 */

export interface LibraryConfig {
  /** where the API is: `/v1` on the app's own origin, or a full URL */
  api: string;
  /** where the audio files are: a folder URL that a file's path is added to */
  audio: string;
}

export interface LibraryFile {
  /** the file's name: `110KIK.mp3` */
  name: string;
  /** its path in the library, from the root, parts not encoded: `/Boss DR110/110KIK.mp3` */
  path: string;
}

export interface LibraryFolder {
  /** `/` for the root; otherwise it begins and ends with a slash: `/Roland/Roland TR-808/` */
  path: string;
  /** the names of its sub-folders */
  folders: string[];
  files: LibraryFile[];
}

export interface LibrarySearch {
  query: string;
  page: number;
  files: LibraryFile[];
  /** the page was full: there may be more on the next */
  more: boolean;
}

/** How many results v1 puts on a page of a search. */
export const SEARCH_PAGE_SIZE = 500;

/** The library could not be read: said to the person as it is. */
export class LibraryError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'LibraryError';
  }
}

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

/** A library path with each part encoded for a URL, slashes kept. */
export function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

/** `/a/b/` from `a/b`, `/a/b` or `/a/b/`; `/` from nothing. */
export function folderPath(path: string): string {
  const parts = path.split('/').filter((part) => part !== '');
  return parts.length === 0 ? '/' : `/${parts.join('/')}/`;
}

/** The folder a folder is in; null for the root. */
export function parentOf(path: string): string | null {
  const parts = path.split('/').filter((part) => part !== '');
  if (parts.length === 0) return null;
  return folderPath(parts.slice(0, -1).join('/'));
}

/** The names from the root to a folder: `['Roland', 'Roland TR-808']`. */
export function crumbsOf(path: string): string[] {
  return path.split('/').filter((part) => part !== '');
}

const trimEnd = (text: string): string => text.replace(/\/+$/, '');

export class LibraryClient {
  #config: LibraryConfig;
  #fetch: Fetch;
  /** Folders already read: the library does not change under a session. */
  #folders = new Map<string, Promise<LibraryFolder>>();

  constructor(config: LibraryConfig, fetcher?: Fetch) {
    this.#config = config;
    this.#fetch = fetcher ?? ((url, init) => fetch(url, init));
  }

  /** Where a file's audio is fetched from. */
  audioUrl(path: string): string {
    return `${trimEnd(this.#config.audio)}${encodePath(path.startsWith('/') ? path : `/${path}`)}`;
  }

  /** A folder's contents. Asked for once; a failure is not remembered. */
  folder(path: string): Promise<LibraryFolder> {
    const key = folderPath(path);
    const known = this.#folders.get(key);
    if (known) return known;
    const reading = this.#read(key).catch((error: unknown) => {
      this.#folders.delete(key);
      throw error;
    });
    this.#folders.set(key, reading);
    return reading;
  }

  async #read(path: string): Promise<LibraryFolder> {
    const at = path === '/' ? '/' : trimEnd(path);
    const data = await this.#json(
      `${trimEnd(this.#config.api)}/files${encodePath(at)}`,
    );
    // (a folder that is not there answers 200 with `{}` or `{ error }`, or 404)
    if (!isRecord(data) || !Array.isArray(data['dirs'])) {
      throw new LibraryError(`There is no folder ${path} in the library.`, 404);
    }
    return {
      path,
      folders: strings(data['dirs']),
      files: strings(data['audio']).map((name) => ({
        name,
        path: `${path}${name}`,
      })),
    };
  }

  /** Files whose path contains the query. Pages are counted from 0. */
  async search(
    query: string,
    page = 0,
    signal?: AbortSignal,
  ): Promise<LibrarySearch> {
    const data = await this.#json(
      `${trimEnd(this.#config.api)}/files/search?q=${encodeURIComponent(query)}&page=${page}`,
      signal,
    );
    const groups =
      isRecord(data) && Array.isArray(data['results']) ? data['results'] : [];
    const files: LibraryFile[] = [];
    for (const group of groups) {
      if (!isRecord(group) || !Array.isArray(group['files'])) continue;
      for (const file of group['files']) {
        if (
          isRecord(file) &&
          typeof file['path'] === 'string' &&
          typeof file['filename'] === 'string'
        ) {
          files.push({ name: file['filename'], path: file['path'] });
        }
      }
    }
    return { query, page, files, more: files.length >= SEARCH_PAGE_SIZE };
  }

  async #json(url: string, signal?: AbortSignal): Promise<unknown> {
    let response: Response;
    try {
      response = await this.#fetch(url, {
        headers: { Accept: 'application/json' },
        ...(signal ? { signal } : {}),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      throw new LibraryError(
        'The sound library could not be reached. Check the connection and try again.',
      );
    }
    if (response.status === 404) {
      throw new LibraryError('That is not in the library.', 404);
    }
    if (!response.ok) {
      throw new LibraryError(
        `The sound library answered with an error (${response.status}).`,
        response.status,
      );
    }
    try {
      return (await response.json()) as unknown;
    } catch {
      throw new LibraryError('The sound library sent something unreadable.');
    }
  }
}

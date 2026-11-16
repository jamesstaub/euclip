/**
 * What the v1 library API answers, recorded from https://www.euclip.app/v1 (2026-11): real shapes and
 * real names, cut down. Tests read these; nothing in a test touches the network.
 */

/** GET /v1/files/ */
export const ROOT = {
  ancestor_tree: [
    {
      dirs: ['505, 707 & 727', 'Boss DR110', 'Roland', 'WAV drumloops'],
      audio: [],
      img: [],
      currentSelection: '',
      path: '/',
    },
  ],
  dirs: ['505, 707 & 727', 'Boss DR110', 'Roland', 'WAV drumloops'],
  audio: [],
  img: [],
  currentSelection: '',
  path: '/',
};

/** GET /v1/files/Boss%20DR110 */
export const BOSS_DR110 = {
  ancestor_tree: [
    {
      dirs: ['505, 707 & 727', 'Boss DR110', 'Roland', 'WAV drumloops'],
      audio: [],
      img: [],
      currentSelection: 'Boss DR110',
      path: '/',
    },
    {
      dirs: ['DR-110 (2)'],
      audio: ['110CHH.mp3', '110CYM.mp3', '110KIK.mp3', '110OHH.mp3'],
      img: ['folder.JPG'],
      currentSelection: '',
      path: '/Boss DR110/',
    },
  ],
  dirs: ['DR-110 (2)'],
  audio: ['110CHH.mp3', '110CYM.mp3', '110KIK.mp3', '110OHH.mp3'],
  img: ['folder.JPG'],
  currentSelection: '',
  path: '/Boss DR110/',
};

/** GET /v1/files/Roland%20TR-808 (a folder that is not at the root): 200, with no folder in it */
export const NOT_A_FOLDER = { error: 'not found' };

/** GET /v1/files/search?q=808&page=0 */
export const SEARCH_808 = {
  results: [
    {
      folder: 'Roland',
      files: [
        {
          filename: 'TR808SN3.mp3',
          path: '/Roland/Roland TR-808/TR-808 Kit 02/TR808SN3.mp3',
        },
        {
          filename: 'cl_hihat.mp3',
          path: '/Roland/Roland TR-808/TR-808 Kit 03/cl_hihat.mp3',
        },
      ],
    },
    {
      folder: 'Ace Tone Rhythm Ace',
      files: [
        { filename: 'KICK3.mp3', path: '/Ace Tone Rhythm Ace/KICK3.mp3' },
      ],
    },
  ],
};

/** GET /v1/files/search?q=zzzz&page=0 */
export const SEARCH_NOTHING = { results: [] };

/** A fetch that answers from a table of URL to JSON (or a status), and notes what was asked. */
export function fakeFetch(
  table: Record<string, unknown>,
  asked: string[] = [],
): (url: string) => Promise<Response> {
  return (url) => {
    asked.push(url);
    if (!(url in table)) {
      return Promise.resolve(new Response('', { status: 404 }));
    }
    const answer = table[url];
    if (typeof answer === 'number') {
      return Promise.resolve(new Response('', { status: answer }));
    }
    if (answer instanceof Error) return Promise.reject(answer);
    return Promise.resolve(
      new Response(JSON.stringify(answer), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
}

export interface Example {
  name: string;
  midi?: string;
  mp3?: string;
  image?: string;
}

export interface Chapter {
  name: string;
  examples: Example[];
}

export interface Book {
  name: string;
  baseUrl: string;
  chapters: Chapter[];
}

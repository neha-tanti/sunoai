import { z } from 'zod';

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_CALL_SECONDS = 30 * 60;
export const MAX_CALL_LANGUAGES = 3;
export const UPLOAD_TOKEN_REUSE_MS = 110 * 60 * 1000;

const MIME_BY_EXTENSION: Record<string, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  opus: 'audio/opus',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  webm: 'video/webm',
  amr: 'audio/amr',
};

export const ACCEPTED_EXTENSIONS = Object.keys(MIME_BY_EXTENSION);

const extensionOf = (fileName: string) =>
  fileName.split('.').pop()?.toLowerCase() ?? '';

export function mimeTypeFor(fileName: string): string | undefined {
  return MIME_BY_EXTENSION[extensionOf(fileName)];
}

export const CALL_LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'en-IN', label: 'English' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
] as const;

export const COACHING_LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'hi-en', label: 'Hinglish' },
  { code: 'en-IN', label: 'English' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'pa-IN', label: 'Punjabi' },
] as const;

type LanguageCode<T extends readonly { code: string }[]> = T[number]['code'];

export type CoachingLanguageCode = LanguageCode<typeof COACHING_LANGUAGES>;

export const HINGLISH = 'hi-en' satisfies CoachingLanguageCode;

const codes = <T extends readonly { code: string }[]>(languages: T) =>
  languages.map((language) => language.code) as [
    LanguageCode<T>,
    ...LanguageCode<T>[],
  ];

export const createCallSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    file_name: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .refine((name) => mimeTypeFor(name) !== undefined),
    file_size: z.number().int().min(1).max(MAX_FILE_BYTES),
    call_langs: z
      .array(z.enum(codes(CALL_LANGUAGES)))
      .min(1)
      .max(MAX_CALL_LANGUAGES)
      .refine((langs) => new Set(langs).size === langs.length),
    coaching_lang: z.enum(codes(COACHING_LANGUAGES)),
    denoise: z.boolean().default(true),
  })
  .transform((call) => {
    const extension = extensionOf(call.file_name);
    return { ...call, extension, mime_type: MIME_BY_EXTENSION[extension] };
  });

export type CreateCall = z.input<typeof createCallSchema>;

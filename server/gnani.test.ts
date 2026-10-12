import { describe, expect, it } from 'vitest';
import { parseGnaniTranscript } from './gnani';
import { hinglishTranscript } from './test/gnani-stub';

describe('parseGnaniTranscript', () => {
  it('numbers segments in time order, because Gnani gives every segment id 0', () => {
    const transcript = hinglishTranscript();
    transcript.segments.reverse();

    const { segments } = parseGnaniTranscript(transcript);

    expect(segments.map((segment) => segment.segment_id)).toEqual([0, 1, 2, 3]);
    expect(segments[0].text).toMatch(/^Namaste/);
    expect(segments[3].text).toMatch(/insaan se baat/);
  });

  it('keeps the language Gnani identified', () => {
    const parsed = parseGnaniTranscript(
      hinglishTranscript({ language_code: 'en-IN' }),
    );

    expect(parsed.language).toBe('en-IN');
  });

  it('drops segments with no words', () => {
    const transcript = hinglishTranscript();
    transcript.segments[1].text = '   ';

    const { segments } = parseGnaniTranscript(transcript);

    expect(segments).toHaveLength(3);
    expect(segments.every((segment) => segment.text.trim() !== '')).toBe(true);
  });

  it('throws when the transcript has no segments list', () => {
    expect(() =>
      parseGnaniTranscript({ language_code: 'hi-IN', duration_seconds: 5 }),
    ).toThrow(/segments/);
  });
});

import {
  createReadStream,
} from 'node:fs';
import {
  createInterface,
} from 'node:readline';

type DatasetLine = {
  lineNumber: number;
  value: unknown;
};

function looksLikeAnime(
  value: unknown,
): boolean {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof record.title ===
      'string' &&
    Array.isArray(
      record.sources,
    )
  );
}

async function* streamAnimeDataset(
  filePath: string,
): AsyncGenerator<DatasetLine> {
  const input =
    createReadStream(
      filePath,
      {
        encoding: 'utf8',
      },
    );

  const lines =
    createInterface({
      input,
      crlfDelay: Infinity,
    });

  let lineNumber = 0;
  let firstContentSeen = false;

  for await (
    const rawLine of lines
  ) {
    lineNumber += 1;

    const line =
      rawLine.trim();

    if (!line) {
      continue;
    }

    let value: unknown;

    try {
      value =
        JSON.parse(line);
    } catch {
      throw new Error(
        `Invalid JSON at dataset line ${lineNumber}.`,
      );
    }

    if (!firstContentSeen) {
      firstContentSeen =
        true;

      if (
        !looksLikeAnime(
          value,
        )
      ) {
        // JSONL line 1 is dataset metadata.
        continue;
      }
    }

    yield {
      lineNumber,
      value,
    };
  }
}

export {
  streamAnimeDataset,
};
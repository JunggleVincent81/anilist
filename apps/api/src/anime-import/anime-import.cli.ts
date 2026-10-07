import {
  resolve,
} from 'node:path';

import {
  NestFactory,
} from '@nestjs/core';

import {
  AnimeImportModule,
} from './anime-import.module.js';

import {
  AnimeImportService,
} from './anime-import.service.js';

type CliOptions = {
  file: string | null;
  limit?: number;
  dryRun: boolean;
  skipRelations: boolean;
};

function parseArguments(
  args: string[],
): CliOptions {
  const options:
    CliOptions = {
      file: null,
      dryRun: false,
      skipRelations: false,
    };

    for (
      let index = 0;
      index < args.length;
      index += 1
    ) {
      const argument =
        args[index];

      if (argument === '--') {
        continue;
      }

      if (
        argument === '--file'
      ) {
        const file =
          args[index + 1];

        if (!file) {
          throw new Error(
            '--file requires a path.',
          );
        }

        options.file = file;
        index += 1;

        continue;
      }

    if (
      argument === '--limit'
    ) {
      const rawLimit =
        args[index + 1];

      const limit =
        Number(rawLimit);

      if (
        !Number.isInteger(
          limit,
        ) ||
        limit <= 0
      ) {
        throw new Error(
          '--limit must be a positive integer.',
        );
      }

      options.limit =
        limit;

      index += 1;

      continue;
    }

    if (
      argument === '--dry-run'
    ) {
      options.dryRun = true;
      continue;
    }

    if (
      argument ===
      '--skip-relations'
    ) {
      options.skipRelations =
        true;

      continue;
    }

    throw new Error(
      `Unknown argument: ${argument}`,
    );
  }

  if (!options.file) {
    throw new Error(
      'Usage: anime-import --file <dataset.jsonl> [--limit N] [--dry-run] [--skip-relations]',
    );
  }

  return options;
}

async function main() {
  const cli =
    parseArguments(
      process.argv.slice(2),
    );

  const app =
    await NestFactory
      .createApplicationContext(
        AnimeImportModule,
        {
          logger: [
            'log',
            'warn',
            'error',
          ],
        },
      );

  try {
    const importer =
      app.get(
        AnimeImportService,
      );

    const stats =
      await importer.importFile(
        resolve(cli.file!),
        {
          limit: cli.limit,

          dryRun:
            cli.dryRun,

          skipRelations:
            cli.skipRelations,
        },
      );

    console.log(
      JSON.stringify(
        stats,
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);

  process.exitCode = 1;
});
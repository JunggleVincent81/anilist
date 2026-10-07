const GRAPHQL_URL =
  process.env.GRAPHQL_URL ??
  "http://localhost:4000/graphql";

const TEST_IDENTIFIER =
  process.env.TEST_IDENTIFIER;

const TEST_PASSWORD =
  process.env.TEST_PASSWORD;

const ANIME_SLUG =
  process.env.TRACKING_SMOKE_SLUG ??
  "boruto-jump-festa-2016-special";

if (
  !TEST_IDENTIFIER ||
  !TEST_PASSWORD
) {
  console.error(
    [
      "",
      "Missing test credentials.",
      "",
      "Set:",
      "  TEST_IDENTIFIER",
      "  TEST_PASSWORD",
      "",
      "Use a development/test account.",
      "",
    ].join("\n"),
  );

  process.exit(2);
}

function assert(
  condition,
  message,
) {
  if (!condition) {
    throw new Error(message);
  }
}

async function graphql(
  query,
  variables = {},
  cookie = null,
) {
  const headers = {
    "content-type":
      "application/json",
  };

  if (cookie) {
    headers.cookie =
      cookie;
  }

  const response =
    await fetch(
      GRAPHQL_URL,
      {
        method: "POST",

        headers,

        body:
          JSON.stringify({
            query,
            variables,
          }),
      },
    );

  const payload =
    await response.json();

  return {
    response,
    payload,
  };
}

function expectNoErrors(
  result,
  label,
) {
  if (
    result.payload.errors
      ?.length
  ) {
    throw new Error(
      `${label}: ${JSON.stringify(
        result.payload.errors,
      )}`,
    );
  }

  assert(
    result.payload.data,
    `${label}: response has no data.`,
  );

  return result.payload.data;
}

function expectErrorCode(
  result,
  code,
  label,
) {
  const received =
    result.payload.errors?.[0]
      ?.extensions?.code;

  assert(
    received === code,
    `${label}: expected ${code}, received ${
      received ?? "no error code"
    }.`,
  );
}

const ANIME_QUERY = `
  query SmokeAnime(
    $slug: String!
  ) {
    animeBySlug(
      slug: $slug
    ) {
      id
      slug
      title
      episodes
    }
  }
`;

const LOGIN_MUTATION = `
  mutation SmokeLogin(
    $input: LoginInput!
  ) {
    login(
      input: $input
    ) {
      user {
        id
        username
      }
    }
  }
`;

const LOGOUT_MUTATION = `
  mutation SmokeLogout {
    logout
  }
`;

const MY_ENTRY_QUERY = `
  query SmokeMyEntry(
    $animeId: ID!
  ) {
    myAnimeListEntry(
      animeId: $animeId
    ) {
      id
      status
      progressEpisodes
      score
      rewatchCount

      anime {
        id
        slug
        episodes
      }
    }
  }
`;

const UPSERT_MUTATION = `
  mutation SmokeUpsert(
    $input:
      UpsertAnimeListEntryInput!
  ) {
    upsertAnimeListEntry(
      input: $input
    ) {
      id

      status
      progressEpisodes
      score
      rewatchCount

      startedAt
      completedAt

      anime {
        id
        slug
        episodes
      }
    }
  }
`;

const REMOVE_MUTATION = `
  mutation SmokeRemove(
    $animeId: ID!
  ) {
    removeAnimeListEntry(
      animeId: $animeId
    )
  }
`;

const PUBLIC_LIST_QUERY = `
  query SmokePublicList(
    $input:
      AnimeListQueryInput!
  ) {
    animeList(
      input: $input
    ) {
      username

      entries {
        id

        status
        progressEpisodes
        score
        rewatchCount

        anime {
          id
          slug
          title
          episodes
        }
      }

      pageInfo {
        page
        perPage
        total
        pageCount
      }
    }
  }
`;

console.log(
  "AN-083 Phase 6 tracking smoke test",
);

console.log(
  `GraphQL: ${GRAPHQL_URL}`,
);

console.log(
  `Anime:   ${ANIME_SLUG}`,
);

console.log(
  "\n[1/10] Resolve public anime",
);

const animeResult =
  await graphql(
    ANIME_QUERY,
    {
      slug:
        ANIME_SLUG,
    },
  );

const animeData =
  expectNoErrors(
    animeResult,
    "Public anime query",
  );

const anime =
  animeData.animeBySlug;

assert(
  anime,
  `Anime not found: ${ANIME_SLUG}`,
);

assert(
  anime.episodes !==
    null &&
    anime.episodes > 0,
  "Smoke anime must have a known positive episode count.",
);

console.log(
  `✓ ${anime.title} (${anime.id})`,
);

console.log(
  "\n[2/10] Private query rejects anonymous user",
);

const anonymousMine =
  await graphql(
    MY_ENTRY_QUERY,
    {
      animeId:
        anime.id,
    },
  );

expectErrorCode(
  anonymousMine,
  "UNAUTHENTICATED",
  "Anonymous private query",
);

console.log(
  "✓ UNAUTHENTICATED",
);

console.log(
  "\n[3/10] Login",
);

const loginResult =
  await graphql(
    LOGIN_MUTATION,
    {
      input: {
        identifier:
          TEST_IDENTIFIER,

        password:
          TEST_PASSWORD,
      },
    },
  );

const loginData =
  expectNoErrors(
    loginResult,
    "Login",
  );

const user =
  loginData.login.user;

const setCookies =
  typeof loginResult.response
    .headers.getSetCookie ===
  "function"
    ? loginResult.response
        .headers
        .getSetCookie()
    : [];

const setCookie =
  setCookies[0] ??
  loginResult.response
    .headers
    .get("set-cookie");

assert(
  setCookie,
  "Login did not return a session cookie.",
);

const cookie =
  setCookie
    .split(
      ";",
      1,
    )[0];

console.log(
  `✓ @${user.username}`,
);

let createdBySmoke =
  false;

try {
  console.log(
    "\n[4/10] Ensure smoke anime is not already tracked",
  );

  const existingResult =
    await graphql(
      MY_ENTRY_QUERY,
      {
        animeId:
          anime.id,
      },
      cookie,
    );

  const existingData =
    expectNoErrors(
      existingResult,
      "Existing entry query",
    );

  assert(
    existingData
      .myAnimeListEntry ===
      null,
    [
      `@${user.username} already tracks ${ANIME_SLUG}.`,
      "",
      "Choose another INCLUDED anime that is not already",
      "in this test account's list:",
      "",
      "  export TRACKING_SMOKE_SLUG='another-slug'",
      "",
    ].join("\n"),
  );

  console.log(
    "✓ no existing entry",
  );

  console.log(
    "\n[5/10] Create WATCHING entry",
  );

  const watchingResult =
    await graphql(
      UPSERT_MUTATION,
      {
        input: {
          animeId:
            anime.id,

          status:
            "WATCHING",

          progressEpisodes:
            0,

          score:
            8.5,
        },
      },
      cookie,
    );

  const watchingData =
    expectNoErrors(
      watchingResult,
      "Create WATCHING entry",
    );

  createdBySmoke =
    true;

  const watching =
    watchingData
      .upsertAnimeListEntry;

  assert(
    watching.status ===
      "WATCHING",
    "Expected WATCHING status.",
  );

  assert(
    watching.progressEpisodes ===
      0,
    "Expected progress 0.",
  );

  assert(
    watching.score ===
      8.5,
    "Expected score 8.5.",
  );

  assert(
    watching.startedAt,
    "WATCHING should set startedAt.",
  );

  console.log(
    "✓ WATCHING / progress 0 / score 8.5",
  );

  console.log(
    "\n[6/10] Update episode progress",
  );

  const progressResult =
    await graphql(
      UPSERT_MUTATION,
      {
        input: {
          animeId:
            anime.id,

          progressEpisodes:
            1,
        },
      },
      cookie,
    );

  const progressData =
    expectNoErrors(
      progressResult,
      "Update progress",
    );

  assert(
    progressData
      .upsertAnimeListEntry
      .progressEpisodes ===
      1,
    "Expected progress 1.",
  );

  assert(
    progressData
      .upsertAnimeListEntry
      .status ===
      "WATCHING",
    "Progress-only update must preserve status.",
  );

  assert(
    progressData
      .upsertAnimeListEntry
      .score ===
      8.5,
    "Progress-only update must preserve score.",
  );

  console.log(
    "✓ progress updated without losing status/score",
  );

  console.log(
    "\n[7/10] Complete anime",
  );

  const completedResult =
    await graphql(
      UPSERT_MUTATION,
      {
        input: {
          animeId:
            anime.id,

          status:
            "COMPLETED",
        },
      },
      cookie,
    );

  const completedData =
    expectNoErrors(
      completedResult,
      "Complete anime",
    );

  const completed =
    completedData
      .upsertAnimeListEntry;

  assert(
    completed.status ===
      "COMPLETED",
    "Expected COMPLETED status.",
  );

  assert(
    completed.progressEpisodes ===
      anime.episodes,
    `Expected progress ${anime.episodes} after completion.`,
  );

  assert(
    completed.rewatchCount ===
      0,
    "First completion must not increment rewatch count.",
  );

  assert(
    completed.completedAt,
    "Completion should set completedAt.",
  );

  console.log(
    `✓ COMPLETED / ${anime.episodes}/${anime.episodes}`,
  );

  console.log(
    "\n[8/10] Rewatch transition",
  );

  const rewatchResult =
    await graphql(
      UPSERT_MUTATION,
      {
        input: {
          animeId:
            anime.id,

          status:
            "REWATCHING",
        },
      },
      cookie,
    );

  const rewatchData =
    expectNoErrors(
      rewatchResult,
      "Start rewatch",
    );

  const rewatch =
    rewatchData
      .upsertAnimeListEntry;

  assert(
    rewatch.status ===
      "REWATCHING",
    "Expected REWATCHING status.",
  );

  assert(
    rewatch.progressEpisodes ===
      0,
    "Entering REWATCHING without progress must reset progress to 0.",
  );

  assert(
    rewatch.rewatchCount ===
      0,
    "Starting a rewatch must not increment rewatchCount.",
  );

  const recompletedResult =
    await graphql(
      UPSERT_MUTATION,
      {
        input: {
          animeId:
            anime.id,

          status:
            "COMPLETED",
        },
      },
      cookie,
    );

  const recompletedData =
    expectNoErrors(
      recompletedResult,
      "Finish rewatch",
    );

  const recompleted =
    recompletedData
      .upsertAnimeListEntry;

  assert(
    recompleted.rewatchCount ===
      1,
    "REWATCHING -> COMPLETED must increment rewatchCount.",
  );

  assert(
    recompleted.progressEpisodes ===
      anime.episodes,
    "Rewatch completion must force total episode progress.",
  );

  console.log(
    "✓ rewatchCount incremented to 1",
  );

  console.log(
    "\n[9/10] Public list exposes completed entry without authentication",
  );

  const publicListResult =
    await graphql(
      PUBLIC_LIST_QUERY,
      {
        input: {
          username:
            user.username,

          status:
            "COMPLETED",

          page:
            1,

          perPage:
            20,
        },
      },
    );

  const publicListData =
    expectNoErrors(
      publicListResult,
      "Public anime list",
    );

  const publicList =
    publicListData
      .animeList;

  assert(
    publicList,
    "Public anime list returned null.",
  );

  const publicEntry =
    publicList.entries.find(
      (entry) =>
        entry.anime.id ===
        anime.id,
    );

  assert(
    publicEntry,
    "Smoke entry was not visible in public list.",
  );

  assert(
    publicEntry.status ===
      "COMPLETED",
    "Public list returned incorrect status.",
  );

  assert(
    publicEntry.rewatchCount ===
      1,
    "Public list returned incorrect rewatchCount.",
  );

  console.log(
    "✓ public list contains tracking entry",
  );

  console.log(
    "\n[10/10] Cleanup + logout + revoked session",
  );

  const removeResult =
    await graphql(
      REMOVE_MUTATION,
      {
        animeId:
          anime.id,
      },
      cookie,
    );

  const removeData =
    expectNoErrors(
      removeResult,
      "Remove smoke entry",
    );

  assert(
    removeData
      .removeAnimeListEntry ===
      true,
    "Cleanup failed to remove smoke entry.",
  );

  createdBySmoke =
    false;

  const removedCheckResult =
    await graphql(
      MY_ENTRY_QUERY,
      {
        animeId:
          anime.id,
      },
      cookie,
    );

  const removedCheckData =
    expectNoErrors(
      removedCheckResult,
      "Verify cleanup",
    );

  assert(
    removedCheckData
      .myAnimeListEntry ===
      null,
    "Entry still exists after cleanup.",
  );

  const logoutResult =
    await graphql(
      LOGOUT_MUTATION,
      {},
      cookie,
    );

  const logoutData =
    expectNoErrors(
      logoutResult,
      "Logout",
    );

  assert(
    logoutData.logout ===
      true,
    "Logout returned false.",
  );

  const afterLogout =
    await graphql(
      MY_ENTRY_QUERY,
      {
        animeId:
          anime.id,
      },
      cookie,
    );

  expectErrorCode(
    afterLogout,
    "UNAUTHENTICATED",
    "Revoked session query",
  );

  console.log(
    "✓ cleanup complete and session revoked",
  );

  console.log(
    "\n========================================",
  );

  console.log(
    "AN-083 TRACKING SMOKE: PASS",
  );

  console.log(
    "========================================\n",
  );
} catch (error) {
  if (createdBySmoke) {
    console.error(
      "\nSmoke failed; attempting cleanup...",
    );

    try {
      await graphql(
        REMOVE_MUTATION,
        {
          animeId:
            anime.id,
        },
        cookie,
      );

      console.error(
        "Cleanup attempted.",
      );
    } catch (
      cleanupError
    ) {
      console.error(
        "Cleanup also failed:",
        cleanupError,
      );
    }
  }

  try {
    await graphql(
      LOGOUT_MUTATION,
      {},
      cookie,
    );
  } catch {
    // Best-effort logout.
  }

  throw error;
}

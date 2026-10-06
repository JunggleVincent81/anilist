type GraphQLErrorItem = {
  message: string;
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLErrorItem[];
};

export class GraphQLRequestError extends Error {
  readonly code: string | undefined;
  readonly errors: GraphQLErrorItem[];

  constructor(
    message: string,
    errors: GraphQLErrorItem[] = [],
  ) {
    super(message);

    this.name = 'GraphQLRequestError';
    this.errors = errors;
    this.code =
      errors[0]?.extensions?.code;
  }
}

function getGraphQLEndpoint(): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not configured.',
    );
  }

  return `${apiUrl.replace(/\/$/, '')}/graphql`;
}

async function graphqlRequest<
  TData,
  TVariables = Record<string, never>,
>(
  query: string,
  variables?: TVariables,
): Promise<TData> {
  const response = await fetch(
    getGraphQLEndpoint(),
    {
      method: 'POST',

      headers: {
        'content-type':
          'application/json',
      },

      credentials: 'include',

      body: JSON.stringify({
        query,
        variables,
      }),
    },
  );

  const payload =
    (await response.json()) as
      GraphQLResponse<TData>;

  if (
    !response.ok ||
    payload.errors?.length
  ) {
    const message =
      payload.errors?.[0]?.message ??
      'Request failed.';

    throw new GraphQLRequestError(
      message,
      payload.errors,
    );
  }

  if (!payload.data) {
    throw new GraphQLRequestError(
      'The server returned no data.',
    );
  }

  return payload.data;
}

export { graphqlRequest };
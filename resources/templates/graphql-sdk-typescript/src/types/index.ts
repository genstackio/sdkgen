export * from './input';
export * from './model';

export type queries = {
    [key: string]: string|[string, selections];
}

export type variables = {
    [key: string]: any;
}

export type fetch = (url: string, options: any) => Promise<{json: () => any}>;

export type selection = string | [string, selections];
export type selections = selection[];

export type sdk_identity = undefined | non_empty_sdk_identity;

export type non_empty_sdk_identity = {
    username: string;
    password: string;
};

export type sdk_auth_tokens = undefined | non_empty_sdk_auth_tokens;

export type non_empty_sdk_auth_tokens = {
    accessToken: string;
    refreshToken: string;
};

export type sdk_config = {endpoints: {rest: string, graphql: string}, fetch: fetch, identity?: sdk_identity, queries: queries, options?: sdk_options};

export type sdk_options = {
    minExpirationDelay?: number;
};

export type auth_data = {
    exp: number;
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    permissions: string[];
    scope: string;
    iat: number;
}

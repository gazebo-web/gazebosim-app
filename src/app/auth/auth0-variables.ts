import { environment } from '../../environments/environment';

interface AuthConfig {
  CLIENT_ID: string;
  CLIENT_DOMAIN: string;
  AUDIENCE: string;
  REDIRECT: string;
  SCOPE: string;
  API_HOST_URL: string;
}

export const AUTH_CONFIG: AuthConfig = {
  CLIENT_ID: environment.AUTH0_CLIENT_ID,
  CLIENT_DOMAIN: environment.AUTH0_CLIENT_DOMAIN,
  AUDIENCE: environment.AUTH0_AUDIENCE,
  REDIRECT: environment.AUTH0_REDIRECT,
  SCOPE: environment.AUTH0_SCOPE,
  API_HOST_URL: environment.API_HOST
};

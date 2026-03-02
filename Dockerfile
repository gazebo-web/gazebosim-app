# ------------------------------------------------------------
# gazebosim-app  –  Development container (staging Fuel server)
# ------------------------------------------------------------
# Build:  docker build -t gazebosim-app .
# Run:    docker run -p 3001:3001 gazebosim-app
# ------------------------------------------------------------

FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the source
COPY . .

# ── Environment variables (staging Fuel) ─────────────────────
# These are injected at build-time by custom-webpack.config.js
# via webpack.EnvironmentPlugin and read in environment.ts.
# Override any of them at runtime with:  docker run -e VAR=value

# Auth0
ENV AUTH0_AUDIENCE="https://staging-fuel.gazebosim.org"
ENV AUTH0_CLIENT_DOMAIN="gazebo.auth0.com"
ENV AUTH0_CLIENT_ID=""
ENV AUTH0_REDIRECT="http://localhost:3001/callback"
ENV AUTH0_LOGOUT_REDIRECT="http://localhost:3001"
ENV AUTH0_SCOPE="openid profile email"

# Backend
ENV API_HOST="https://staging-fuel.gazebosim.org"
ENV API_VERSION="1.0"
ENV CLOUDSIM_HOST="https://staging-cloudsim.gazebosim.org"
ENV CLOUDSIM_VERSION="1.0"
ENV CREDITS_REDIRECT=""

# Other
ENV AWS_GZ_LOGS_BUCKET="web-cloudsim-staging-logs"
ENV STRIPE_PK=""
ENV CREDITS_REQUIRED="0"

# ── Serve ────────────────────────────────────────────────────
EXPOSE 3001

# --host 0.0.0.0 so the dev server is reachable outside the container
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "3001", "--configuration=development"]

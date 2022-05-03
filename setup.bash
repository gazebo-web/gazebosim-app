#!/bin/bash

# API related.
export API_HOST="https://fuel.gazebosim.org"
#export API_HOST="https://staging-fuel.gazebosim.org"
#export API_HOST="http://localhost:8000"
export API_VERSION="1.0"
#export CLOUDSIM_HOST="https://staging-cloudsim.gazebosim.org"
export CLOUDSIM_HOST="https://cloudsim.gazebosim.org"
export CLOUDSIM_VERSION="1.0"

# Auth0 related.
# STAGING export AUTH0_CLIENT_ID="rcfGFzR1tyAOFHfA8LeDZpFu4teBy8d7"
export AUTH0_CLIENT_ID="RhTTmpFrLCKIVaaEkMnPMyLiRX4h1Ftu"
export AUTH0_CLIENT_DOMAIN="gazebosim-production.us.auth0.com"
export AUTH0_AUDIENCE="https://fuel.gazebosim.org"
export AUTH0_REDIRECT="https://app.gazebosim.org/callback"
export AUTH0_LOGOUT_REDIRECT="https://app.gazebosim.org/home"
#export AUTH0_REDIRECT="http://localhost:3000/callback"
#export AUTH0_LOGOUT_REDIRECT="http://localhost:3000/callback"

# Misc
export AWS_GZ_LOGS_BUCKET="web-cloudsim-staging-logs"

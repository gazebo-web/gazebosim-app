#!/bin/bash

# Fuel Server related.
# export API_HOST="https://integration-fuel.ignitionrobotics.org"
# export API_HOST="https://staging-fuel.ignitionrobotics.org"
export API_HOST="http://localhost:8000"
export API_VERSION="1.0"

# Cloudsim Server related.
# export CLOUDSIM_HOST="https://integration-cloudsim.ignitionrobotics.org/"
# export CLOUDSIM_HOST="https://staging-cloudsim.ignitionrobotics.org/"
export CLOUDSIM_HOST="http://localhost:8001"
export CLOUDSIM_VERSION="1.0"

# Auth0 related.
# Ignition Robotics (Staging).
export AUTH0_CLIENT_ID="MjT19rUiv1LX3JCMXcaaYdKennuikPFw"
export AUTH0_CLIENT_DOMAIN="ignitionrobotics-staging.auth0.com"
export AUTH0_AUDIENCE="https://staging-api.ignitionfuel.org"
export AUTH0_REDIRECT="http://localhost:3000/callback"
export AUTH0_LOGOUT_REDIRECT="http://localhost:3000"

#!/bin/bash
#
# Copyright (C) 2017 Open Source Robotics Foundation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# ------------------------------------------------------------------------------
# deploy.sh: A shell script to deploy a new version of Ignition Fuel UI.
#
# * Install the following dependencies before using the script:
#
#     sudo apt install python-pip
#
# * Install AWS CLI
#
#     pip install --upgrade --user awscli
#
# * Add the executable path to your PATH variable: ~/.local/bin
#
#     export PATH=~/.local/bin:$PATH
#
# * Enable preview stage (for cloudfront support).
#
#     aws configure set preview.cloudfront true
#
# * Configure your AWS credentials. Choose one of the two options:
#
#     - Option 1: For general use, use aws:
#
#         aws configure
#
#     - Option 2: Set the following environment variables:
#
#         export AWS_ACCESS_KEY_ID=AKIAI44QH8DHBEXAMPLE
#         export AWS_SECRET_ACCESS_KEY=je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY
#
# * Configure the environment where you want to deploy:
#
#     export APPLICATION_ENVIRONMENT=integration.ignitionfuel.org
#
# * Configure your CloudFront distribution id:
#
#     export CLOUDFRONT_DISTRIBUTION_ID=E2RSG343FDF43GEXAMPLE
#
# * Configure environment variables
#
#     export AUTH0_CLIENT_ID="RWL4naBT7MGF8kZ89rrNc1ivDho25UAU"
#     export AUTH0_CLIENT_DOMAIN="osrf.auth0.com"
#     export AUTH0_AUDIENCE="https://ignitionfuel.org"
#     export AUTH0_REDIRECT="http://integration.ignitionfuel.org/callback"
#     export API_HOST="https://staging-api.ignitionfuel.org"
#
# * Run:
#
#     ./deploy.sh
#
#-------------------------------------------------------------------------------

set -e

# Define usage function.
usage()
{
  echo "Usage: $0 [options]"
  echo -e "\nOptions:\n"
  echo "  -y, --yes      Automatic yes to prompts."
  exit 1
}

# Parse options.
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -y|--yes)
    ASSUME_YES=true
    ;;
    *)
    # Unknown option.
    usage
    ;;
esac
# Past argument or value.
shift
done

# Sanity check: Is aws available?
hash aws 2>/dev/null || { \
  echo >&2 "aws is not installed. Aborting."; exit 1; }

# Sanity check: Are AWS credentials available?
aws iam list-access-keys >/dev/null 2>&1 || { \
  echo >&2 "AWS credentials not found. Aborting."; exit 1; }

# Sanity check: Is preview stage enabled?
AWS_PREVIEW=`aws configure get preview.cloudfront`
if [ "$AWS_PREVIEW" == "false" ] ; then
  echo "aws is not in preview stage. Please, execute: "
  echo -e "\n  aws configure set preview.cloudfront true\n"
  echo -e "Aborting.\n"
  exit 1
fi

# Sanity check: Is APPLICATION_ENVIRONMENT env variable set?
[ -z "$APPLICATION_ENVIRONMENT" ] && {\
  echo "APPLICATION_ENVIRONMENT is not set. Aborting."; exit 1; }

# Sanity check: Is CLOUDFRONT_DISTRIBUTION_ID env variable set?
[ -z "$CLOUDFRONT_DISTRIBUTION_ID" ] && {\
  echo "CLOUDFRONT_DISTRIBUTION_ID is not set. Aborting."; exit 1; }

# Sanity check: Is node available?
hash node 2>/dev/null || { \
  echo >&2 "node is not installed. Aborting."; exit 1; }

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Show confirmation if needed.
if [ "$ASSUME_YES" != "true" ] ; then
  read -p "Deploy Ignition Fuel UI [$APPLICATION_ENVIRONMENT] [y/N]? " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]] ; then
    [[ "$0" = "$BASH_SOURCE" ]] && exit 1 || return 1
  fi
fi

cd $DIR

# Build.
npm run build:prod

# Upload to S3.
aws s3 sync dist/ s3://$APPLICATION_ENVIRONMENT

# Invalidate all files in CloudFront.
aws cloudfront create-invalidation --distribution-id \
  $CLOUDFRONT_DISTRIBUTION_ID --paths '/*'

cd - > /dev/null

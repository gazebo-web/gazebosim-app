<div align="center">
  <img src="./src/assets/images/gazebo_icon_color.svg" width="200"
  alt="Gazebo" />
  <h1>Gazebo</h1>
  <p>Gazebo Web Application</p>
</div>

* Framework: Angular 10
* CI: GitLab pipelines
* CD: GitLab pipelines + AWS S3 + CloudFront

---

# Prequisites

This project requires:
- node 14.x
- npm 6.x

To install node, it is highly recommended to use Node Version Manager, [NVM](https://github.com/nvm-sh/nvm). You can install it the following way:

        # Install NVM. Check their repository for the latest version.
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.0/install.sh | bash

        # Source .bashrc so we can use the nvm command.
        source ~/.bashrc

        # Install node version 14. This will also install npm version 6.
        nvm install 14

When you work on this project, make sure you are using the right version of node.

        # Use node version 14.
        nvm use 14

        # Verify the versions with the following commands.
        node -v
        npm -v

If you don't want to use NVM, you can install node the following way.

        # Install node without NVM.
        curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
        sudo apt-get install -y nodejs

---

# Setup

1. Clone this repo and change directory into it:

        git clone https://github.com/gazebo-web/gazebosim-frontend.git
        cd app

1. Install dependencies

        npm install

---

# Workflow

Use the `develop` branch for development. Merge requests should target it. The `master` branch is only used for Production releases.

## Environment Variables

Before serving the app for development or building it for deploy, you need to set the environment variables to use. This repository comes up with an example [setup.bash](setup.bash) file which works with the Staging API.

        source ./setup.bash

## Serve the app for development

You can serve the app locally with the following command.

        npm start

The app uses port 3000 by default. If you want to use a different one, you can serve it with the Angular CLI command.

        ng serve --port <port>

## Build the app for deployment

The app can be built for different environments with the following commands. The different environments are listed in the [angular.json](angular.json) file, each one having different options and optimization levels. Remember to provide the environment variables to use.

        # Development
        npm run build

        # Staging
        npm run build:staging

        # Production
        npm run build:prod

The output can be found in the `dist/app` folder.

## Other useful scripts

* Run tests

        npm run test

    The generated coverage can be found in `./coverage/html/index.html`.

* Run the linter

        npm run lint

---

# Deployment

## Gitlab Pipelines

The `staging` branch in this repository is used to deploy this website to
https://staging-app.gazebosim.org. The `production` branch in this repository is
used to deploy this website to `https://app.gazebosim.org`.

Github actions will automatically deploy `staging` on push. The `production`
branch will only deploy when an authorized user approves the deployment on
the Github Actions UI.

There is no rule about how a release should be made. A person with sufficient
access can choose between direct commits or pull requests.

## Manual process

Though the preferred way to deploy is through pipelines, sometimes you need to deploy the app manually. Here is a list of steps required to do so.

First, you need the AWS CLI installed and configured. You can do it the following way.

        # Install
        sudo apt install python-pip
        pip install --upgrade --user awscli

        # Configure
        aws configure

1. Provide the environment variables and build the app for the desired environment, as mentioned in the previous section.

1. Enable preview stage (for Cloudfront support).

        aws configure set preview.cloudfront true

1. Sync the build output to the corresponding S3 bucket.

    Where `APPLICATION_ENVIRONMENT` can be

    - Integration: `integration-app.gazebosim.org`

    - Staging: `staging-app.gazebosim.org`

    - Production: `app.gazebosim.org`

        aws s3 sync dist/app s3://$APPLICATION_ENVIRONMENT

1. Trigger an invalidation in Cloudfront.

        aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths '/*'

    Make sure you are using the `CLOUDFRONT_DISTRIBUTION_ID`of the environment you deployed.

---

# Notes

## Tests

You can select a specific spec our suite to run by using `fdescribe()` or `fit()`. In a similar way, you can skip tests with `xdescribe()` or `xit()`. Read [Jasmine documentation](https://jasmine.github.io/2.0/introduction.html) for more information regarding tests.

Each component and service being test requires a [TestBed](https://angular.io/api/core/testing/TestBed), which needs to be configured before each spec method. If the component has an external layout (separate `html` and `css` files), it requires to be compiled. We are doing this through Webpack in the Karma test configuration, thus there is no need to call the TestBed method to compile the component.

## Naming conventions

Following the [Angular Style Guide](https://angular.io/guide/styleguide), we use the `gz` prefix for the selector of our Components and Directives. This is configured in the linter.

## Templates and variable scope

Variables referenced in HTML templates must be `public`. Private variables inside a `component.ts` file cannot be accessed in `component.html` nor `component.spec.ts` files.

## Environment Variables

In order to add new environment variables, you need to add them in the [custom-webpack.config.js](custom-webpack.config.js) file, so it can be included once the application is built. After, it is advisable to include the new variable inside the [environment files](src/environments), with a fallback value.

To work with environment variables inside the code, you need to include them.

```
import { environment } from 'src/environments/environment';
```

Then, you can use it. For example:

```
const api = environment.API_HOST;
```

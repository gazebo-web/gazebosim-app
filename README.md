<div align="center">
  <img src="./assets/logo.png" width="200" alt="Ignition Robotics" />
  <h1>Ignition Robotics</h1>
  <p>Ignition web application</p>
</div>

* Framework: Angular 5
* CI: GitLab pipelines
* CD: GitLab pipelines + AWS CloudFront

---

## Quickstart

### Prerequisite

1. Install nodejs and npm (be sure you have `npm` version 3 and `nodejs` version 6):

        # Install node. Note you'll need root access
        curl -sL https://deb.nodesource.com/setup_6.x | bash -
        apt-get install -y nodejs

1. If you run into issues with installing `npm` using the above commands, another option is to use node's version manager [nvm](https://github.com/nvm-sh/nvm). For example, here are the commands for installing nvm and node:

        # install nvm
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

        # source .bashrc so we can use the nvm cmd
        source ~/.bashrc

        # install node version 6 and npm version 3
        nvm install 6


### One-time setup

1. Clone this repo and move to the clone:

        git clone https://gitlab.com/ignitionrobotics/web/app.git
        cd app

        # For development, use the `develop` branch
        git checkout develop

1. Install

        npm install

### Serve the app for development

1. Make sure you have set your environment variables.

    This repository comes with an example `setup.bash` file which works with the API at https://staging-fuel.ignitionrobotics.org. Edit that file with your own Auth0 and backend information.

    You can source this file by doing:

       . setup.bash

1. Run the application.

        npm start

### Build for production

    npm run build:prod

---

## Deploy

The deploy process is done by gitlab pipelines, whenever there is a change in the `staging` or `production` branches.

The pipeline is in charge of setting the required environment variables, syncing the built app into the corresponding S3 bucket and invalidating the Cloudfront distribution.

For in-depth details, you can check the `.gitlab-ci.yml` file.

### Manual process

The preferred way to deploy is through pipelines, as mentioned before. Still, a script can be run locally to deploy the app.

The following steps can be also seen in the pipeline configuration.

#### Local setup

* Install the following dependencies before using the script:

        sudo apt install python-pip

* Install AWS CLI

        pip install --upgrade --user awscli

* Add the executable path to your PATH variable: `~/.local/bin`

        export PATH=~/.local/bin:$PATH

#### Deploy manually

* Build the application for production.

        npm run build:prod

* Enable preview stage (for Cloudfront support).

        aws configure set preview.cloudfront true

* Configure your AWS credentials. Choose one of the two options:

    - Option 1: For general use, use aws:

            aws configure

    - Option 2: Set the following environment variables:

        ```
        export AWS_ACCESS_KEY_ID=YOUR_AWS_KEY_ID
        ```

        ```
        export AWS_SECRET_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
        ```

* Configure the environment where you want to deploy:

        export APPLICATION_ENVIRONMENT=ENVIRONMENT

    Where ENVIRONMENT can be `staging-app.ignitionrobotics.org` for staging or `app.ignitionrobotics.org` for production.

* Configure your CloudFront distribution id:

        export CLOUDFRONT_DISTRIBUTION_ID=YOUR_CLOUDFRONT_ID

* Make sure that you are in your application's project directory and run:

        ./deploy.sh

---

## Tests

To run tests, use the following command:

`npm run test`

The results can be seen in the console. You can also check the generated coverage in `./coverage/html/index.html`.

### Configuration

We are using Karma and Jasmine to run the tests. Karma configuration can be found in `./config/karma.conf.js`.

The tests are configured to do a single run, to avoid blocking the Bitbucket pipelines. For development purposes, you can change the `singleRun` flag. To see the console

In order to see `console.log` lines, you need to modify the configuration file to `captureConsole=true`.

### Other notes

You can select a specific spec our suite to run by using `fdescribe()` or `fit()`. In a similar way, you can skip tests with `xdescribe()` or `xit()`. Read [Jasmine documentation](https://jasmine.github.io/2.0/introduction.html) for more information regarding tests.

Each component and service being test requires a [TestBed](https://angular.io/api/core/testing/TestBed), which needs to be configured before each spec method. If the component has an external layout (separate `html` and `css` files), it requires to be compiled. We are doing this through Webpack in the Karma test configuration, thus there is no need to call the TestBed method to compile the component.

---

## Docs

We use [Typedoc](http://typedoc.org/) to generate documentation. You can generate it with the following command:

`npm run docs`

You can access the generated docs in `./doc/index.html`.

---

## Naming conventions

Following the [Angular Style Guide](https://angular.io/guide/styleguide), we use the `ign` prefix for the selector of our Components and Directives.

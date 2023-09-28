# Kestävä Keikkatyö - KeikkaKaveri

## Table of contents

- [Introduction](#introduction)
  - [What is KeikkaKaveri intended for?](#what-is-keikkakaveri)
  - [Priorities and ideas for future developers](#priorities-and-ideas-for-future-developers)
- [Instructions for developers](#instructions-for-developers)
  - [Backend stack](#backend-stack)
  - [Setup](#setup)
    - [Cloning](#cloning)
    - [Running locally](#running-locally)
  - [AWS & CI/CD](#aws--cicd)
    - [Development](#development)
  - [REST API Documentation](#rest-api-documentation)

## Introduction

### What is KeikkaKaveri

KeikkaKaveri is a web app developed to assist temporary workers in their work.

KeikkaKaveri is developed by Metropolia in collaboration with various organizations for Työturvallisuuskeskus (TTK, the Centre for Occupational Safety).

The app is developed to fit/implement parts of the model provided by Tampereen teknillinen yliopisto(TTY, Tampere University of Technology), namely the three-way communication of relevant parties (agency, worker, customer business) and to display information relevant to all who need it.

### Priorities and ideas for future developers

Priorities for future development should revolve around the three-way-interface that includes the worker, their agency and the customer. The app should also continue to implement the TTY model.

Worker pipeline should resemble something of the following:

```
Worker registers to the app
-> Worker gets an invitation to be a part of an agency (email / sms or something of the sorts)
-> Agency assigns worker to business
-> Workers works for the business, but is employed by agency
```

Ideas for future development on backend:

1. Connections: Make agencies able to connect workers to businesses
2. Visibility: Scope workers' and business' visibility of other workers, businesses and agencies
3. Feedback: Feedback can be given by workers, but they cannot be answered yet
4. Documentation: Generating (automated) documentation for the codebase
5. Testing: Much of the project is not covered (43.95 % as of 17.12.2022)

## Instructions for developers

### Backend stack

Node.js, Express.js and MongoDB

Testing/Deployment: Jest & AWS

### Setup

To run this project locally you need:

- Node.js (lts)
- Git
- Code editor of your choice (VSCode or IntelliJ IDEA recommended)
- MongoDB connection (locally or via Atlas recommended)

You can install Visual Studio Code from [here](https://code.visualstudio.com/).

After the installation is done, download the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to enable linting and allow the execution to run in your workspace.

You don't have to use Visual studio code, any text editor with ESLint support should be fine.

### Cloning

Start by downloading the zip file of this project from GitHub.

Or if you have Git installed

```
$ git clone https://github.com/Kestava-keikkatyo/innoBackend.git
```

### Running a containerized dev environment

You can run the backend in a containerized dev enviroment that consists of a database container, the server itself, and a simple database monitoring gui tool.
This requires that you have **Docker desktop** installed on your system, and a **.env.development** file with environment variables set in the root directory.

Installation guides for Docker desktop:

- [Windows install](https://docs.docker.com/desktop/install/windows-install/)
- [Mac install](https://docs.docker.com/desktop/install/mac-install/)
- [Linux install](https://docs.docker.com/desktop/install/linux-install/)

The test and dev environments expect to have corresponding env files: `.env.development` and `.env.test` Make sure to add both files, **otherwise the environments wont work**.

Here is a template for .env.development:

```
IP=localhost
PORT=3001
MONGODB_USER=root
MONGODB_PASSWORD=password
MONGODB_URI=mongodb://root:password@mongo

DB_FIRST_ADMIN_EMAIL=admin@nowhere.com
DB_FIRST_ADMIN_PASSWORD=Fisherman
```

Here is a template for .env.test:

```
IP=localhost
PORT=3001
MONGODB_USER=root
MONGODB_PASSWORD=password
MONGODB_URI=mongodb://root:password@test-db

DB_FIRST_ADMIN_EMAIL=admin@nowhere.com
DB_FIRST_ADMIN_PASSWORD=Fisherman
```

The only difference is in the database uri, which depends on the container name. Feel free to change the variables to your liking before running the environment, though there is no real need in a locally running dev context.

❗ If you want to change the local database password or username after a while, you have to manually change them in the container or delete the database volume. The information is persisted in the database volume, so just changing the variables in the env files breaks things.

Once you have installed Docker desktop and setup the environment variables, you can run the containerized dev environment with the following command:

```
npm run dev-docker
```

❗ Make sure that your terminals current working directory is the **root directory** of the project before running the command.

The tests can be run in a dockerized environment with:

```
npm run test-docker
```

The application can be closed by pressing CTRL+C in the terminal. If the application doesn't shut down for some reason, it can be shut down by typing the following command in a separate terminal:

```
docker compose -f compose-dev.yaml --env-file .env.development down
```

or

```
docker compose -f compose-test.yaml --env-file .env.test down
```

#### Additional notes:

- The containers take up significant amounts of space. The database instance itself takes up around 700mb of disk space and the server around 500mb. The database monitoring app is around 150mb. This means that ideally you need several _gigabytes_ of free disk space.

- You can monitor the containers and related volumes in the Docker desktop -app.

- In order to remove **ALL** unused containers, images and volumes created by docker or docker compose, run the following command: `npm run docker-cleanup`

- You can view all the running containers with: `docker ps`

### Running locally

It is recommended to use a [MongoDB Atlas](https://www.mongodb.com/cloud) cluster for the database,
though you can also run the database locally.

First you need to create a .env.development file in the root of the project directory.
It should look something like this:

```
IP=internet_protocol_address
PORT=1234
MONGODB_USER=root
MONGODB_PASSWORD=password
MONGODB_URI=mongodb://root:password@mongo
SECRET=some_secret

AWS_REGION=the_region_of_the_aws_service
AWS_ACCESS_KEY_ID=the_access_key_id_of_the_aws_service
AWS_SECRET_ACCESS_KEY=the_secret_access_key_of_the_aws_service
AWS_BUCKET=the_name_of_the_bucket_of_the_aws_service

...
```

❗ _Never commit the `.env` file to git_ ❗

Run `npm install` to install all necessary dependencies.

Run backend server locally by running the following commands:

```
cd (your_path)/innoBackend
npm run dev
```

You can populate the database with seed-data by running `npm run seed`

## AWS & CI/CD

Backend of the app is served by Amazon Elastic Compute Cloud.
More detailed description of the architecture can be found in the project's Google drive folder.

### Development

To publish any changes to Elastic Compute Cloud:

- Pull any recent changes from the main branch (`dev`)
- Create a new branch
- Make any necessary changes
- Commit changes
- Publish your branch
- Make a PR (Pull Request) and wait for the `Continuous Integration` action to run its course
  - If the action doesn't go through (fails at tests or build), check the details of the action and make changes accordingly  
    ❗ _Do NOT merge if `Continuous Integration` action fails_ ❗
  - If the action goes through, merge the PR to main branch
- An action called `Continuous Deployment` is triggered upon push to main branch, which will automatically build the project and publish it to the Elastic Compute Cloud.

### REST API documentation

Running the server will create the REST API documentation,
and it can be found at the "/api-docs" route. (e.g. localhost:3001/api-docs)

You can use [Postman](https://www.postman.com/downloads/) when calling routes.
A Postman collection of ready-made calls to routes can be found under the "doc" folder.
Open Postman and select "File > Import..." to import the collection.

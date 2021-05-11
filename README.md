Pullatessa suorita ```npm install``` komento ladataksesi vaadittavat kirjastot

Projektin saa buildattua ```npm run build``` komennolla

Serveri lähtee pyörimään ```npm start``` tai ```npm run dev``` komennolla

# Kestävä keikkatyö

## Table of contents

* [Setup](#setup)
    * [Cloning](#cloning)
    * [VSCode](#vscode)
    * [Running locally](#running-locally)
* [REST API documentation](#rest-api-documentation)  

## Setup

To run this project locally you need:

* Node.js (lts)
* Git
* VSCode
* MongoDB connection (locally or via Atlas recommended)

### Cloning

Start by downloading the zip file of this project from GitHub.

Or if you have Git installed

```
$ git clone https://github.com/Kestava-keikkatyo/innoBackend.git
```

### VSCode

You can install Visual Studio Code from [here](https://code.visualstudio.com/).

After the installation is done, download the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to enable linting and allow the execution to run in your workspace.

You don't have to use Visual studio code, any text editor with ESLint support should be fine.

### Running locally

It is recommended to use a [MongoDB Atlas](https://www.mongodb.com/cloud) cluster for the database, 
though you can also run the database locally.

First you need to create a .env file in the root of the project directory.
It should look something like this:

```
IP=localhost
PORT=3001
MONGODB_URI=Your_locally_running_mongodb_server_or_Atlas_cluster_ip
SECRET=SEKRET
```

If you haven't already, run ```npm install```
to install all necessary dependencies. Then you can start the server.

```
$ cd (your_path)/innoBackend
$ npm install
$ npm start (or npm run dev)
```

You can populate the database with seed-data by running ```npm run seed```

### REST API documentation

Running the server will create the REST API documentation,
and it can be found at the "/api-docs" route. (e.g. localhost:3001/api-docs)

You can use [Postman](https://www.postman.com/downloads/) when calling routes. 
A Postman collection of ready-made calls to routes can be found under the "doc" folder.
Open Postman and select "File > Import..." to import the collection.
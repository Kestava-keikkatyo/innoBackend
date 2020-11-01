pipeline {
  // 	This image parameter (of the agent section’s docker parameter) downloads the node:6-alpine Docker image (if it’s not already available on your machine) and runs this image as a separate container. This means that:
  //You’ll have separate Jenkins and Node containers running locally in Docker.
  //The Node container becomes the agent that Jenkins uses to run your Pipeline project. However, this container is short-lived - its lifespan is only that of the duration of your Pipeline’s execution.
  agent {
    docker {
      image 'node:6-alpine'
      args '-p 3000:3000'
    }
  }
  environment {
    // EnvFile is the ID of a secret file credential we have uploaded into jenkins credentials.
    envFile = credentials('EnvFile')
    SECRET=envFile.SECRET
    MONGODB_URI = envFile.MONGODB_URI
    TEST_MONGODB_URI = envFile.TEST_MONGODB_URI
    PORT = envFile.PORT

    CI = 'true' 
  }
  
  stages {
    stage('Build stage') {
      
      steps {
        echo 'Build stage'
        
        sh 'npm install'
        sh 'printenv'
        sh 'npm run watch'
      }
    }
    stage('Test stage') {
      steps {
        echo 'Test stage'
        sh 'npm test'
      }
    }
    stage('Deploy stage') {
      steps {
        echo 'Deploy stage'
      }
    }
  }
}
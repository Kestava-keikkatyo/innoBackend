pipeline {
  agent {
    docker {
      image 'node:lts-alpine3.11'
      args '-p 3000:3000'
    }
  }
  environment {
    CI = 'true' 
  }
  
  stages {
    stage('Build stage') {
      
      steps {
        echo 'Build stage'
        echo "PORT: ${PORT}"
        echo "MONGODB_URI: ${MONGODB_URI}"
        echo "TEST_MONGODB_URI: ${TEST_MONGODB_URI}"
        sh 'npm install'
      }
    }
    // stage('Test stage') {
    //   steps {
    //     echo 'Test stage'
    //     sh 'npm test'
    //   }
    // }
    stage('Deploy stage') {
      steps {
        echo 'Deploy stage'
      }
    }
  }
}
pipeline {
  agent {
    docker {
      image 'node:lts-alpine3.11'
      args '-p 3000:3000'
    }

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
  environment {
    CI = 'true'
    PORT = '3001'
    MONGODB_URI = 'mongodb+srv://testikayttaja:testiTESTI2021@innoprojekti.fzb9g.mongodb.net/innoprojekti?retryWrites=true&w=majority'
    TEST_MONGODB_URI = 'mongodb+srv://testikayttaja:testiTESTI2021@innoprojekti.fzb9g.mongodb.net/innoprojekti?retryWrites=true&w=majority'
  }
}
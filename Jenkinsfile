pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build & Run Docker Containers') {
      steps {
        dir('my-medusa-store') {
          sh '''
            set -e
            pwd
            ls -la

            # show compose file
            ls -la docker-compose.yml

            docker-compose version
            docker-compose down || true
            docker-compose up -d --build
          '''
        }
      }
    }

    stage('Verify Containers') {
      steps {
        sh '''
          docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        '''
      }
    }
  }
}

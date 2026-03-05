pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        // If job is "Pipeline script from SCM", Jenkins already checks out.
        // This makes sure code is present even if job config changes.
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

            docker compose down || true
            docker compose up -d --build
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

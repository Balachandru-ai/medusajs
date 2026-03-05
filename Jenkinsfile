pipeline {
    agent any

    stages {

        stage('Clone Repository') {
            steps {
                git 'https://github.com/Balachandru-ai/medusajs.git'
            }
        }

        stage('Build Docker Containers') {
            steps {
                sh '''
                docker-compose down
                docker-compose up -d --build
                '''
            }
        }

        stage('Verify Containers') {
            steps {
                sh '''
                docker ps
                '''
            }
        }

    }
}

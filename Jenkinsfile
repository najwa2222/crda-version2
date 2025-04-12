pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "najwa22/crda-app"
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        KUBE_NAMESPACE = "crda-namespace"
        MYSQL_SECRET = "mysql-secret"
        SONAR_PROJECT_KEY = "najwa22_crda-app"
        SONAR_SERVER_URL = "http://localhost:9000"
        SONAR_TOKEN_CREDENTIALS_ID = "sonarqube-token"
        WORKSPACE = "${env.WORKSPACE}".replace('/', '\\')
        NODE_OPTIONS = "--experimental-vm-modules --no-warnings"
        COVERAGE_REPORT = "coverage/lcov.info"
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout SCM') {
            steps {
                git url: 'https://github.com/najwa2222/crda-version2.git', branch: 'main'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci --prefer-offline --no-audit --no-fund'
            }
        }

        stage('Static Code Analysis') {
            steps {
                bat 'npm run lint -- --config eslint.config.js'  // Check for linting issues
                bat 'npm run lint:fix -- --config eslint.config.js'  // Fix automatically fixable issues
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test'
                
                // Archive test results if you're using JUnit reporter
                // Install jest-junit: npm install --save-dev jest-junit
                bat 'npm test -- --ci --reporters=default --reporters=jest-junit'
                junit 'junit.xml'
                
                // Process coverage results
                publishCoverage adapters: [istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')]
            }
            post {
                always {
                    archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    withCredentials([string(credentialsId: SONAR_TOKEN_CREDENTIALS_ID, variable: 'SONAR_TOKEN')]) {
                        bat """
                        sonar-scanner.bat ^
                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} ^
                        -Dsonar.projectName=${DOCKER_IMAGE} ^
                        -Dsonar.sources=app.js,src ^
                        -Dsonar.host.url=${SONAR_SERVER_URL} ^
                        -Dsonar.token=${SONAR_TOKEN} ^
                        -Dsonar.javascript.lcov.reportPaths=${COVERAGE_REPORT} ^
                        -Dsonar.qualitygate.wait=true ^
                        -Dsonar.exclusions=**/*.spec.js,kubernetes/**
                        """
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        docker.withRegistry('', 'dockerhub-credentials') {
                            dockerImage.push()
                            dockerImage.push('latest')
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    bat "kubectl create namespace ${KUBE_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"

                    withCredentials([
                        string(credentialsId: 'mysql-root-password', variable: 'MYSQL_ROOT_PASSWORD'),
                        string(credentialsId: 'mysql-app-password', variable: 'MYSQL_APP_PASSWORD')
                    ]) {
                        bat """
                            kubectl create secret generic ${MYSQL_SECRET} ^
                                --namespace ${KUBE_NAMESPACE} ^
                                --from-literal=root-password=%MYSQL_ROOT_PASSWORD% ^
                                --from-literal=app-password=%MYSQL_APP_PASSWORD% ^
                                --dry-run=client -o yaml | kubectl apply -f -
                        """
                    }

                    dir('kubernetes') {
                        def manifestOrder = [
                            '00-namespace.yaml',
                            '02-mysql-pv.yaml',
                            '03-mysql-pvc.yaml',
                            '04-mysql-config.yaml',
                            '05-mysql-init-script.yaml',
                            '06-mysql-deployment.yaml',
                            '07-mysql-service.yaml',
                            '08-app-deployment.yaml',
                            '09-app-service.yaml'
                        ]

                        manifestOrder.each { file ->
                            if (file == '02-mysql-pv.yaml') {
                                def checkPV = bat(
                                    script: "kubectl get pv mysql-pv",
                                    returnStatus: true
                                )
                                if (checkPV != 0) {
                                    bat "kubectl apply -f ${file} --namespace ${KUBE_NAMESPACE}"
                                } else {
                                    echo "PersistentVolume 'mysql-pv' already exists. Skipping creation."
                                }
                            } else {
                                bat "kubectl apply -f ${file} --namespace ${KUBE_NAMESPACE}"
                            }

                            if (file =~ /deployment.yaml$/) {
                                def resourceType = file.contains('mysql') ? 'deployment/mysql-deployment' : 'deployment/app-deployment'
                                bat "kubectl rollout status ${resourceType} --namespace ${KUBE_NAMESPACE} --timeout=300s"
                            }
                        }
                    }
                }
            }
        }


        stage('Verify Deployment') {
            steps {
                script {
                    bat """
                        kubectl get pods,svc,deployments --namespace ${KUBE_NAMESPACE}
                        kubectl rollout status deployment/app-deployment --namespace ${KUBE_NAMESPACE} --timeout=120s
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning workspace'
            cleanWs()
        }
        failure {
            archiveArtifacts artifacts: 'npm-debug.log*,coverage/', allowEmptyArchive: true
            slackSend(
                color: 'danger',
                message: "Failed build: ${env.JOB_NAME} #${env.BUILD_NUMBER} - Check console output for details",
                channel: '#jenkins-builds',
                tokenCredentialId: 'slack-token'
            )
        }
        success {
            slackSend(
                color: 'good',
                message: "Successful build: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                channel: '#jenkins-builds',
                tokenCredentialId: 'slack-token'
            )
        }
    }
}

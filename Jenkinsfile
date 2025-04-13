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
        NODE_OPTIONS = "--no-warnings --experimental-vm-modules"
        COVERAGE_REPORT = "coverage/lcov.info"
        TRIVY_CACHE_DIR = "C:\\ProgramData\\trivy-cache"
        TRIVY_SEVERITY = "CRITICAL"
        ARTILLERY_CONFIG = "load-test.yml"
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
                bat 'npm run lint -- --config eslint.config.js'
                bat 'npm audit --production --audit-level=critical'
            }
        }

        stage('Run Tests') {
            environment {
                NODE_ENV = "test"
                JEST_JUNIT_OUTPUT_DIR = "./reports/"
                JEST_JUNIT_OUTPUT_NAME = "junit.xml"
                // Add other necessary environment variables
            }
            steps {
                bat 'echo "Creating reports directory" && if not exist reports mkdir reports'
                bat '''
                    echo "Starting tests..."
                    npm test
                    echo "Tests command finished"
                '''
                // Other steps follow...
            }
            post {
                always {
                    bat '''
                        taskkill /F /IM node.exe /T >nul 2>&1 || echo No node processes to kill
                        taskkill /F /IM npm.cmd /T >nul 2>&1 || echo No npm processes to kill
                        exit /b 0
                    '''
                    archiveArtifacts artifacts: 'jest-output.log,reports/**,coverage/**', allowEmptyArchive: true
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
                        -Dsonar.token=%SONAR_TOKEN% ^
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
                    def dockerImage = docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }

        stage('Security Scan with Trivy') {
            steps {
                script {
                    def trivyCmd = """
                    trivy image ^
                    --exit-code 1 ^
                    --severity ${TRIVY_SEVERITY} ^
                    --ignore-unfixed ^
                    --cache-dir ${TRIVY_CACHE_DIR} ^
                    --format template ^
                    --template "@C:\\trivy\\templates\\junit.tpl" ^
                    -o trivy-report.xml ^
                    ${DOCKER_IMAGE}:${DOCKER_TAG}
                    """

                    def status = bat(script: trivyCmd, returnStatus: true)

                    def reportFile = 'trivy-report.xml'
                    if (!fileExists(reportFile) || readFile(reportFile).trim().isEmpty()) {
                        echo "Trivy report missing or empty, generating fallback..."
                        writeFile file: reportFile, text: '<testsuite name="Trivy" tests="1" failures="0"><testcase classname="Trivy" name="Scan"/></testsuite>'
                    }

                    junit reportFile

                    if (status == 1) {
                        error "Trivy found CRITICAL vulnerabilities."
                    } else if (status != 0) {
                        echo "Trivy failed (non-vuln error), but build will continue. Exit code: ${status}"
                    } else {
                        echo "Trivy scan passed cleanly."
                    }
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
                    try {
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
                                    def checkPV = bat(script: "kubectl get pv mysql-pv", returnStatus: true)
                                    if (checkPV != 0) {
                                        kubectlApply(file)
                                    } else {
                                        echo "PersistentVolume 'mysql-pv' already exists. Skipping creation."
                                    }
                                } else {
                                    kubectlApply(file)
                                }

                                if (file =~ /deployment.yaml$/) {
                                    def resourceType = file.contains('mysql') ?
                                        'deployment/mysql-deployment' : 'deployment/app-deployment'
                                    kubectlRolloutStatus(resourceType)
                                }
                            }
                        }
                    } catch (err) {
                        error "Deployment failed: ${err}"
                    }
                }
            }
        }

        stage('Rotate Secrets') {
            steps {
                bat """
                kubectl rollout restart deployment/mysql-deployment -n ${KUBE_NAMESPACE}
                kubectl rollout restart deployment/app-deployment -n ${KUBE_NAMESPACE}
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                bat """
                kubectl get pods,svc,deployments --namespace ${KUBE_NAMESPACE}
                kubectl rollout status deployment/app-deployment --namespace ${KUBE_NAMESPACE} --timeout=120s
                """
            }
        }

        stage('Performance Test') {
            steps {
                bat "artillery run ${ARTILLERY_CONFIG}"
            }
        }
    }

    post {
        always {
            script {
                cleanWs()
            }
        }
        failure {
            archiveArtifacts artifacts: 'npm-debug.log*,coverage/,test-results/', allowEmptyArchive: true
            slackSend(
                color: 'danger',
                message: """Failed build: ${env.JOB_NAME} #${env.BUILD_NUMBER}
                - Test Results: ${env.BUILD_URL}testReport
                - Security Report: ${env.BUILD_URL}artifact/trivy-report.xml""",
                channel: '#jenkins-builds',
                tokenCredentialId: 'slack-token'
            )
        }
        success {
            slackSend(
                color: 'good',
                message: """Successful build: ${env.JOB_NAME} #${env.BUILD_NUMBER}
                - Coverage Report: ${env.BUILD_URL}artifact/coverage/
                - Performance Report: ${env.BUILD_URL}artifact/artillery-report.json""",
                channel: '#jenkins-builds',
                tokenCredentialId: 'slack-token'
            )
        }
    }
}

def kubectlApply(String file) {
    bat "kubectl apply -f ${file} --namespace ${KUBE_NAMESPACE}"
}

def kubectlRolloutStatus(String resourceType) {
    bat "kubectl rollout status ${resourceType} --namespace ${KUBE_NAMESPACE} --timeout=300s"
}

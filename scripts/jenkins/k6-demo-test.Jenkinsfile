/*
 ============================================================================
 This Jenkins declarative pipeline (using docker pipeline plugin) demonstrate how to run
 load test with k6 (a JavaScript-based load testing tool) inside a container build agent.
 The image is based on the official k6 image from Docker Hub.
 ============================================================================

 Pre-requisite:
- Installed the following jenkins plugins:
	* https://wiki.jenkins.io/display/JENKINS/Git+Plugin
    * https://wiki.jenkins.io/display/JENKINS/Docker+Plugin
	* http://wiki.jenkins-ci.org/display/JENKINS/HTML+Publisher+Plugin
- Setup InfluxDB+Grafana for data visualisation purpose.
  The hostname is set as JENKINS_IPADDR system environment variable in Jenkins.
*/

pipeline {
    agent {
        label 'master'
    }

    options {
        disableConcurrentBuilds()
        timestamps()
        // skipDefaultCheckout()
    }

    environment {
        def influxdb_host = "${JENKINS_IPADDR}" // To specify arbitrary hostname for InfluxDB
    }

    stages {

        stage('Preparation') {
            steps {
                // // If option is enabled with skipDefaultCheckout()
                // script {
                //     def gitCredentialsId = 'hosang.chan'
                //     REPO_BRANCH = 'main'
                //     REPO_URL = 'git@github.com:<repository>/k6-examples.git'
                //     git branch: REPO_BRANCH, credentialsId: gitCredentialsId, url: REPO_URL
                // }

                stash name: 'source', includes: 'loadtests/**'
                stash name: 'utility', includes: 'package.json, generate-html-report.js'
            }
		}


        stage('Run Smoke Test') {
            agent {
                docker {
                    image 'loadimpact/k6:latest'
                    label 'master'
                    args '--entrypoint=' //args '-u root --entrypoint=\'/bin/sh\''
                }
            }
            steps {
                unstash "source"

                echo "InfluxDB Host: ${influxdb_host}"

                echo 'Run load test with k6, generate a summary report \
                and send performance metrics to InfluxDB'

                sh """
                mkdir -p results
                k6 run loadtests/demo.js \
                --summary-export=results/summary.json \
                --out influxdb=http://${influxdb_host}:8086/k6
                """

                stash name: 'results', includes: 'results/**'
            }

			post {
                always {
                    archiveArtifacts artifacts: "results/*.json", fingerprint: true
                    cleanWs()
                }
            }
        }

        stage('Generate Report') {
            agent {
                docker {
                    image 'node:latest'
                    label 'master'
                    args '--entrypoint=' //args '-u root --entrypoint=\'/bin/sh\''
                }
            }
            steps {
                unstash "results"
                unstash "utility"

                sh """
                npm install
                chmod 755 generate-html-report.js
                node generate-html-report.js results/summary.json
                """
            }

			post {
                always {
                    archiveArtifacts artifacts: "html-report/**", fingerprint: true
                    publishHTML([allowMissing: false, alwaysLinkToLastBuild: false,
                    keepAll: false,
                    reportDir: "html-report",
                    reportFiles: 'report.html',
                    reportName: 'HTML Report',
                    reportTitles: 'K6 Summary Report - Smoke Test'])
                    cleanWs()
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}

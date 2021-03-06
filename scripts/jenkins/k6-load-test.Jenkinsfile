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

properties(
  [
    buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '20')),
    parameters([
        string(name: "rampup_duration", defaultValue: "10s", description: 'Set a realistic duration for ramp-up. e.g. 30s, 1m'),
        string(name: "steady_duration", defaultValue: "1m", description: 'Set a duration for steady state. e.g. 30s, 1m')
    ])
  ]
)

pipeline {
    agent {
        label 'master'
    }

    options {
        disableConcurrentBuilds()
        timestamps()
        skipDefaultCheckout()
    }

    environment {
        def influxdb_host = "${JENKINS_IPADDR}" // To specify arbitrary hostname for InfluxDB

        def rampup_duration  = "${params.rampup_duration}"
        def steady_duration  = "${params.steady_duration}"
    }

    stages {

        stage('Preparation') {
            steps {
                // Enabled skipDefaultCheckout()
                script {
                    // sh 'printenv'
                    echo "git url: ${scm.userRemoteConfigs[0].url}"
                    echo "git branch: ${scm.branches[0].name}"

                    // checkout from version control configured in pipeline job
                    checkout scm // git branch: 'main', credentialsId: '<credentialsId>', url: '<repositoryUrl>'
                }

                stash name: 'source', includes: 'loadtests/**'
                stash name: 'utility', includes: 'package.json, generate-html-report.js'
            }
		}

        stage('Run Load Testing') {
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
                k6 run loadtests/load-testing.js \
                -e RAMPUP_DURATION=${rampup_duration} \
                -e STEADY_DURATION=${steady_duration} \
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
                    reportTitles: 'K6 Summary Report - Load Test'])
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

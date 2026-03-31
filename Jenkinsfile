pipeline {
    agent any

    environment {
        IMAGE_NAME = 'acnecare-web-image'
        CONTAINER_NAME = 'acnecare-web-container'
        HOST_PORT = '5173' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
                echo "Đã checkout code mới nhất."
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Đang build Docker image: ${IMAGE_NAME}..."
                    sh "docker build -t ${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    sh "docker rm -f ${CONTAINER_NAME} || true"
                    
                    // Thêm cờ -e để truyền biến môi trường vào container lúc chạy
                    sh """
                    docker run -d \
                    -p ${HOST_PORT}:80 \
                    --name ${CONTAINER_NAME} \
                    -e VITE_BACKEND_URL="http://203.145.47.214:9090" \
                    --restart unless-stopped \
                    ${IMAGE_NAME}:latest
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Deploy Frontend thành công! Bạn có thể truy cập http://203.145.47.214:${HOST_PORT}"
        }
        failure {
            echo "❌ Deploy thất bại. Vui lòng kiểm tra lại log của các step trên Jenkins."
        }
    }
}

**项目说明**

14个JAVA spring cloud 微服务项目

5个Node项目

1个Node项目VUE生成静态页面做前端+nginx



pgsql

redis

rabbitmq

emqx

![micro-service.png](/img/micro-service.png)

![ci-jenkins.png](/img/ci-jenkins.png)
<!--more-->

## 一、项目软件搭建

1，K8S搭建（参考阿良部署文档：kubeadmin安装单主K8S集群）

2，jenkins搭建

https://jenkins.io/doc/book/installing/#fedora

3，Harbor搭建

https://github.com/goharbor/harbor/blob/master/docs/installation_guide.md

4，Sonarqube搭建

sonarqube检测java项目：https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner+for+Maven

sonarqube检测node项目：https://www.npmjs.com/package/sonarqube-scanner

5. fabric8

fabric8io/docker-maven-plugin ： http://dmp.fabric8.io/


## 二、CICD系统中使用的资料

1，jenkins pipeline（JAVA服务的）

```

node {
   def mvnHome = tool 'Maven'
   
   REGISTRY = 'hb.shubing.vip/k12soft'
   //environment { 
   //REGISTRY = 'hb.shubing.vip/k12soft'
   //}
   
   
   stage('Pull Code from Gitlab.') {
        git branch: 'test_4', credentialsId: '1', url: 'http://10.0.0.82:9999/k12soft/xxx.git'
   }
   stage('Maven Package and Sonar.') {
        withMaven(jdk:'JDK'){
       // def  JAVA_HOME = "/usr/lib/jdk1.8.0_121"
        sh "'${mvnHome}/bin/mvn' clean package -e -U -Dmaven.test.skip=true sonar:sonar"
        //sh "'${mvnHome}/bin/mvn' -f ebase-api/pom.xml clean package sonar:sonar"
        }
    }
    
   stage('Build Docker Image.') {
        sh "sudo docker build -t $REGISTRY/${JOB_BASE_NAME}:${BUILD_ID} ."
    }
    stage('Push Docker Image to Harbor.') {
        sh "sudo docker push $REGISTRY/${JOB_BASE_NAME}:${BUILD_ID}"
    }
    stage('Deploy K8S Service.') {
        sh "sudo ssh 'root@10.0.0.102' 'cd /root/xtcloud && sh apply-config.sh ${BUILD_ID} ${JOB_BASE_NAME}'"
        dingTalk accessToken: 'https://oapi.dingtalk.com/robot/send?access_token=8241e530e0f2e68f74da6b78f893e2f526db4086a88e76de7348ddda101f13xx', imageUrl: '', jenkinsUrl: '', message: "  构建& K8S发布成功！", notifyPeople: ''
    }
    
}

```
2，jenkins pipeline（Node服务的）

```

node {
   
   REGISTRY = 'hb.shubing.vip/k12soft'
   stage('Pull Code from Gitlab.') {
        git branch: 'zangyunji', credentialsId: '1', url: 'http://10.0.0.82:9999/k12soft/xxx.git'
   }
   //stage('Node Install Modules.') {
     //   sh "source /etc/profile.d/node.sh && npm i"
    //}
    stage('Node Build and Sonar.') {
        sh "source /etc/profile.d/node.sh && sonar-scanner"
        sh "source /etc/profile.d/node.sh && npm run tsc"
    }
        
   stage('Build Docker Image.') {
        sh "sudo docker build -t $REGISTRY/${JOB_BASE_NAME}:${BUILD_ID} ."
    }
    stage('Push Docker Image to Harbor.') {
        sh "sudo docker push $REGISTRY/${JOB_BASE_NAME}:${BUILD_ID}"
    }
    stage('Deploy K8S Service.') {
        sh "sudo ssh 'root@10.0.0.102' 'cd /root/xtcloud && sh apply-config.sh ${BUILD_ID} ${JOB_BASE_NAME}'"
        dingTalk accessToken: 'https://oapi.dingtalk.com/robot/send?access_token=8241e530e0f2e68f74da6b78f893e2f526db4086a88e76de7348ddda101f13xx', imageUrl: '', jenkinsUrl: '', message: "  构建& K8S发布成功！", notifyPeople: ''
    }
    
    
}
```

3，dockerfile （JAVA服务的）
```
FROM java:8u111
MAINTAINER gongshubing@weds.com.cn
# 定义变量
ENV WORK_DIR /opt
ENV LOG_DIR /data/logs
EXPOSE 8086
# 从主机 copy 到容器里面
COPY target/bepf_archives.jar $WORK_DIR
WORKDIR $WORK_DIR
ENTRYPOINT ["sh", "-c"]
CMD ["java -server -Dspring.profiles.active=ops -Xmx512m -Xms256m -Xmn256m -XX:+UseG1GC -XX:+DisableExplicitGC -Duser.timezone=GMT+8 -jar *.jar > /dev/null"
]
```
4，dockerfile（NODE服务的）
```
FROM node:10.15.3
MAINTAINER gongshubing@weds.com.cn
# 定义变量
ENV WORK_DIR /opt
ENV LOG_DIR /data/logs
ENV EGG_SERVER_ENV ops
EXPOSE 8086
# 从主机 copy 到容器里面
COPY ./ $WORK_DIR/
RUN sed -i 's/\-\-daemon//g' $WORK_DIR/package.json
WORKDIR $WORK_DIR
ENTRYPOINT ["sh", "-c"]
CMD ["npm start"]
```

5，K8S 编排yaml文件（所有项目编排文件一样，不同之处只有镜像URL/IP/PORT）：pod中的日志文件写入nfs
```
# deployment
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: xtcloud-appgateway-deployment
  labels:
    app: xtcloud-appgateway
spec:
  replicas: 1
  selector:
    matchLabels:
      app: xtcloud-appgateway
  template:
    metadata:
      labels:
        app: xtcloud-appgateway
    spec:
      containers:
      - name: xtcloud-appgateway
        image: hb.shubing.vip/k12soft/xtcloud-appgateway:latest
        ports:
        - containerPort: 8097
        volumeMounts:
          - name: xtcloud-logs-persistent-storage
            mountPath: /data/logs
      volumes:
      - name: xtcloud-logs-persistent-storage
        nfs:
          path: /nfs
          server: 10.0.60.67
      imagePullSecrets:
        - name: weds-harbor-secret
# service
---
kind: Service
apiVersion: v1
metadata:
  name: xtcloud-appgateway-service
spec:
  clusterIP: 192.168.1.15
  selector:
    app: xtcloud-appgateway
  ports:
    - protocol: TCP
      port: 8097
      targetPort: 8097

```
6，jenkins调用编排K8s脚本
```
#!/bin/bash

TAG=$1
JOB_NAME=$2

#sed "s/latest/$TAG/" ${JOB_NAME}.yml | kubectl apply -f -
sed "s/latest/$TAG/" ${JOB_NAME}.yml | kubectl replace --force -f -
```
# Introduction
BOS Tech Radar 2.0 provides a 'at-a-glance' view  of the various softwares, tools, platforms and techniques used within an organisation. This library generates an interactive radar, inspired by [thoughtworks.com/radar](http://thoughtworks.com/radar).

# How To Use

## <u>Option 1 </u> <br>
Run two containers in docker, one for the app (frontend + backend) and one for mongoDB
### Docker Image

To run app (server + client)

``` cd app && docker-compose up -ddo ```

To run mongoDB

``` cd mongodb && docker-compose up -d ```


After building it will start on `localhost:8080`


## <u>Option 2 </u> <br>
You can run the frontend and backend locally by navigating to the folders and running npm commands. Be sure to have a running instance of mongodb container. <br><br>
Frontend (./app/frontend): ``` npm run dev ```<br>
Backend (./app/backend): ``` npm start ```

---
## Using JSON data

Another other way to provide your data is using a JSON array.
Use the createBlips endpoint to create multiple blips.
The format of the JSON is an array of objects with the the fields: `name`, `ring`, `quadrant`, `isNew`, and `description`.

An example:

```json
[
  {
    "name": "Composer",
    "ring": "adopt",
    "quadrant": "tools",
    "isNew": "TRUE",
    "isDeleted": "FALSE",
    "description": "Although the idea of dependency management ..."
  },
  {
    "name": "Canary builds",
    "ring": "trial",
    "quadrant": "techniques",
    "isNew": "FALSE",
    "isDeleted": "FALSE",
    "description": "Many projects have external code dependencies ..."
  },
  {
    "name": "Apache Kylin",
    "ring": "assess",
    "quadrant": "platforms",
    "isNew": "TRUE",
    "isDeleted": "FALSE",
    "description": "Apache Kylin is an open source analytics solution ..."
  },
  {
    "name": "JSF",
    "ring": "hold",
    "quadrant": "languages & frameworks",
    "isNew": "FALSE",
    "isDeleted": "FALSE",
    "description": "We continue to see teams run into trouble using JSF ..."
  }
]
```

**_Note:_** The JSON file parsing is using D3 library, so consult the [D3 documentation](https://github.com/d3/d3-request/blob/master/README.md#json) for the data format details.

If you are running this on an EC2 instance, be sure to change radar.js & factory.js's __SERVER_URL__ variable from localhost to the elastic IP.

<br>

# Hosting on AWS EC2 cloud
## 1. <u>Create AWS infrastructures </u>
- Create VPC + 2 subnets (public,private) + route tables + internetgateway(igw)
- create an EC2 instance
  - Choose linux OS free tier
  - Create a key (this is for SSH into EC2 instance) )(Save key-value on local directory)
  - Ensure EC2 is created on public subnet
  - Add or create appropriate security group access control (port 80, port 22 SSH) < inbound
- create an elastic ip
  - Associate EIP to EC2 instance
## 2. <u>Install Docker on EC2 </u>[Guide](https://medium.com/appgambit/part-1-running-docker-on-aws-ec2-cbcf0ec7c3f8)
- Download Putty
  - SSH into the ec2 instance through Putty and run the bash commands to install docker.
  ```
    sudo docker install commands
	sudo yum update -y
	sudo amazon-linux-extras install docker
	sudo service docker start
	sudo usermod -a -G docker ec2-user
	```
	OR
	```
	Sudo systemctl start docker
  ```
- Install docker-compose
  ```
  sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
  ```
- Fix docker-compose permission
  ```
  sudo chmod +x /usr/local/bin/docker-compose
## 3. <u>Creating app docker image for cloud </u>
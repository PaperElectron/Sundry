# Sundry

### The respectably rugged, remarkably reliable, reconfigurable, round-robin reverse proxy.


Sundry is a caching, dynamically configurable, reverse proxy, written in NodeJS and backed by redis.

### Cool Stuff
* Dynamically add and remove hosts and backends with 0 downtime.
* Wildcard https, http -> https redirect built in. 
* Centralize request logging and error handling without exposing backend errors. 
* Programically control backend access in real time.

### Features 
* Separate CLI app to view and manage hosts and routes.
* Really, Really fast, workload is very nearly 100% Asyncronous (Aside from a couple of ifs and assigments on each request)
* System Daemon, can drop privleges to bind to ports 80 and 443, or use [Authbind](http://manpages.ubuntu.com/manpages/hardy/man1/authbind.1.html).

## Installation and setup

### Requirements

* Redis server (with events enabled) 
  * Preferably local to the Sundry server, bare minimum on the local network.
  * "notify-keyspace-events" 
  * With "gsE" events enabled.
  * [More Info on Redis keyspace events](http://redis.io/topics/notifications)

* NodeJS v.11.0 +
* [AuthBind](http://manpages.ubuntu.com/manpages/hardy/man1/authbind.1.html) for port 80/443 bindings as non root user.
* [Upstart](http://upstart.ubuntu.com/) for running as a system daemon.

## Install Sundry

#### Installation

```shell
$ npm install -g sundry
```

#### Configuration 
Sundry relies on several configuration values, all of which can be provided in two ways.

1. Enviornment Variables. (Useful for running as a system daemon)
2. Values in $HOME/.sundry/config.json

You can generate a skeleton config by running...

```shell
$ sundry config build
```
This will create `~/.sundry/`, `~/.sundry/ssl` and `~/.sundry/config.json`

#### Default files

Sundry uses some generic files for its default host, 404 and 500 error pages.
You can override any of these by placing the correctly named file in 
`~/.sundry/html/<index/404/5xx>.html`

## Run Sundry

#### Production (some recent flavor of Ubuntu assumed.)
###### Create a new system user
```shell
$ sudo adduser --disabled-password sundry
```
###### Build default config (Optional)
```shell
$ sudo su -- sundry
$ sundry config build
```

###### Install/configure authbind
```shell
$ sudo apt-get install authbind
$ sudo touch /etc/authbind/byport/80 /etc/authbind/byport/443
$ sudo chown sundry:sundry /etc/authbind/byport/80 /etc/authbind/byport/443
$ sudo chmod 755 /etc/authbind/byport/80 /etc/authbind/byport/443
```

###### Create sundry.conf upstart file.

```shell
$ sudo touch /etc/init/sundry.conf
$ sudo <vi/emacs/nano/ed> /etc/init/sundry.conf 
# no flame wars here
```

```
description "Sundry Dynamic Router"
author      "PaperElectron"

start on (local-filesystems and net-device-up IFACE=eth0)
stop on shutdown

# Automatically Respawn:
respawn
respawn limit 5 60
 
script
  export HOME=/home/sundry
  export NODE_ENV=production
  exec start-stop-daemon --start -u sundry --exec /usr/bin/authbind sundry start
end script
```
#### Test / Development
###### Generate a self signed cert.
Browsers will flag this as an insecure certificate.

```shell
$ cd ~/.sundry/ssl
$ openssl genrsa -out key.pem 2048
$ openssl req -new -key key.pem -out server.csr
$ openssl x509 -req -days 365 -in server.csr -signkey key.pem -out cert.pem
```
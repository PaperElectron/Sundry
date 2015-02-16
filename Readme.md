# OctoRP

### The respectably rugged, remarkably reliable, reconfigurable, round-robin reverse proxy.


OctoRP is a caching, dynamically configurable, reverse proxy, written in NodeJS and backed by redis.

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

#### Requirements

* Redis server (with events enabled) 
  * Preferably local to the OctoRP server, bare minimum on the local network.
  * "notify-keyspace-events" 
  * With "gsE" events enabled.
  * [More Info on Redis keyspace events](http://redis.io/topics/notifications)

* NodeJS v.11.0 +
* [Upstart](http://upstart.ubuntu.com/)

#### Install OctoRP
```shell
$ npm install -g octorp
```
    
#### Test / Development
###### Start an interactive session to add, remove and list hosts and their corresponding backends.
   
```shell 
$ octorp -i 
```
Need more help?
```shell
$ octorp
$ octorp --help
$ octorp <add/list/start> --help
```
***
###### Initial server startup
This will create `~/.octorp/`, `~/.octorp/ssl` and `~/.octorp/`config.json
then exit.  

```shell
$ octorp start
```
Edit `~/.octorp/config.json` with the relevant settings (can/will be overidden with any ENV variables that are set.
***
###### Generate a self signed cert.
```shell
$ cd ~/.octorp/ssl
$ openssl genrsa -out server.key 2048
$ openssl req -new -key key.pem -out server.csr

```
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

##Installation and setup

    $npm install -g octorp

